import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { isPublicRasterImage, toPublicWebp, withPublicWebpExt } from './to-public-webp';

export type UploadInput = {
  /** Logical folder prefix, e.g. customers, lodats, transactions */
  folder: string;
  buffer: Buffer;
  contentType: string;
  originalName?: string;
  /** Server-chosen key (SEO filename). If omitted, UUID under `folder`. */
  objectKey?: string;
  /** ASCII filename for Content-Disposition (Google / download). */
  contentFileName?: string;
};

export type StorageVisibility = 'public' | 'private';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('R2_ENDPOINT') &&
        this.config.get<string>('R2_ACCESS_KEY_ID') &&
        this.config.get<string>('R2_SECRET_ACCESS_KEY') &&
        this.config.get<string>('R2_BUCKET') &&
        this.config.get<string>('R2_PUBLIC_BASE_URL'),
    );
  }

  /** Private bucket configured (secret docs). Soft-required in production. */
  isPrivateConfigured(): boolean {
    return this.isConfigured() && Boolean(this.config.get<string>('R2_PRIVATE_BUCKET'));
  }

  private getClient(): S3Client {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Cloudflare R2 chưa được cấu hình (xem ADR 0005 / skill cloudflare-r2)',
      );
    }
    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: this.config.getOrThrow<string>('R2_ENDPOINT'),
        credentials: {
          accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
          secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
        },
        // R2 rejects AWS SDK default checksum headers and may store octet-stream.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
    }
    return this.client;
  }

  private publicBucket(): string {
    return this.config.getOrThrow<string>('R2_BUCKET');
  }

  private privateBucket(): string {
    const bucket = this.config.get<string>('R2_PRIVATE_BUCKET');
    if (!bucket) {
      throw new ServiceUnavailableException(
        'R2_PRIVATE_BUCKET chưa cấu hình — tạo bucket anhungland-crm-private (xem docs/R2-SETUP.md)',
      );
    }
    return bucket;
  }

  private bucketFor(visibility: StorageVisibility): string {
    return visibility === 'private' ? this.privateBucket() : this.publicBucket();
  }

  buildObjectKey(folder: string, originalName?: string): string {
    const ext = originalName
      ? path.extname(originalName).toLowerCase().slice(0, 12)
      : '';
    const safeFolder = folder
      .replace(/[^a-z0-9/_-]/gi, '')
      .replace(/^\/+|\/+$/g, '');
    return `${safeFolder}/${randomUUID()}${ext}`;
  }

  private sanitizeObjectKey(objectKey: string): string {
    const clean = objectKey.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!clean || clean.includes('..') || clean.split('/').some((p) => p === '')) {
      throw new ServiceUnavailableException('objectKey ảnh không hợp lệ');
    }
    return clean;
  }

  private contentDisposition(fileName?: string): string | undefined {
    const safe = fileName?.replace(/[^a-zA-Z0-9._-]/g, '');
    if (!safe) return undefined;
    return `inline; filename="${safe}"`;
  }

  publicUrl(objectKey: string): string {
    const base = (this.config.get<string>('R2_PUBLIC_BASE_URL') ?? '').replace(
      /\/$/,
      '',
    );
    return `${base}/${objectKey.replace(/^\//, '')}`;
  }

  private async preparePublicRaster(input: UploadInput): Promise<UploadInput> {
    const hintName = input.objectKey || input.contentFileName || input.originalName;
    if (!isPublicRasterImage(input.contentType, hintName)) return input;
    try {
      const webp = await toPublicWebp(input.buffer);
      return {
        ...input,
        buffer: webp.buffer,
        contentType: webp.contentType,
        originalName: input.originalName ? withPublicWebpExt(input.originalName) : input.originalName,
        objectKey: input.objectKey ? withPublicWebpExt(input.objectKey) : input.objectKey,
        contentFileName: input.contentFileName
          ? withPublicWebpExt(input.contentFileName)
          : input.contentFileName,
      };
    } catch (err) {
      this.logger.warn('WebP convert failed', err as Error);
      throw new ServiceUnavailableException('Không chuyển được ảnh sang WebP');
    }
  }

  /**
   * Public assets (ảnh lô đất marketing, avatar…): bucket + cdn.anhungland.com
   * Raster images are encoded WebP (sharp) before PutObject.
   */
  async upload(
    input: UploadInput,
  ): Promise<{ objectKey: string; url: string; visibility: 'public' }> {
    const prepared = await this.preparePublicRaster(input);
    const objectKey = prepared.objectKey
      ? this.sanitizeObjectKey(prepared.objectKey)
      : this.buildObjectKey(prepared.folder, prepared.originalName);
    await this.putObject('public', objectKey, prepared);
    return {
      objectKey,
      url: this.publicUrl(objectKey),
      visibility: 'public',
    };
  }

  async publicObjectExists(objectKey: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      await this.getClient().send(
        new HeadObjectCommand({
          Bucket: this.publicBucket(),
          Key: objectKey.replace(/^\//, ''),
        }),
      );
      return true;
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === 'NotFound' || name === 'NoSuchKey') return false;
      const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode;
      if (status === 404) return false;
      throw err;
    }
  }

  /** Idempotent public put with a chosen key (migrate avatars, keep filename). */
  async uploadPublicAtKey(
    objectKey: string,
    input: Omit<UploadInput, 'folder' | 'originalName' | 'objectKey'>,
  ): Promise<{ objectKey: string; url: string; visibility: 'public' }> {
    const key = this.sanitizeObjectKey(objectKey);
    await this.putObject('public', key, {
      folder: '',
      buffer: input.buffer,
      contentType: input.contentType,
      contentFileName: input.contentFileName,
    });
    return { objectKey: key, url: this.publicUrl(key), visibility: 'public' };
  }

  /** List public object keys (one-shot convert scripts). */
  async listPublicObjectKeys(prefix?: string): Promise<string[]> {
    const keys: string[] = [];
    let token: string | undefined;
    const bucket = this.publicBucket();
    const cleanPrefix = prefix?.replace(/^\/+/, '') || undefined;
    do {
      const res = await this.getClient().send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: cleanPrefix,
          ContinuationToken: token,
          MaxKeys: 1000,
        }),
      );
      for (const obj of res.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key);
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return keys;
  }

  /** Read a public object (copy chat image → SEO key). */
  async getPublicObject(
    objectKey: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    if (!this.isConfigured()) return null;
    try {
      const res = await this.getClient().send(
        new GetObjectCommand({
          Bucket: this.publicBucket(),
          Key: this.sanitizeObjectKey(objectKey),
        }),
      );
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes?.length) return null;
      return {
        buffer: Buffer.from(bytes),
        contentType: res.ContentType || 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }

  /**
   * Server-side copy in the public bucket (old UUID / IMG_* → SEO filename).
   * Caller deletes the source after DB retarget when nothing else points at it.
   */
  async copyPublicObject(
    fromKey: string,
    toKey: string,
    contentFileName?: string,
  ): Promise<void> {
    const from = this.sanitizeObjectKey(fromKey);
    const to = this.sanitizeObjectKey(toKey);
    if (from === to) return;
    const bucket = this.publicBucket();
    let contentType = 'image/jpeg';
    try {
      const head = await this.getClient().send(
        new HeadObjectCommand({ Bucket: bucket, Key: from }),
      );
      if (head.ContentType) contentType = head.ContentType;
    } catch (err) {
      this.logger.error(`R2 HeadObject failed for ${from}`, err as Error);
      throw new ServiceUnavailableException('Không đọc được ảnh nguồn trên R2');
    }
    const copySource = `${bucket}/${from.split('/').map(encodeURIComponent).join('/')}`;
    try {
      await this.getClient().send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: copySource,
          Key: to,
          ContentType: contentType,
          ContentDisposition: this.contentDisposition(
            contentFileName || path.basename(to),
          ),
          MetadataDirective: 'REPLACE',
        }),
      );
    } catch (err) {
      this.logger.error(`R2 CopyObject ${from} → ${to} failed`, err as Error);
      throw new ServiceUnavailableException('Không copy được ảnh sang tên SEO');
    }
  }

  /**
   * Tài liệu mật (hợp đồng, giấy tờ…): bucket private, không CDN public.
   * Client chỉ xem qua signed URL từ API (có hạn).
   */
  async uploadPrivate(
    input: UploadInput,
  ): Promise<{ objectKey: string; visibility: 'private' }> {
    const objectKey = this.buildObjectKey(input.folder, input.originalName);
    await this.putObject('private', objectKey, input);
    return { objectKey, visibility: 'private' };
  }

  /**
   * Link tạm để xem/tải file mật (mặc định 15 phút).
   * Chỉ gọi sau khi API đã check quyền user.
   */
  async getPrivateSignedUrl(
    objectKey: string,
    expiresInSeconds = 15 * 60,
  ): Promise<string> {
    try {
      return await getSignedUrl(
        this.getClient(),
        new GetObjectCommand({
          Bucket: this.privateBucket(),
          Key: objectKey.replace(/^\//, ''),
        }),
        { expiresIn: expiresInSeconds },
      );
    } catch (err) {
      this.logger.error(`R2 signed URL failed for ${objectKey}`, err as Error);
      throw new ServiceUnavailableException('Không tạo được link tải tài liệu mật');
    }
  }

  async delete(
    objectKey: string,
    visibility: StorageVisibility = 'public',
  ): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }
    if (visibility === 'private' && !this.isPrivateConfigured()) {
      return;
    }
    try {
      await this.getClient().send(
        new DeleteObjectCommand({
          Bucket: this.bucketFor(visibility),
          Key: objectKey.replace(/^\//, ''),
        }),
      );
    } catch (err) {
      this.logger.warn(`R2 DeleteObject failed for ${objectKey}`, err as Error);
    }
  }

  private async putObject(
    visibility: StorageVisibility,
    objectKey: string,
    input: UploadInput,
  ): Promise<void> {
    try {
      await this.getClient().send(
        new PutObjectCommand({
          Bucket: this.bucketFor(visibility),
          Key: objectKey,
          Body: input.buffer,
          ContentType: input.contentType,
          ContentDisposition: this.contentDisposition(
            input.contentFileName || path.basename(objectKey),
          ),
        }),
      );
    } catch (err) {
      this.logger.error(
        `R2 PutObject (${visibility}) failed for ${objectKey}`,
        err as Error,
      );
      throw new ServiceUnavailableException(
        visibility === 'private'
          ? 'Không tải được tài liệu mật lên R2'
          : 'Không tải được file lên R2',
      );
    }
  }
}
