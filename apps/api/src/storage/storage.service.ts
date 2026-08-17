import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export type UploadInput = {
  /** Logical folder prefix, e.g. customers, lodats, transactions */
  folder: string;
  buffer: Buffer;
  contentType: string;
  originalName?: string;
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

  publicUrl(objectKey: string): string {
    const base = (this.config.get<string>('R2_PUBLIC_BASE_URL') ?? '').replace(
      /\/$/,
      '',
    );
    return `${base}/${objectKey.replace(/^\//, '')}`;
  }

  /**
   * Public assets (ảnh lô đất marketing, avatar…): bucket + cdn.anhungland.com
   */
  async upload(
    input: UploadInput,
  ): Promise<{ objectKey: string; url: string; visibility: 'public' }> {
    const objectKey = this.buildObjectKey(input.folder, input.originalName);
    await this.putObject('public', objectKey, input);
    return {
      objectKey,
      url: this.publicUrl(objectKey),
      visibility: 'public',
    };
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
