/**
 * Copy tblPersonMessenger + ảnh imgsmessenger → Postgres + R2 public.
 * READ-ONLY on old SQLite and `/var/www/anhungland-crm/api/img/imgsmessenger`.
 *
 * Maps: `customer_messenger`, `customer_messenger_image`.
 * Needs map `customer_facebook`.
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *   LEGACY_CHAT_DIR=/var/www/anhungland-crm/api/img/imgsmessenger \
 *     pnpm exec tsx scripts/migrate-chat-from-legacy.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

const MSG_ENTITY = 'customer_messenger';
const IMG_ENTITY = 'customer_messenger_image';
const FACEBOOK_ENTITY = 'customer_facebook';
const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';
const DEFAULT_DIR = '/var/www/anhungland-crm/api/img/imgsmessenger';
const KEY_PREFIX = 'customers/chat/';
const PAGE = 200;
const CONCURRENCY = 8;

type LegacyMessage = {
  ID: number;
  PersonFacebookId: number;
  SortOrder: number | null;
  MessageId: string | null;
  Sender: string | null;
  SenderUid: string | null;
  MessageText: string | null;
  DedupeKey: string | null;
};

type LegacyImage = {
  ID: number;
  MessengerRowId: number;
  StoredPath: string;
  ImageIndex: number | null;
  CreatedAtMs: number | null;
  RotationDeg: number | null;
};

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

function sqliteJson<T>(sqlitePath: string, sql: string): T[] {
  const json = execFileSync('sqlite3', ['-json', sqlitePath, sql], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
  if (!json) return [];
  return JSON.parse(json) as T[];
}

function trimOrNull(value: string | null | undefined): string | null {
  const t = String(value ?? '').trim();
  return t ? t : null;
}

function parseStoredPath(
  stored: string,
): { personId: string; fileName: string } | null {
  const normalized = stored.replace(/\\/g, '/').trim();
  const match = /^\/img\/imgsmessenger\/(\d+)\/([^/]+)$/.exec(normalized);
  if (!match) return null;
  if (match[2].includes('..')) return null;
  return { personId: match[1], fileName: match[2] };
}

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

async function mapPool<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      await fn(items[index]);
    }
  }
  const n = Math.min(Math.max(1, limit), Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
}

async function loadMap(
  prisma: PrismaClient,
  entity: string,
): Promise<Map<string, string>> {
  const rows = await prisma.$queryRaw<Array<{ old_id: string; new_id: string }>>`
    SELECT old_id, new_id FROM migrate.legacy_id_map WHERE entity = ${entity}
  `;
  return new Map(rows.map((r) => [r.old_id, r.new_id]));
}

async function upsertMap(
  prisma: PrismaClient,
  entity: string,
  oldId: number,
  newId: string,
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO migrate.legacy_id_map (entity, old_id, new_id)
    VALUES (${entity}, ${String(oldId)}, ${newId})
    ON CONFLICT (entity, old_id) DO UPDATE SET new_id = EXCLUDED.new_id, copied_at = NOW()
  `;
}

async function objectExists(
  s3: S3Client,
  bucket: string,
  key: string,
): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const sqlitePath = process.env.LEGACY_SQLITE ?? DEFAULT_SQLITE;
  const chatDir = process.env.LEGACY_CHAT_DIR ?? DEFAULT_DIR;
  if (!existsSync(sqlitePath)) {
    throw new Error(`Không thấy SQLite: ${sqlitePath}`);
  }
  if (!existsSync(chatDir)) {
    throw new Error(`Không thấy thư mục ảnh chat: ${chatDir}`);
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

  const force = process.env.FORCE_CHAT_UPLOAD === '1';
  const prisma = new PrismaClient();
  const s3 = new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  const bucket = env.R2_BUCKET;

  await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS migrate');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS migrate.legacy_id_map (
      entity TEXT NOT NULL,
      old_id TEXT NOT NULL,
      new_id TEXT NOT NULL,
      copied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (entity, old_id)
    )
  `);

  const facebookMap = await loadMap(prisma, FACEBOOK_ENTITY);
  if (facebookMap.size === 0) {
    throw new Error('Chưa có map customer_facebook. Chạy facebook-profiles:migrate-legacy trước.');
  }

  const totalRow = sqliteJson<{ c: number }>(
    sqlitePath,
    'SELECT COUNT(*) AS c FROM tblPersonMessenger',
  );
  const total = Number(totalRow[0]?.c ?? 0);
  console.log(`Đọc ${total} tin nhắn từ SQLite (từng lô, chỉ đọc).`);

  const msgMap = await loadMap(prisma, MSG_ENTITY);
  const imgMap = await loadMap(prisma, IMG_ENTITY);
  let copiedMsg = 0;
  let skippedMsg = 0;
  let copiedImg = 0;
  let skippedImgExists = 0;
  let skippedImgMissing = 0;
  let failedImg = 0;

  let offset = 0;
  while (offset < total) {
    const rows = sqliteJson<LegacyMessage>(
      sqlitePath,
      `SELECT ID, PersonFacebookId, SortOrder, MessageId, Sender, SenderUid, MessageText, DedupeKey
       FROM tblPersonMessenger
       ORDER BY ID
       LIMIT ${PAGE} OFFSET ${offset}`,
    );
    if (rows.length === 0) break;

    const pageNewIds: number[] = [];
    for (const row of rows) {
      const facebookId = facebookMap.get(String(row.PersonFacebookId));
      if (!facebookId) {
        skippedMsg += 1;
        continue;
      }
      const data = {
        customerFacebookId: facebookId,
        externalMessageId: trimOrNull(row.MessageId),
        body: trimOrNull(row.MessageText),
        sender: trimOrNull(row.Sender),
        senderUid: trimOrNull(row.SenderUid),
        dedupeKey: trimOrNull(row.DedupeKey),
        sortOrder: Number(row.SortOrder) || 0,
      };
      const mappedId = msgMap.get(String(row.ID));
      const existing = mappedId
        ? await prisma.customerMessengerMessage.findUnique({ where: { id: mappedId } })
        : null;
      const saved = existing
        ? await prisma.customerMessengerMessage.update({
            where: { id: existing.id },
            data,
          })
        : await prisma.customerMessengerMessage.create({ data });
      await upsertMap(prisma, MSG_ENTITY, row.ID, saved.id);
      msgMap.set(String(row.ID), saved.id);
      copiedMsg += 1;
      pageNewIds.push(row.ID);
    }

    if (pageNewIds.length > 0) {
      const idList = pageNewIds.join(',');
      const images = sqliteJson<LegacyImage>(
        sqlitePath,
        `SELECT ID, MessengerRowId, StoredPath, ImageIndex, CreatedAtMs, RotationDeg
         FROM tblPersonMessengerImages
         WHERE MessengerRowId IN (${idList})
         ORDER BY ID`,
      );

      await mapPool(images, CONCURRENCY, async (img) => {
        const messageId = msgMap.get(String(img.MessengerRowId));
        if (!messageId) {
          skippedImgMissing += 1;
          return;
        }
        const stored = String(img.StoredPath || '').trim();
        const parsed = parseStoredPath(stored);
        if (!parsed) {
          console.warn(`  Bỏ ảnh ID=${img.ID}: path không hợp lệ ${stored}`);
          skippedImgMissing += 1;
          return;
        }
        const abs = path.join(chatDir, parsed.personId, parsed.fileName);
        if (!existsSync(abs)) {
          skippedImgMissing += 1;
          return;
        }
        const objectKey = `${KEY_PREFIX}${parsed.personId}/${parsed.fileName}`;
        const mappedImgId = imgMap.get(String(img.ID));
        const existingImg = mappedImgId
          ? await prisma.customerMessengerImage.findUnique({
              where: { id: mappedImgId },
            })
          : null;

        if (!force && existingImg?.objectKey === objectKey) {
          const ok = await objectExists(s3, bucket, objectKey);
          if (ok) {
            await prisma.customerMessengerImage.update({
              where: { id: existingImg.id },
              data: {
                sortOrder: Number(img.ImageIndex) || 0,
                rotationDeg: Number(img.RotationDeg) || 0,
                originalPath: stored,
              },
            });
            skippedImgExists += 1;
            return;
          }
        }

        try {
          const buffer = readFileSync(abs);
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: objectKey,
              Body: buffer,
              ContentType: contentTypeFor(parsed.fileName),
              CacheControl: 'public, max-age=31536000, immutable',
            }),
          );
          const imgData = {
            messageId,
            objectKey,
            originalPath: stored,
            sortOrder: Number(img.ImageIndex) || 0,
            rotationDeg: Number(img.RotationDeg) || 0,
          };
          const savedImg = existingImg
            ? await prisma.customerMessengerImage.update({
                where: { id: existingImg.id },
                data: imgData,
              })
            : await prisma.customerMessengerImage.create({ data: imgData });
          await upsertMap(prisma, IMG_ENTITY, img.ID, savedImg.id);
          imgMap.set(String(img.ID), savedImg.id);
          copiedImg += 1;
        } catch (err) {
          failedImg += 1;
          console.warn(`  Lỗi ảnh ${parsed.fileName}:`, (err as Error).message);
        }
      });
    }

    offset += rows.length;
    console.log(
      `  … tin ${copiedMsg}/${total} (bỏ ${skippedMsg}); ảnh upload ${copiedImg}, đã có ${skippedImgExists}, thiếu ${skippedImgMissing}, lỗi ${failedImg}`,
    );
  }

  await prisma.$disconnect();
  s3.destroy();
  console.log(
    `Xong chat: tin ${copiedMsg}/${total} (bỏ ${skippedMsg}). Ảnh upload ${copiedImg}, đã có ${skippedImgExists}, thiếu file ${skippedImgMissing}, lỗi ${failedImg}.`,
  );
  console.log('Không ghi SQLite / không xóa file cũ.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
