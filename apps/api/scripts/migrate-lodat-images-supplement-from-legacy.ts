/**
 * Pass bổ sung ảnh lô (sau `pnpm lodats:migrate-legacy`):
 *  1) REGULAR + path `/img/imgsmessenger/...` — gắn LodatImage trỏ cùng objectKey
 *     chat đã có trên R2 (`customers/chat/...`); không nhân bản file.
 *  2) PROJECT `tblLodatImages` — ảnh riêng thửa (messenger + `/img/lodats/...`)
 *     gắn vào Lodat stream `p:{lodatId}:{CreatedByEmployeeId}` (giữ kha/buinam).
 *
 * READ-ONLY on SQLite + img/. Idempotent qua `migrate.legacy_id_map` entity `lodat_image`.
 *
 * Usage (VPS, apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *   LEGACY_LODAT_IMG_DIR=/var/www/anhungland-crm/api/img/lodats \
 *   LEGACY_CHAT_DIR=/var/www/anhungland-crm/api/img/imgsmessenger \
 *     pnpm lodats:migrate-images-supplement
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

const IMAGE_ENTITY = 'lodat_image';
const LODAT_ENTITY = 'lodat';

const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';
const DEFAULT_LODAT_IMG_DIR = '/var/www/anhungland-crm/api/img/lodats';
const DEFAULT_CHAT_DIR = '/var/www/anhungland-crm/api/img/imgsmessenger';
const LODAT_KEY_PREFIX = 'lodats/';
const CHAT_KEY_PREFIX = 'customers/chat/';
const CONCURRENCY = 6;

type LegacyImageRow = {
  ID: number;
  LodatId: number;
  StoredPath: string;
  SortOrder: number | null;
  CreatedAtMs: number | null;
  CreatedByEmployeeId: number | null;
  AddrKind: string;
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
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
  if (!json) return [];
  return JSON.parse(json) as T[];
}

function toDate(ms: number | null | undefined): Date {
  if (ms && Number.isFinite(Number(ms))) return new Date(Number(ms));
  return new Date();
}

function projectStreamKey(lodatId: number, employeeId: number): string {
  return `p:${lodatId}:${employeeId}`;
}

function parseLodatPath(stored: string): string | null {
  const normalized = stored.replace(/\\/g, '/').trim();
  const match = /^\/img\/lodats\/([^/]+)$/.exec(normalized);
  if (!match) return null;
  const fileName = match[1];
  if (!fileName || fileName.includes('..') || !/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    return null;
  }
  return fileName;
}

function parseMessengerPath(
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
  oldId: string | number,
  newId: string,
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO migrate.legacy_id_map (entity, old_id, new_id)
    VALUES (${entity}, ${String(oldId)}, ${newId})
    ON CONFLICT (entity, old_id) DO UPDATE SET new_id = EXCLUDED.new_id, copied_at = NOW()
  `;
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

async function ensureObject(
  s3: S3Client,
  bucket: string,
  objectKey: string,
  absPath: string,
  force: boolean,
): Promise<void> {
  if (!force && (await objectExists(s3, bucket, objectKey))) return;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: readFileSync(absPath),
      ContentType: contentTypeFor(path.basename(absPath)),
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}

async function main() {
  const sqlitePath = process.env.LEGACY_SQLITE ?? DEFAULT_SQLITE;
  const lodatImgDir = process.env.LEGACY_LODAT_IMG_DIR ?? DEFAULT_LODAT_IMG_DIR;
  const chatDir = process.env.LEGACY_CHAT_DIR ?? DEFAULT_CHAT_DIR;
  if (!existsSync(sqlitePath)) {
    throw new Error(`Không thấy SQLite: ${sqlitePath}`);
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
  const lodatMap = await loadMap(prisma, LODAT_ENTITY);
  if (lodatMap.size === 0) {
    throw new Error('Chưa có map lodat — chạy pnpm lodats:migrate-legacy trước.');
  }

  const rows = sqliteJson<LegacyImageRow>(
    sqlitePath,
    `SELECT i.ID, i.LodatId, i.StoredPath, i.SortOrder, i.CreatedAtMs, i.CreatedByEmployeeId,
            a.Kind AS AddrKind
     FROM tblLodatImages i
     JOIN tblLodats l ON l.ID = i.LodatId
     JOIN tblAddresses a ON a.ID = l.AddressId
     WHERE a.Kind = 'PROJECT'
        OR (a.Kind = 'REGULAR' AND i.StoredPath LIKE '%/img/imgsmessenger/%')
     ORDER BY a.Kind, i.LodatId, i.SortOrder, i.ID`,
  );

  const regularMsg = rows.filter(
    (r) => r.AddrKind === 'REGULAR' && String(r.StoredPath).includes('imgsmessenger'),
  ).length;
  const projectRows = rows.filter((r) => r.AddrKind === 'PROJECT').length;
  console.log(
    `Supplement: ${rows.length} ảnh (REGULAR messenger=${regularMsg}, PROJECT=${projectRows}).`,
  );

  const s3 = new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  const bucket = env.R2_BUCKET!;
  const force = process.env.FORCE_LODAT_IMAGE_UPLOAD === '1';
  const imageMap = await loadMap(prisma, IMAGE_ENTITY);

  let copied = 0;
  let skipped = 0;
  let failed = 0;
  let reusedChat = 0;
  let uploadedLodat = 0;

  await mapPool(rows, CONCURRENCY, async (row) => {
    const kind = String(row.AddrKind || '');
    let targetLodatId: string | undefined;

    if (kind === 'REGULAR') {
      targetLodatId = lodatMap.get(String(row.LodatId));
    } else if (kind === 'PROJECT') {
      if (row.CreatedByEmployeeId == null) {
        console.warn(`  Bỏ image ${row.ID}: PROJECT thiếu CreatedByEmployeeId`);
        skipped += 1;
        return;
      }
      targetLodatId = lodatMap.get(
        projectStreamKey(row.LodatId, row.CreatedByEmployeeId),
      );
      if (!targetLodatId) {
        console.warn(
          `  Bỏ image ${row.ID}: không có stream p:${row.LodatId}:${row.CreatedByEmployeeId}`,
        );
        skipped += 1;
        return;
      }
    } else {
      skipped += 1;
      return;
    }

    if (!targetLodatId) {
      console.warn(`  Bỏ image ${row.ID}: chưa map Lodat ${row.LodatId}`);
      skipped += 1;
      return;
    }

    const stored = String(row.StoredPath || '').trim();
    const messenger = parseMessengerPath(stored);
    const lodatFile = parseLodatPath(stored);

    let objectKey: string | null = null;

    try {
      let source: 'chat' | 'lodat';
      if (messenger) {
        objectKey = `${CHAT_KEY_PREFIX}${messenger.personId}/${messenger.fileName}`;
        const abs = path.join(chatDir, messenger.personId, messenger.fileName);
        if (!(await objectExists(s3, bucket, objectKey))) {
          if (!existsSync(abs)) {
            console.warn(`  Bỏ image ${row.ID}: thiếu file chat ${abs}`);
            skipped += 1;
            return;
          }
          await ensureObject(s3, bucket, objectKey, abs, force);
        }
        source = 'chat';
      } else if (lodatFile) {
        objectKey = `${LODAT_KEY_PREFIX}${targetLodatId}/${lodatFile}`;
        const abs = path.join(lodatImgDir, lodatFile);
        if (!existsSync(abs)) {
          console.warn(`  Bỏ image ${row.ID}: thiếu file lodat ${lodatFile}`);
          skipped += 1;
          return;
        }
        await ensureObject(s3, bucket, objectKey, abs, force);
        source = 'lodat';
      } else {
        console.warn(`  Bỏ image ${row.ID}: path không hỗ trợ ${stored}`);
        skipped += 1;
        return;
      }

      const mappedId = imageMap.get(String(row.ID));
      const existing = mappedId
        ? await prisma.lodatImage.findUnique({ where: { id: mappedId } })
        : null;

      const data = {
        lodatId: targetLodatId,
        objectKey,
        sortOrder: Number.isFinite(row.SortOrder) ? Number(row.SortOrder) : 0,
        createdAt: toDate(row.CreatedAtMs),
      };
      const saved = existing
        ? await prisma.lodatImage.update({ where: { id: existing.id }, data })
        : await prisma.lodatImage.create({ data });
      await upsertMap(prisma, IMAGE_ENTITY, row.ID, saved.id);
      imageMap.set(String(row.ID), saved.id);
      copied += 1;
      if (source === 'chat') reusedChat += 1;
      else uploadedLodat += 1;
    } catch (err) {
      console.warn(`  Lỗi image ${row.ID}:`, err);
      failed += 1;
    }
  });

  const mapCount = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${IMAGE_ENTITY}
  `;
  const live = await prisma.lodatImage.count();
  await prisma.$disconnect();

  console.log(
    `  Xong: copied=${copied} skipped=${skipped} failed=${failed} (reuse chat keys≈${reusedChat}, upload lodats≈${uploadedLodat}).`,
  );
  console.log(`Map lodat_image=${mapCount[0]?.c ?? 0}; Live LodatImage=${live}`);
  console.log('Xong supplement ảnh lô. Không ghi SQLite cũ.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
