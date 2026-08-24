/**
 * Copy tblAddrProvinces / Districts / Wards → Province / District / Ward,
 * then tblAddresses → Address, then tblAddressImages → R2 + AddressImage.
 * READ-ONLY on the old SQLite and `/var/www/anhungland-crm/api/img/addresses`.
 *
 * Maps: `province`, `district`, `ward`, `address`, `address_image`.
 * Needs map `user` (optional — creator null nếu thiếu).
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *   LEGACY_ADDRESS_IMG_DIR=/var/www/anhungland-crm/api/img/addresses \
 *     pnpm exec tsx scripts/migrate-addresses-from-legacy.ts
 *
 * Skip images: SKIP_ADDRESS_IMAGES=1
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

const PROVINCE_ENTITY = 'province';
const DISTRICT_ENTITY = 'district';
const WARD_ENTITY = 'ward';
const ADDRESS_ENTITY = 'address';
const ADDRESS_IMAGE_ENTITY = 'address_image';
const USER_ENTITY = 'user';

const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';
const DEFAULT_IMG_DIR = '/var/www/anhungland-crm/api/img/addresses';
const KEY_PREFIX = 'addresses/';
const CONCURRENCY = 6;

type LegacyProvince = {
  ID: number;
  Name: string;
  CreatedByEmployeeId: number | null;
  CreatedAtMs: number | null;
  UpdatedAtMs: number | null;
  IsHidden: number;
};

type LegacyDistrict = {
  ID: number;
  ProvinceId: number;
  Name: string;
  CreatedByEmployeeId: number | null;
  CreatedAtMs: number | null;
  UpdatedAtMs: number | null;
  IsHidden: number;
};

type LegacyWard = {
  ID: number;
  DistrictId: number;
  Name: string;
  CreatedByEmployeeId: number | null;
  CreatedAtMs: number | null;
  UpdatedAtMs: number | null;
  IsHidden: number;
};

type LegacyAddress = {
  ID: number;
  Kind: string;
  ProvinceId: number;
  DistrictId: number;
  WardId: number;
  Detail: string | null;
  Description: string | null;
  CreatedByEmployeeId: number | null;
  CreatedAtMs: number | null;
  UpdatedAtMs: number | null;
  IsHidden: number;
};

type LegacyAddressImage = {
  ID: number;
  AddressId: number;
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
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
  if (!json) return [];
  return JSON.parse(json) as T[];
}

function toDate(ms: number | null | undefined): Date {
  if (ms && Number.isFinite(ms)) return new Date(Number(ms));
  return new Date();
}

function trimOrNull(value: string | null | undefined): string | null {
  const t = String(value ?? '').trim();
  return t ? t : null;
}

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function parseAddressStoredPath(stored: string): string | null {
  const normalized = stored.replace(/\\/g, '/').trim();
  const match = /^\/img\/addresses\/([^/]+)$/.exec(normalized);
  if (!match) return null;
  const fileName = match[1];
  if (!fileName || fileName.includes('..') || !/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    return null;
  }
  return fileName;
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

async function main() {
  const sqlitePath = process.env.LEGACY_SQLITE ?? DEFAULT_SQLITE;
  if (!existsSync(sqlitePath)) {
    throw new Error(`Không thấy SQLite: ${sqlitePath}`);
  }

  const prisma = new PrismaClient();
  await ensureMigrateSchema(prisma);

  const userMap = await loadMap(prisma, USER_ENTITY);
  if (userMap.size === 0) {
    console.warn('Chưa có map user — CreatedBy sẽ null.');
  }

  function creatorId(legacyUserId: number | null | undefined): string | null {
    if (legacyUserId == null) return null;
    return userMap.get(String(legacyUserId)) ?? null;
  }

  // --- Provinces -----------------------------------------------------------
  const provinces = sqliteJson<LegacyProvince>(
    sqlitePath,
    `SELECT ID, Name, CreatedByEmployeeId, CreatedAtMs, UpdatedAtMs, IsHidden
     FROM tblAddrProvinces ORDER BY ID`,
  );
  console.log(`Đọc ${provinces.length} tỉnh từ SQLite.`);
  const provinceMap = await loadMap(prisma, PROVINCE_ENTITY);
  let provCopied = 0;
  let provSkipped = 0;

  for (const row of provinces) {
    const name = String(row.Name || '').trim();
    if (!name) {
      console.warn(`  Bỏ province ID=${row.ID}: tên trống`);
      provSkipped += 1;
      continue;
    }
    const data = {
      name,
      isHidden: Number(row.IsHidden) === 1,
      createdByEmployeeId: creatorId(row.CreatedByEmployeeId),
      createdAt: toDate(row.CreatedAtMs),
      updatedAt: toDate(row.UpdatedAtMs ?? row.CreatedAtMs),
    };
    const mappedId = provinceMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.province.findUnique({ where: { id: mappedId } })
      : null;
    const saved = existing
      ? await prisma.province.update({ where: { id: existing.id }, data })
      : await prisma.province.create({ data });
    await upsertMap(prisma, PROVINCE_ENTITY, row.ID, saved.id);
    provinceMap.set(String(row.ID), saved.id);
    provCopied += 1;
  }
  console.log(`  Tỉnh: ${provCopied}/${provinces.length} (bỏ ${provSkipped}).`);

  // --- Districts -----------------------------------------------------------
  const districts = sqliteJson<LegacyDistrict>(
    sqlitePath,
    `SELECT ID, ProvinceId, Name, CreatedByEmployeeId, CreatedAtMs, UpdatedAtMs, IsHidden
     FROM tblAddrDistricts ORDER BY ID`,
  );
  console.log(`Đọc ${districts.length} huyện từ SQLite.`);
  const districtMap = await loadMap(prisma, DISTRICT_ENTITY);
  let distCopied = 0;
  let distSkipped = 0;

  for (const row of districts) {
    const provinceId = provinceMap.get(String(row.ProvinceId));
    if (!provinceId) {
      console.warn(`  Bỏ district ID=${row.ID}: không map province ${row.ProvinceId}`);
      distSkipped += 1;
      continue;
    }
    const name = String(row.Name || '').trim();
    if (!name) {
      console.warn(`  Bỏ district ID=${row.ID}: tên trống`);
      distSkipped += 1;
      continue;
    }
    const data = {
      provinceId,
      name,
      isHidden: Number(row.IsHidden) === 1,
      createdByEmployeeId: creatorId(row.CreatedByEmployeeId),
      createdAt: toDate(row.CreatedAtMs),
      updatedAt: toDate(row.UpdatedAtMs ?? row.CreatedAtMs),
    };
    const mappedId = districtMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.district.findUnique({ where: { id: mappedId } })
      : null;
    const saved = existing
      ? await prisma.district.update({ where: { id: existing.id }, data })
      : await prisma.district.create({ data });
    await upsertMap(prisma, DISTRICT_ENTITY, row.ID, saved.id);
    districtMap.set(String(row.ID), saved.id);
    distCopied += 1;
  }
  console.log(`  Huyện: ${distCopied}/${districts.length} (bỏ ${distSkipped}).`);

  // --- Wards ---------------------------------------------------------------
  const wards = sqliteJson<LegacyWard>(
    sqlitePath,
    `SELECT ID, DistrictId, Name, CreatedByEmployeeId, CreatedAtMs, UpdatedAtMs, IsHidden
     FROM tblAddrWards ORDER BY ID`,
  );
  console.log(`Đọc ${wards.length} xã từ SQLite.`);
  const wardMap = await loadMap(prisma, WARD_ENTITY);
  let wardCopied = 0;
  let wardSkipped = 0;

  for (const row of wards) {
    const districtId = districtMap.get(String(row.DistrictId));
    if (!districtId) {
      console.warn(`  Bỏ ward ID=${row.ID}: không map district ${row.DistrictId}`);
      wardSkipped += 1;
      continue;
    }
    const name = String(row.Name || '').trim();
    if (!name) {
      console.warn(`  Bỏ ward ID=${row.ID}: tên trống`);
      wardSkipped += 1;
      continue;
    }
    const data = {
      districtId,
      name,
      isHidden: Number(row.IsHidden) === 1,
      createdByEmployeeId: creatorId(row.CreatedByEmployeeId),
      createdAt: toDate(row.CreatedAtMs),
      updatedAt: toDate(row.UpdatedAtMs ?? row.CreatedAtMs),
    };
    const mappedId = wardMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.ward.findUnique({ where: { id: mappedId } })
      : null;
    const saved = existing
      ? await prisma.ward.update({ where: { id: existing.id }, data })
      : await prisma.ward.create({ data });
    await upsertMap(prisma, WARD_ENTITY, row.ID, saved.id);
    wardMap.set(String(row.ID), saved.id);
    wardCopied += 1;
  }
  console.log(`  Xã: ${wardCopied}/${wards.length} (bỏ ${wardSkipped}).`);

  // --- Addresses -----------------------------------------------------------
  const addresses = sqliteJson<LegacyAddress>(
    sqlitePath,
    `SELECT ID, Kind, ProvinceId, DistrictId, WardId, Detail, Description,
            CreatedByEmployeeId, CreatedAtMs, UpdatedAtMs, IsHidden
     FROM tblAddresses ORDER BY ID`,
  );
  console.log(`Đọc ${addresses.length} địa chỉ từ SQLite.`);
  const addressMap = await loadMap(prisma, ADDRESS_ENTITY);
  let addrCopied = 0;
  let addrSkipped = 0;

  for (const row of addresses) {
    const provinceId = provinceMap.get(String(row.ProvinceId));
    const districtId = districtMap.get(String(row.DistrictId));
    const wardId = wardMap.get(String(row.WardId));
    if (!provinceId || !districtId || !wardId) {
      console.warn(
        `  Bỏ address ID=${row.ID}: thiếu map unit (p=${row.ProvinceId} d=${row.DistrictId} w=${row.WardId})`,
      );
      addrSkipped += 1;
      continue;
    }

    const kind = String(row.Kind || 'REGULAR').toUpperCase() === 'PROJECT' ? 'PROJECT' : 'REGULAR';
    const detail = trimOrNull(row.Detail);
    if (kind === 'PROJECT' && !detail) {
      console.warn(`  Bỏ address ID=${row.ID}: PROJECT thiếu tên dự án`);
      addrSkipped += 1;
      continue;
    }

    const data = {
      kind,
      detail,
      description: trimOrNull(row.Description),
      provinceId,
      districtId,
      wardId,
      isHidden: Number(row.IsHidden) === 1,
      createdByEmployeeId: creatorId(row.CreatedByEmployeeId),
      createdAt: toDate(row.CreatedAtMs),
      updatedAt: toDate(row.UpdatedAtMs ?? row.CreatedAtMs),
    };

    const mappedId = addressMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.address.findUnique({ where: { id: mappedId } })
      : null;
    const saved = existing
      ? await prisma.address.update({ where: { id: existing.id }, data })
      : await prisma.address.create({ data });
    await upsertMap(prisma, ADDRESS_ENTITY, row.ID, saved.id);
    addressMap.set(String(row.ID), saved.id);
    addrCopied += 1;
  }
  console.log(`  Địa chỉ: ${addrCopied}/${addresses.length} (bỏ ${addrSkipped}).`);

  // --- Address images → R2 -------------------------------------------------
  const skipImages = process.env.SKIP_ADDRESS_IMAGES === '1';
  if (skipImages) {
    console.log('SKIP_ADDRESS_IMAGES=1 — bỏ qua ảnh dự án.');
  } else {
    const imgDir = process.env.LEGACY_ADDRESS_IMG_DIR ?? DEFAULT_IMG_DIR;
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
      const images = sqliteJson<LegacyAddressImage>(
        sqlitePath,
        `SELECT ID, AddressId, StoredPath, SortOrder, CreatedAtMs
         FROM tblAddressImages ORDER BY AddressId, SortOrder, ID`,
      );
      console.log(`Đọc ${images.length} ảnh địa chỉ từ SQLite.`);

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
      const force = process.env.FORCE_ADDRESS_IMAGE_UPLOAD === '1';
      const imageMap = await loadMap(prisma, ADDRESS_IMAGE_ENTITY);

      let imgCopied = 0;
      let imgSkipped = 0;
      let imgFailed = 0;

      await mapPool(images, CONCURRENCY, async (row) => {
        const addressId = addressMap.get(String(row.AddressId));
        if (!addressId) {
          console.warn(`  Bỏ image ID=${row.ID}: không map address ${row.AddressId}`);
          imgSkipped += 1;
          return;
        }
        const fileName = parseAddressStoredPath(String(row.StoredPath || ''));
        if (!fileName) {
          console.warn(`  Bỏ image ID=${row.ID}: path không hợp lệ ${row.StoredPath}`);
          imgSkipped += 1;
          return;
        }
        const abs = path.join(imgDir, fileName);
        if (!existsSync(abs)) {
          console.warn(`  Bỏ image ID=${row.ID}: không có file ${fileName}`);
          imgSkipped += 1;
          return;
        }

        const objectKey = `${KEY_PREFIX}${addressId}/${fileName}`;
        const mappedId = imageMap.get(String(row.ID));
        const existing = mappedId
          ? await prisma.addressImage.findUnique({ where: { id: mappedId } })
          : null;

        try {
          if (!force) {
            try {
              await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
            } catch {
              const body = readFileSync(abs);
              await s3.send(
                new PutObjectCommand({
                  Bucket: bucket,
                  Key: objectKey,
                  Body: body,
                  ContentType: contentTypeFor(fileName),
                }),
              );
            }
          } else {
            const body = readFileSync(abs);
            await s3.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: objectKey,
                Body: body,
                ContentType: contentTypeFor(fileName),
              }),
            );
          }

          const data = {
            addressId,
            objectKey,
            sortOrder: Number.isFinite(row.SortOrder) ? Number(row.SortOrder) : 0,
            createdAt: toDate(row.CreatedAtMs),
          };
          const saved = existing
            ? await prisma.addressImage.update({ where: { id: existing.id }, data })
            : await prisma.addressImage.create({ data });
          await upsertMap(prisma, ADDRESS_IMAGE_ENTITY, row.ID, saved.id);
          imageMap.set(String(row.ID), saved.id);
          imgCopied += 1;
        } catch (err) {
          console.warn(`  Lỗi image ID=${row.ID}:`, err);
          imgFailed += 1;
        }
      });

      console.log(
        `  Ảnh: ${imgCopied}/${images.length} (bỏ ${imgSkipped}, lỗi ${imgFailed}).`,
      );
    }
  }

  const entities = [
    PROVINCE_ENTITY,
    DISTRICT_ENTITY,
    WARD_ENTITY,
    ADDRESS_ENTITY,
    ADDRESS_IMAGE_ENTITY,
  ];
  const parts: string[] = [];
  for (const entity of entities) {
    const rows = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${entity}
    `;
    parts.push(`${entity}=${rows[0]?.c ?? 0}`);
  }
  await prisma.$disconnect();
  console.log('Map entity:', parts.join(', '));
  console.log('Xong migrate địa chỉ. Không ghi SQLite cũ.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
