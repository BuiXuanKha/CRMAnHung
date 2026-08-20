/**
 * Upload mirrored customer avatars from the old CRM disk to public R2.
 * READ-ONLY on `/var/www/anhungland-crm/api/img/avatars` and old SQLite.
 * Updates Postgres CustomerFacebook.avatarObjectKey. Does not delete old files.
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_AVATAR_DIR=/var/www/anhungland-crm/api/img/avatars \
 *     pnpm exec tsx scripts/migrate-avatars-to-r2.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

const DEFAULT_DIR = '/var/www/anhungland-crm/api/img/avatars';
const KEY_PREFIX = 'customers/avatars/';
const CONCURRENCY = 8;

function loadDotEnv(file: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    env[t.slice(0, i)] = t.slice(i + 1).replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function safeBasename(storedPath: string): string | null {
  const base = path.basename(storedPath);
  if (!/^[a-zA-Z0-9._-]+$/.test(base)) return null;
  return base;
}

async function mapPool<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      await fn(items[index], index);
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
}

async function main() {
  const avatarDir = process.env.LEGACY_AVATAR_DIR ?? DEFAULT_DIR;
  if (!existsSync(avatarDir)) {
    throw new Error(`Không thấy thư mục avatar: ${avatarDir}`);
  }

  const env = { ...loadDotEnv(path.join(process.cwd(), '.env')), ...process.env };
  const required = [
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
    'R2_PUBLIC_BASE_URL',
  ] as const;
  const missing = required.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Thiếu biến R2: ${missing.join(', ')}`);
  }

  const prisma = new PrismaClient();
  const s3 = new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  const bucket = env.R2_BUCKET;
  const cdn = env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');

  const rows = await prisma.customerFacebook.findMany({
    where: {
      avatarUrl: { startsWith: '/img/avatars/' },
    },
    select: { id: true, avatarUrl: true, avatarObjectKey: true },
  });
  console.log(`Postgres: ${rows.length} khách có path /img/avatars/.`);

  let uploaded = 0;
  let skippedExists = 0;
  let skippedMissing = 0;
  let failed = 0;

  await mapPool(rows, CONCURRENCY, async (row) => {
    const stored = String(row.avatarUrl ?? '').trim();
    const base = safeBasename(stored);
    if (!base) {
      console.warn(`  Bỏ ${row.id}: path không hợp lệ ${stored}`);
      skippedMissing += 1;
      return;
    }
    const abs = path.join(avatarDir, base);
    if (!existsSync(abs)) {
      console.warn(`  Bỏ ${row.id}: không có file ${base}`);
      skippedMissing += 1;
      return;
    }

    const objectKey = `${KEY_PREFIX}${base}`;
    if (row.avatarObjectKey === objectKey) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
        skippedExists += 1;
        return;
      } catch {
        // re-upload
      }
    }

    try {
      const buffer = readFileSync(abs);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: buffer,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      await prisma.customerFacebook.update({
        where: { id: row.id },
        data: { avatarObjectKey: objectKey },
      });
      uploaded += 1;
      if (uploaded % 200 === 0) {
        console.log(`  … đã upload ${uploaded}/${rows.length}`);
      }
    } catch (err) {
      failed += 1;
      console.warn(`  Lỗi ${base}:`, (err as Error).message);
    }
  });

  const mapped = await prisma.customerFacebook.count({
    where: { avatarObjectKey: { not: null } },
  });
  await prisma.$disconnect();
  s3.destroy();

  console.log(
    `Xong avatar R2: upload ${uploaded}, đã có ${skippedExists}, thiếu file ${skippedMissing}, lỗi ${failed}.`,
  );
  console.log(`DB avatarObjectKey: ${mapped}. CDN mẫu: ${cdn}/${KEY_PREFIX}<file>`);
  console.log('Không ghi SQLite / không xóa file cũ. Chưa copy ảnh chat / lô đất.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
