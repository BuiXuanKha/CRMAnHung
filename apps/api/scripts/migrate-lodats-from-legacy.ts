/**
 * Copy lô đất + map chủ từ SQLite cũ → Lodat + LodatCustomerMap;
 * ảnh lô dân → R2 + LodatImage.
 * READ-ONLY on SQLite and `/var/www/anhungland-crm/api/img/lodats`.
 *
 * Maps:
 *   - `lodat` — REGULAR: old_id = tblLodats.ID
 *                PROJECT stream: old_id = `p:{lodatId}:{employeeId}`
 *   - `lodat_customer_map` — old_id = tblLodatPersonMap.ID
 *   - `lodat_image` — old_id = tblLodatImages.ID (REGULAR `/img/lodats` only trong script này)
 *     Messenger + ảnh riêng PROJECT: `pnpm lodats:migrate-images-supplement`
 *
 * Needs: `user`, `customer`, `address`, `project_lot`.
 * Giữ luồng NV (kha / buinam) — createdBy từ map/lodat cũ, không gán admin.
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *   LEGACY_LODAT_IMG_DIR=/var/www/anhungland-crm/api/img/lodats \
 *     pnpm lodats:migrate-legacy
 *
 * SKIP_LODAT_IMAGES=1 — chỉ text/map, bỏ R2.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

const LODAT_ENTITY = 'lodat';
const MAP_ENTITY = 'lodat_customer_map';
const IMAGE_ENTITY = 'lodat_image';
const USER_ENTITY = 'user';
const CUSTOMER_ENTITY = 'customer';
const ADDRESS_ENTITY = 'address';
const PROJECT_LOT_ENTITY = 'project_lot';

const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';
const DEFAULT_IMG_DIR = '/var/www/anhungland-crm/api/img/lodats';
const KEY_PREFIX = 'lodats/';
const CONCURRENCY = 6;

type LegacyRegularLodat = {
  ID: number;
  Title: string | null;
  AddressId: number;
  AreaM2: number | null;
  FrontageM: number | null;
  Direction: string | null;
  Note: string | null;
  CreatedByEmployeeId: number;
  CreatedAtMs: number | null;
  UpdatedAtMs: number | null;
};

type LegacyMap = {
  ID: number;
  LodatId: number;
  PersonId: number;
  PriceVnd: number | null;
  PriceNote: string | null;
  BrokerFeeNote: string | null;
  Status: string | null;
  Notes: string | null;
  CreatedAtMs: number | null;
  CreatedByEmployeeId: number | null;
  IsActive: number;
  EndedAtMs: number | null;
};

type LegacyImage = {
  ID: number;
  LodatId: number;
  StoredPath: string;
  SortOrder: number | null;
  CreatedAtMs: number | null;
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

function toDateOrNull(ms: number | null | undefined): Date | null {
  if (ms == null) return null;
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n);
}

function trimOrNull(value: string | null | undefined): string | null {
  const t = String(value ?? '').trim();
  return t ? t : null;
}

function toFloat(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBigIntPrice(value: number | null | undefined): bigint | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return BigInt(Math.trunc(n));
}

function projectStreamKey(lodatId: number, employeeId: number): string {
  return `p:${lodatId}:${employeeId}`;
}

function parseLodatStoredPath(stored: string): string | null {
  const normalized = stored.replace(/\\/g, '/').trim();
  const match = /^\/img\/lodats\/([^/]+)$/.exec(normalized);
  if (!match) return null;
  const fileName = match[1];
  if (!fileName || fileName.includes('..') || !/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    return null;
  }
  return fileName;
}

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

async function ensureMigrateSchema(prisma: PrismaClient): Promise<void> {
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
  const n = Math.min(limit, items.length || 1);
  await Promise.all(Array.from({ length: n }, () => worker()));
}

async function upsertCustomerMap(
  prisma: PrismaClient,
  mapEntityMap: Map<string, string>,
  lodatId: string,
  row: LegacyMap,
  customerId: string,
  createdByEmployeeId: string | null,
): Promise<void> {
  const data = {
    lodatId,
    customerId,
    priceVnd: toBigIntPrice(row.PriceVnd),
    priceNote: trimOrNull(row.PriceNote),
    brokerFeeNote: trimOrNull(row.BrokerFeeNote),
    status: String(row.Status || 'TAM_DUNG').trim() || 'TAM_DUNG',
    note: trimOrNull(row.Notes),
    isActive: Number(row.IsActive) === 1,
    endedAt: toDateOrNull(row.EndedAtMs),
    createdByEmployeeId,
    createdAt: toDate(row.CreatedAtMs),
    updatedAt: toDate(row.CreatedAtMs),
  };

  const mappedId = mapEntityMap.get(String(row.ID));
  const existing = mappedId
    ? await prisma.lodatCustomerMap.findUnique({ where: { id: mappedId } })
    : null;

  // Unique: one active map per lodat — if activating, deactivate others first when re-run
  if (data.isActive) {
    await prisma.lodatCustomerMap.updateMany({
      where: {
        lodatId,
        isActive: true,
        ...(existing ? { id: { not: existing.id } } : {}),
      },
      data: { isActive: false, endedAt: new Date() },
    });
  }

  const saved = existing
    ? await prisma.lodatCustomerMap.update({ where: { id: existing.id }, data })
    : await prisma.lodatCustomerMap.create({ data });

  await upsertMap(prisma, MAP_ENTITY, row.ID, saved.id);
  mapEntityMap.set(String(row.ID), saved.id);
}

async function main() {
  const sqlitePath = process.env.LEGACY_SQLITE ?? DEFAULT_SQLITE;
  if (!existsSync(sqlitePath)) {
    throw new Error(`Không thấy SQLite: ${sqlitePath}`);
  }

  const prisma = new PrismaClient();
  await ensureMigrateSchema(prisma);

  const userMap = await loadMap(prisma, USER_ENTITY);
  const customerMap = await loadMap(prisma, CUSTOMER_ENTITY);
  const addressMap = await loadMap(prisma, ADDRESS_ENTITY);
  const projectLotMap = await loadMap(prisma, PROJECT_LOT_ENTITY);

  if (userMap.size === 0) throw new Error('Chưa có map user.');
  if (customerMap.size === 0) throw new Error('Chưa có map customer.');
  if (addressMap.size === 0) throw new Error('Chưa có map address.');
  if (projectLotMap.size === 0) {
    throw new Error('Chưa có map project_lot. Chạy pnpm project-lots:migrate-legacy trước.');
  }

  const lodatMap = await loadMap(prisma, LODAT_ENTITY);
  const mapEntityMap = await loadMap(prisma, MAP_ENTITY);

  // --- REGULAR lodats + maps -------------------------------------------------
  const regulars = sqliteJson<LegacyRegularLodat>(
    sqlitePath,
    `SELECT l.ID, l.Title, l.AddressId, l.AreaM2, l.FrontageM, l.Direction, l.Note,
            l.CreatedByEmployeeId, l.CreatedAtMs, l.UpdatedAtMs
     FROM tblLodats l
     JOIN tblAddresses a ON a.ID = l.AddressId
     WHERE a.Kind = 'REGULAR'
     ORDER BY l.ID`,
  );
  console.log(`REGULAR lodats: ${regulars.length}`);

  const regularMaps = sqliteJson<LegacyMap>(
    sqlitePath,
    `SELECT m.ID, m.LodatId, m.PersonId, m.PriceVnd, m.PriceNote, m.BrokerFeeNote,
            m.Status, m.Notes, m.CreatedAtMs, m.CreatedByEmployeeId, m.IsActive, m.EndedAtMs
     FROM tblLodatPersonMap m
     JOIN tblLodats l ON l.ID = m.LodatId
     JOIN tblAddresses a ON a.ID = l.AddressId
     WHERE a.Kind = 'REGULAR'
     ORDER BY m.LodatId, m.ID`,
  );
  const mapsByLodat = new Map<number, LegacyMap[]>();
  for (const m of regularMaps) {
    const list = mapsByLodat.get(m.LodatId) ?? [];
    list.push(m);
    mapsByLodat.set(m.LodatId, list);
  }

  let regCopied = 0;
  let regSkipped = 0;
  let regMapCopied = 0;
  let regMapSkipped = 0;

  for (const row of regulars) {
    const addressId = addressMap.get(String(row.AddressId));
    const createdByEmployeeId = userMap.get(String(row.CreatedByEmployeeId));
    if (!addressId || !createdByEmployeeId) {
      console.warn(
        `  Bỏ REGULAR lodat ${row.ID}: address=${row.AddressId}→${!!addressId} user=${row.CreatedByEmployeeId}→${!!createdByEmployeeId}`,
      );
      regSkipped += 1;
      continue;
    }

    const data = {
      title: String(row.Title || '').trim() || `Lô #${row.ID}`,
      areaM2: toFloat(row.AreaM2),
      frontageM: toFloat(row.FrontageM),
      direction: trimOrNull(row.Direction),
      note: trimOrNull(row.Note),
      addressId,
      projectLotId: null as string | null,
      propertyKind: 'DAT',
      createdByEmployeeId,
      createdAt: toDate(row.CreatedAtMs),
      updatedAt: toDate(row.UpdatedAtMs ?? row.CreatedAtMs),
    };

    const mappedId = lodatMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.lodat.findUnique({ where: { id: mappedId } })
      : null;
    const saved = existing
      ? await prisma.lodat.update({ where: { id: existing.id }, data })
      : await prisma.lodat.create({ data });

    await upsertMap(prisma, LODAT_ENTITY, row.ID, saved.id);
    lodatMap.set(String(row.ID), saved.id);
    regCopied += 1;

    for (const m of mapsByLodat.get(row.ID) ?? []) {
      const customerId = customerMap.get(String(m.PersonId));
      const mapBy =
        m.CreatedByEmployeeId != null
          ? (userMap.get(String(m.CreatedByEmployeeId)) ?? null)
          : createdByEmployeeId;
      if (!customerId) {
        console.warn(`  Bỏ map ${m.ID}: không map customer ${m.PersonId}`);
        regMapSkipped += 1;
        continue;
      }
      await upsertCustomerMap(prisma, mapEntityMap, saved.id, m, customerId, mapBy);
      regMapCopied += 1;
    }
  }
  console.log(
    `  REGULAR Lodat: ${regCopied}/${regulars.length} (bỏ ${regSkipped}). Maps: ${regMapCopied} (bỏ ${regMapSkipped}).`,
  );

  // --- PROJECT streams + maps -----------------------------------------------
  const projectMaps = sqliteJson<LegacyMap>(
    sqlitePath,
    `SELECT m.ID, m.LodatId, m.PersonId, m.PriceVnd, m.PriceNote, m.BrokerFeeNote,
            m.Status, m.Notes, m.CreatedAtMs, m.CreatedByEmployeeId, m.IsActive, m.EndedAtMs
     FROM tblLodatPersonMap m
     JOIN tblLodats l ON l.ID = m.LodatId
     JOIN tblAddresses a ON a.ID = l.AddressId
     WHERE a.Kind = 'PROJECT'
     ORDER BY m.LodatId, m.CreatedByEmployeeId, m.ID`,
  );
  console.log(`PROJECT maps: ${projectMaps.length}`);

  type Stream = { lodatId: number; employeeId: number; maps: LegacyMap[] };
  const streams = new Map<string, Stream>();
  for (const m of projectMaps) {
    if (m.CreatedByEmployeeId == null) {
      console.warn(`  Bỏ map ${m.ID}: CreatedByEmployeeId null`);
      continue;
    }
    const key = projectStreamKey(m.LodatId, m.CreatedByEmployeeId);
    const s = streams.get(key) ?? {
      lodatId: m.LodatId,
      employeeId: m.CreatedByEmployeeId,
      maps: [],
    };
    s.maps.push(m);
    streams.set(key, s);
  }
  console.log(`PROJECT streams (Lodat pointers): ${streams.size}`);

  let projLodatCopied = 0;
  let projLodatSkipped = 0;
  let projMapCopied = 0;
  let projMapSkipped = 0;

  for (const [streamKey, stream] of streams) {
    const projectLotId = projectLotMap.get(String(stream.lodatId));
    const createdByEmployeeId = userMap.get(String(stream.employeeId));
    if (!projectLotId || !createdByEmployeeId) {
      console.warn(
        `  Bỏ stream ${streamKey}: projectLot=${!!projectLotId} user=${!!createdByEmployeeId}`,
      );
      projLodatSkipped += 1;
      continue;
    }

    const data = {
      title: null as string | null,
      areaM2: null as number | null,
      frontageM: null as number | null,
      direction: null as string | null,
      note: null as string | null,
      addressId: null as string | null,
      projectLotId,
      propertyKind: 'DAT',
      createdByEmployeeId,
      createdAt: toDate(stream.maps[0]?.CreatedAtMs),
      updatedAt: toDate(stream.maps[0]?.CreatedAtMs),
    };

    const mappedId = lodatMap.get(streamKey);
    const existing = mappedId
      ? await prisma.lodat.findUnique({ where: { id: mappedId } })
      : null;
    const saved = existing
      ? await prisma.lodat.update({ where: { id: existing.id }, data })
      : await prisma.lodat.create({ data });

    await upsertMap(prisma, LODAT_ENTITY, streamKey, saved.id);
    lodatMap.set(streamKey, saved.id);
    projLodatCopied += 1;

    for (const m of stream.maps) {
      const customerId = customerMap.get(String(m.PersonId));
      if (!customerId) {
        console.warn(`  Bỏ PROJECT map ${m.ID}: không map customer ${m.PersonId}`);
        projMapSkipped += 1;
        continue;
      }
      await upsertCustomerMap(
        prisma,
        mapEntityMap,
        saved.id,
        m,
        customerId,
        createdByEmployeeId,
      );
      projMapCopied += 1;
    }
  }
  console.log(
    `  PROJECT Lodat: ${projLodatCopied}/${streams.size} (bỏ ${projLodatSkipped}). Maps: ${projMapCopied} (bỏ ${projMapSkipped}).`,
  );

  // --- REGULAR images → R2 --------------------------------------------------
  const skipImages = process.env.SKIP_LODAT_IMAGES === '1';
  if (skipImages) {
    console.log('SKIP_LODAT_IMAGES=1 — bỏ qua ảnh lô dân.');
  } else {
    const imgDir = process.env.LEGACY_LODAT_IMG_DIR ?? DEFAULT_IMG_DIR;
    const env = { ...loadDotEnv(path.join(process.cwd(), '.env')), ...process.env };
    const required = [
      'R2_ENDPOINT',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET',
      'R2_PUBLIC_BASE_URL',
    ] as const;
    const missing = required.filter((k) => !env[k]);

    if (!existsSync(imgDir)) {
      console.warn(`Không thấy thư mục ảnh: ${imgDir} — bỏ qua ảnh.`);
    } else if (missing.length) {
      console.warn(`Thiếu biến R2 (${missing.join(', ')}) — bỏ qua ảnh.`);
    } else {
      const images = sqliteJson<LegacyImage>(
        sqlitePath,
        `SELECT i.ID, i.LodatId, i.StoredPath, i.SortOrder, i.CreatedAtMs
         FROM tblLodatImages i
         JOIN tblLodats l ON l.ID = i.LodatId
         JOIN tblAddresses a ON a.ID = l.AddressId
         WHERE a.Kind = 'REGULAR'
         ORDER BY i.LodatId, i.SortOrder, i.ID`,
      );
      const skipProj = sqliteJson<{ c: number }>(
        sqlitePath,
        `SELECT COUNT(*) AS c FROM tblLodatImages i
         JOIN tblLodats l ON l.ID = i.LodatId
         JOIN tblAddresses a ON a.ID = l.AddressId
         WHERE a.Kind = 'PROJECT'`,
      );
      console.log(
        `Ảnh REGULAR: ${images.length}. Bỏ ảnh PROJECT (không copy): ${skipProj[0]?.c ?? 0}.`,
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

      let imgCopied = 0;
      let imgSkipped = 0;
      let imgFailed = 0;

      await mapPool(images, CONCURRENCY, async (row) => {
        const lodatId = lodatMap.get(String(row.LodatId));
        if (!lodatId) {
          imgSkipped += 1;
          return;
        }
        const fileName = parseLodatStoredPath(String(row.StoredPath || ''));
        if (!fileName) {
          console.warn(`  Bỏ image ${row.ID}: path không hợp lệ ${row.StoredPath}`);
          imgSkipped += 1;
          return;
        }
        const abs = path.join(imgDir, fileName);
        if (!existsSync(abs)) {
          console.warn(`  Bỏ image ${row.ID}: không có file ${fileName}`);
          imgSkipped += 1;
          return;
        }

        const objectKey = `${KEY_PREFIX}${lodatId}/${fileName}`;
        const mappedId = imageMap.get(String(row.ID));
        const existing = mappedId
          ? await prisma.lodatImage.findUnique({ where: { id: mappedId } })
          : null;

        try {
          if (!force) {
            try {
              await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
            } catch {
              await s3.send(
                new PutObjectCommand({
                  Bucket: bucket,
                  Key: objectKey,
                  Body: readFileSync(abs),
                  ContentType: contentTypeFor(fileName),
                }),
              );
            }
          } else {
            await s3.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: objectKey,
                Body: readFileSync(abs),
                ContentType: contentTypeFor(fileName),
              }),
            );
          }

          const data = {
            lodatId,
            objectKey,
            sortOrder: Number.isFinite(row.SortOrder) ? Number(row.SortOrder) : 0,
            createdAt: toDate(row.CreatedAtMs),
          };
          const saved = existing
            ? await prisma.lodatImage.update({ where: { id: existing.id }, data })
            : await prisma.lodatImage.create({ data });
          await upsertMap(prisma, IMAGE_ENTITY, row.ID, saved.id);
          imageMap.set(String(row.ID), saved.id);
          imgCopied += 1;
        } catch (err) {
          console.warn(`  Lỗi image ${row.ID}:`, err);
          imgFailed += 1;
        }
      });

      console.log(
        `  Ảnh: ${imgCopied}/${images.length} (bỏ ${imgSkipped}, lỗi ${imgFailed}).`,
      );
    }
  }

  const entities = [LODAT_ENTITY, MAP_ENTITY, IMAGE_ENTITY];
  const parts: string[] = [];
  for (const entity of entities) {
    const rows = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${entity}
    `;
    parts.push(`${entity}=${rows[0]?.c ?? 0}`);
  }
  const liveLodat = await prisma.lodat.count();
  const liveMap = await prisma.lodatCustomerMap.count();
  const liveImg = await prisma.lodatImage.count();
  await prisma.$disconnect();

  console.log(`Map entity: ${parts.join(', ')}`);
  console.log(`Live: Lodat=${liveLodat} Map=${liveMap} Image=${liveImg}`);
  console.log('Xong migrate lodats. Không ghi SQLite cũ.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
