/**
 * Copy tblTransaction* → Transaction + party + snapshot (+ ảnh R2) + attachment.
 * READ-ONLY on SQLite and `/var/www/anhungland-crm/api/img`.
 *
 * Maps: `transaction`, `transaction_party`, `transaction_snapshot`,
 *       `transaction_snapshot_image`, `transaction_attachment`.
 *
 * Needs: `user`, `customer`, `lodat_customer_map` (bước 10d).
 * `lodatId` mới = LodatCustomerMap.lodatId (luồng NV; PROJECT ≠ ID kho).
 * Giữ CreatedByEmployeeId (buinam/kha) — không gán admin.
 *
 * Usage (VPS, từ apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *     pnpm transactions:migrate-legacy
 *
 * SKIP_TX_FILES=1 — bỏ ảnh snapshot / đính kèm R2.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

const TX_ENTITY = 'transaction';
const PARTY_ENTITY = 'transaction_party';
const SNAP_ENTITY = 'transaction_snapshot';
const SNAP_IMG_ENTITY = 'transaction_snapshot_image';
const ATTACH_ENTITY = 'transaction_attachment';
const USER_ENTITY = 'user';
const CUSTOMER_ENTITY = 'customer';
const MAP_ENTITY = 'lodat_customer_map';
const LODAT_IMAGE_ENTITY = 'lodat_image';

const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';
const DEFAULT_IMG_ROOT = '/var/www/anhungland-crm/api/img';

type Row = Record<string, unknown>;

function sqliteJson<T>(sqlitePath: string, sql: string): T[] {
  const json = execFileSync('sqlite3', ['-json', sqlitePath, sql], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
  if (!json) return [];
  return JSON.parse(json) as T[];
}

function col(row: Row, ...names: string[]): unknown {
  const keys = new Map(Object.keys(row).map((k) => [k.toLowerCase(), k]));
  for (const name of names) {
    const actual = keys.get(name.toLowerCase());
    if (actual !== undefined) return row[actual];
  }
  return undefined;
}

function asNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asString(value: unknown): string | null {
  const t = String(value ?? '').trim();
  return t ? t : null;
}

function toDate(ms: unknown): Date {
  const n = asNumber(ms);
  if (n && n > 0) return new Date(n);
  return new Date();
}

function toDateOrNull(ms: unknown): Date | null {
  const n = asNumber(ms);
  if (n && n > 0) return new Date(n);
  return null;
}

function toBigInt(value: unknown): bigint | null {
  const n = asNumber(value);
  if (n == null) return null;
  return BigInt(Math.trunc(n));
}

function toBigIntOrZero(value: unknown): bigint {
  return toBigInt(value) ?? 0n;
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

async function loadMap(prisma: PrismaClient, entity: string): Promise<Map<string, string>> {
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
  if (ext === '.pdf') return 'application/pdf';
  return 'image/jpeg';
}

function resolveLegacyFile(stored: string, imgRoot: string): { abs: string; fileName: string } | null {
  const normalized = stored.replace(/\\/g, '/').trim();
  const match = /\/img\/(.+)$/.exec(normalized);
  if (!match) return null;
  const rel = match[1];
  if (!rel || rel.includes('..')) return null;
  const fileName = path.basename(rel);
  if (!fileName || !/^[a-zA-Z0-9._-]+$/.test(fileName)) return null;
  const abs = path.join(imgRoot, rel);
  if (!existsSync(abs)) return null;
  return { abs, fileName };
}

function tableNames(sqlitePath: string): string[] {
  return sqliteJson<{ name: string }>(
    sqlitePath,
    `SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'tblTransaction%' ORDER BY name`,
  ).map((r) => r.name);
}

async function putPublic(
  s3: S3Client,
  bucket: string,
  key: string,
  abs: string,
  fileName: string,
): Promise<void> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: readFileSync(abs),
        ContentType: contentTypeFor(fileName),
      }),
    );
  }
}

async function main() {
  const sqlitePath = process.env.LEGACY_SQLITE ?? DEFAULT_SQLITE;
  if (!existsSync(sqlitePath)) {
    throw new Error(`Không thấy SQLite: ${sqlitePath}`);
  }

  const tables = tableNames(sqlitePath);
  console.log(`SQLite tables: ${tables.join(', ') || '(none)'}`);
  const txs = sqliteJson<Row>(sqlitePath, 'SELECT * FROM tblTransaction ORDER BY ID');
  const parties = sqliteJson<Row>(
    sqlitePath,
    tables.includes('tblTransactionParty') ? 'SELECT * FROM tblTransactionParty ORDER BY ID' : 'SELECT 1 WHERE 0',
  );
  const snapshots = sqliteJson<Row>(
    sqlitePath,
    tables.includes('tblTransactionSnapshot')
      ? 'SELECT * FROM tblTransactionSnapshot ORDER BY ID'
      : 'SELECT 1 WHERE 0',
  );
  const snapImages = sqliteJson<Row>(
    sqlitePath,
    tables.includes('tblTransactionSnapshotImage')
      ? 'SELECT * FROM tblTransactionSnapshotImage ORDER BY ID'
      : 'SELECT 1 WHERE 0',
  );
  const attachments = sqliteJson<Row>(
    sqlitePath,
    tables.includes('tblTransactionAttachment')
      ? 'SELECT * FROM tblTransactionAttachment ORDER BY ID'
      : 'SELECT 1 WHERE 0',
  );
  console.log(
    `Nguồn: ${txs.length} GD, ${parties.length} bên, ${snapshots.length} snapshot, ${snapImages.length} ảnh snapshot, ${attachments.length} đính kèm.`,
  );

  const prisma = new PrismaClient();
  await ensureMigrateSchema(prisma);

  const userMap = await loadMap(prisma, USER_ENTITY);
  const customerMap = await loadMap(prisma, CUSTOMER_ENTITY);
  const lodatMapEntity = await loadMap(prisma, MAP_ENTITY);
  const lodatImageMap = await loadMap(prisma, LODAT_IMAGE_ENTITY);
  const txMap = await loadMap(prisma, TX_ENTITY);

  console.log(
    `Map sẵn: user=${userMap.size} customer=${customerMap.size} lodat_customer_map=${lodatMapEntity.size} lodat_image=${lodatImageMap.size} transaction=${txMap.size}`,
  );
  if (userMap.size === 0) {
    throw new Error('Chưa có map user — chạy pnpm users:migrate-legacy trước.');
  }
  if (lodatMapEntity.size === 0) {
    throw new Error('Chưa copy map lô (bước 10d). Chạy pnpm lodats:migrate-legacy trước.');
  }

  const skipFiles = process.env.SKIP_TX_FILES === '1';
  const imgRoot = process.env.LEGACY_IMG_ROOT ?? DEFAULT_IMG_ROOT;
  const env = { ...loadDotEnv(path.join(process.cwd(), '.env')), ...process.env };
  const s3Ready = Boolean(
    env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET,
  );
  const s3 = s3Ready
    ? new S3Client({
        region: 'auto',
        endpoint: env.R2_ENDPOINT,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID!,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
        },
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      })
    : null;
  const publicBucket = env.R2_BUCKET ?? '';
  const privateBucket = env.R2_PRIVATE_BUCKET ?? '';

  const partiesByTx = new Map<number, Row[]>();
  for (const p of parties) {
    const tid = asNumber(col(p, 'TransactionId'));
    if (tid == null) continue;
    const list = partiesByTx.get(tid) ?? [];
    list.push(p);
    partiesByTx.set(tid, list);
  }
  const snapByTx = new Map<number, Row>();
  for (const s of snapshots) {
    const tid = asNumber(col(s, 'TransactionId'));
    if (tid == null) continue;
    snapByTx.set(tid, s);
  }
  const imgsBySnap = new Map<number, Row[]>();
  const imgsByTx = new Map<number, Row[]>();
  for (const img of snapImages) {
    const sid = asNumber(col(img, 'SnapshotId'));
    const tid = asNumber(col(img, 'TransactionId'));
    if (sid != null) {
      const list = imgsBySnap.get(sid) ?? [];
      list.push(img);
      imgsBySnap.set(sid, list);
    } else if (tid != null) {
      const list = imgsByTx.get(tid) ?? [];
      list.push(img);
      imgsByTx.set(tid, list);
    }
  }
  const attByTx = new Map<number, Row[]>();
  for (const a of attachments) {
    const tid = asNumber(col(a, 'TransactionId'));
    if (tid == null) continue;
    const list = attByTx.get(tid) ?? [];
    list.push(a);
    attByTx.set(tid, list);
  }

  let copied = 0;
  let skipped = 0;

  for (const row of txs) {
    const oldId = asNumber(col(row, 'ID'));
    if (oldId == null) {
      skipped += 1;
      continue;
    }
    const oldMapId = asNumber(col(row, 'LodatPersonMapId'));
    const createdByOld = asNumber(col(row, 'CreatedByEmployeeId'));
    const newMapId = oldMapId != null ? lodatMapEntity.get(String(oldMapId)) : undefined;
    const createdByEmployeeId = createdByOld != null ? userMap.get(String(createdByOld)) : undefined;
    if (!newMapId || !createdByEmployeeId) {
      console.warn(
        `  Bỏ GD ${oldId}: map=${oldMapId}→${!!newMapId} user=${createdByOld}→${!!createdByEmployeeId}`,
      );
      skipped += 1;
      continue;
    }
    const mapRow = await prisma.lodatCustomerMap.findUnique({
      where: { id: newMapId },
      select: { id: true, lodatId: true },
    });
    if (!mapRow) {
      console.warn(`  Bỏ GD ${oldId}: lodat_customer_map ${newMapId} không còn.`);
      skipped += 1;
      continue;
    }

    const code = asString(col(row, 'Code')) || `GD-LEGACY-${oldId}`;
    const type = (asString(col(row, 'TransactionType', 'Type')) || 'OWN').toUpperCase();
    const status = (asString(col(row, 'Status')) || 'DA_COC').toUpperCase();
    const data = {
      code,
      lodatId: mapRow.lodatId,
      lodatCustomerMapId: mapRow.id,
      type: type === 'RECORD' ? 'RECORD' : 'OWN',
      status: ['DA_COC', 'DA_CONG_CHUNG', 'HOAN_TAT', 'HUY'].includes(status) ? status : 'DA_COC',
      notaryAppointmentAt: toDateOrNull(col(row, 'NotaryAppointmentAtMs')),
      salePriceVnd: toBigIntOrZero(col(row, 'SalePriceVnd')),
      taxPriceVnd: toBigInt(col(row, 'TaxPriceVnd')),
      commissionVnd: type === 'RECORD' ? 0n : toBigIntOrZero(col(row, 'CommissionVnd')),
      note: asString(col(row, 'Note')),
      cancelReason: asString(col(row, 'CancelReason')),
      createdByEmployeeId,
      completedAt: toDateOrNull(col(row, 'CompletedAtMs')),
      createdAt: toDate(col(row, 'CreatedAtMs')),
      updatedAt: toDate(col(row, 'UpdatedAtMs', 'CreatedAtMs')),
    };

    const mappedId = txMap.get(String(oldId));
    const existing = mappedId
      ? await prisma.transaction.findUnique({ where: { id: mappedId } })
      : await prisma.transaction.findUnique({ where: { code } });

    if (existing) {
      await prisma.transactionParty.deleteMany({ where: { transactionId: existing.id } });
      await prisma.transactionAttachment.deleteMany({ where: { transactionId: existing.id } });
      await prisma.transactionSnapshot.deleteMany({ where: { transactionId: existing.id } });
      await prisma.transaction.update({ where: { id: existing.id }, data });
      await upsertMap(prisma, TX_ENTITY, oldId, existing.id);
      txMap.set(String(oldId), existing.id);
    } else {
      const created = await prisma.transaction.create({ data });
      await upsertMap(prisma, TX_ENTITY, oldId, created.id);
      txMap.set(String(oldId), created.id);
    }
    const txId = txMap.get(String(oldId))!;

    const txParties = partiesByTx.get(oldId) ?? [];
    for (const [i, p] of txParties.entries()) {
      const personId = asNumber(col(p, 'PersonId'));
      const customerId = personId != null ? (customerMap.get(String(personId)) ?? null) : null;
      let freeTextName = asString(col(p, 'FreeTextName'));
      if (!freeTextName && customerId) {
        const c = await prisma.customer.findUnique({
          where: { id: customerId },
          select: { fullName: true },
        });
        freeTextName = c?.fullName?.trim() || null;
      }
      if (!freeTextName) freeTextName = 'Không tên';
      const roleRaw = (asString(col(p, 'Role')) || 'SELLER').toUpperCase();
      const savedParty = await prisma.transactionParty.create({
        data: {
          transactionId: txId,
          role: roleRaw === 'BUYER' ? 'BUYER' : 'SELLER',
          customerId,
          freeTextName,
          sortOrder: asNumber(col(p, 'SortOrder')) ?? i,
        },
      });
      const partyOld = asNumber(col(p, 'ID'));
      if (partyOld != null) await upsertMap(prisma, PARTY_ENTITY, partyOld, savedParty.id);
    }

    const snap = snapByTx.get(oldId);
    if (snap) {
      const savedSnap = await prisma.transactionSnapshot.create({
        data: {
          transactionId: txId,
          title: asString(col(snap, 'Title')),
          addressText: asString(col(snap, 'AddressText')),
          areaM2: asNumber(col(snap, 'AreaM2')),
          frontageM: asNumber(col(snap, 'FrontageM')),
          direction: asString(col(snap, 'Direction')),
          propertyKind: asString(col(snap, 'PropertyKind')),
          mapStatus: asString(col(snap, 'MapStatus')),
          mapPriceVnd: toBigInt(col(snap, 'MapPriceVnd')),
          mapPriceNote: asString(col(snap, 'MapPriceNote')),
          mapBrokerFeeNote: asString(col(snap, 'MapBrokerFeeNote')),
          mapNote: asString(col(snap, 'MapNote')),
          createdAt: toDate(col(snap, 'CreatedAtMs')),
        },
      });
      const snapOld = asNumber(col(snap, 'ID'));
      if (snapOld != null) await upsertMap(prisma, SNAP_ENTITY, snapOld, savedSnap.id);

      const imgs = [
        ...(snapOld != null ? (imgsBySnap.get(snapOld) ?? []) : []),
        ...(imgsByTx.get(oldId) ?? []),
      ];
      for (const [i, img] of imgs.entries()) {
        const stored = asString(col(img, 'StoredPath')) || '';
        let objectKey = `transactions/snapshots/${txId}/missing-${i}`;
        if (!skipFiles && s3 && stored) {
          const file = resolveLegacyFile(stored, imgRoot);
          if (file) {
            objectKey = `transactions/snapshots/${txId}/${file.fileName}`;
            await putPublic(s3, publicBucket, objectKey, file.abs, file.fileName);
          } else {
            console.warn(`  Ảnh snapshot GD ${oldId}: không thấy file ${stored}`);
            continue;
          }
        } else if (skipFiles || !stored) {
          continue;
        }
        const sourceOld = asNumber(col(img, 'SourceLodatImageId'));
        const savedImg = await prisma.transactionSnapshotImage.create({
          data: {
            snapshotId: savedSnap.id,
            objectKey,
            sortOrder: asNumber(col(img, 'SortOrder')) ?? i,
            rotationDeg: asNumber(col(img, 'RotationDeg')) ?? 0,
            sourceLodatImageId:
              sourceOld != null ? (lodatImageMap.get(String(sourceOld)) ?? null) : null,
          },
        });
        const imgOld = asNumber(col(img, 'ID'));
        if (imgOld != null) await upsertMap(prisma, SNAP_IMG_ENTITY, imgOld, savedImg.id);
      }
    }

    if (!skipFiles) {
      for (const [i, att] of (attByTx.get(oldId) ?? []).entries()) {
        const stored = asString(col(att, 'StoredPath')) || '';
        const file = stored ? resolveLegacyFile(stored, imgRoot) : null;
        if (!file) {
          if (stored) console.warn(`  Đính kèm GD ${oldId}: không thấy file ${stored}`);
          continue;
        }
        const kindRaw = (asString(col(att, 'Kind')) || 'KHAC').toUpperCase();
        const kind = ['HOP_DONG', 'SO_DO', 'KHAC'].includes(kindRaw) ? kindRaw : 'KHAC';
        const objectKey = `transactions/attachments/${txId}/${file.fileName}`;
        if (!s3 || !privateBucket) {
          console.warn(`  Bỏ đính kèm GD ${oldId}: thiếu R2_PRIVATE_BUCKET`);
          continue;
        }
        await putPublic(s3, privateBucket, objectKey, file.abs, file.fileName);
        const savedAtt = await prisma.transactionAttachment.create({
          data: {
            transactionId: txId,
            objectKey,
            kind,
            label: asString(col(att, 'Label')),
            sortOrder: asNumber(col(att, 'SortOrder')) ?? i,
            createdAt: toDate(col(att, 'CreatedAtMs')),
          },
        });
        const attOld = asNumber(col(att, 'ID'));
        if (attOld != null) await upsertMap(prisma, ATTACH_ENTITY, attOld, savedAtt.id);
      }
    }

    copied += 1;
  }

  const dest = await prisma.transaction.count();
  const mapped = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${TX_ENTITY}
  `;
  console.log(`Đã copy ${copied}/${txs.length} GD (bỏ ${skipped}).`);
  console.log(`Đích Transaction=${dest}, map transaction=${mapped[0]?.c ?? 0n}.`);

  await prisma.$disconnect();
  if (skipped && copied === 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
