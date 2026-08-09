import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export type UploadInput = {
  /** Logical folder prefix, e.g. customers, lodats, transactions */
  folder: string;
  buffer: Buffer;
  contentType: string;
  originalName?: string;
};

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

  private getClient(): S3Client {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Cloudflare R2 chưa được cấu hình (xem ADR 0005 / .env.example)',
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

  buildObjectKey(folder: string, originalName?: string): string {
    const ext = originalName
      ? path.extname(originalName).toLowerCase().slice(0, 12)
      : '';
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '');
    return `${safeFolder}/${randomUUID()}${ext}`;
  }

  publicUrl(objectKey: string): string {
    const base = (this.config.get<string>('R2_PUBLIC_BASE_URL') ?? '').replace(
      /\/$/,
      '',
    );
    return `${base}/${objectKey.replace(/^\//, '')}`;
  }

  async upload(input: UploadInput): Promise<{ objectKey: string; url: string }> {
    const objectKey = this.buildObjectKey(input.folder, input.originalName);
    const bucket = this.config.getOrThrow<string>('R2_BUCKET');
    try {
      await this.getClient().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: input.buffer,
          ContentType: input.contentType,
        }),
      );
    } catch (err) {
      this.logger.error(`R2 PutObject failed for ${objectKey}`, err as Error);
      throw new ServiceUnavailableException('Không tải được file lên R2');
    }
    return { objectKey, url: this.publicUrl(objectKey) };
  }

  async delete(objectKey: string): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }
    const bucket = this.config.getOrThrow<string>('R2_BUCKET');
    try {
      await this.getClient().send(
        new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }),
      );
    } catch (err) {
      this.logger.warn(`R2 DeleteObject failed for ${objectKey}`, err as Error);
    }
  }
}
