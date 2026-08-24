/**
 * Copy tblLodats (Address Kind=PROJECT) → ProjectLot (kho).
 * READ-ONLY on old SQLite. Map entity: `project_lot` (old_id = tblLodats.ID).
 *
 * Needs map `address` (+ optional `user` for creator).
 * Does NOT create Lodat / maps / images — see migrate-lodats-from-legacy (next).
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *     pnpm project-lots:migrate-legacy
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const PROJECT_LOT_ENTITY = 'project_lot';
const ADDRESS_ENTITY = 'address';
const USER_ENTITY = 'user';
const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';

type LegacyProjectLodat = {
  ID: number;
  Title: string | null;
  AddressId: number;
  AreaM2: number | null;
  FrontageM: number | null;
  Direction: string | null;
  Note: string | null;
  CreatedByEmployeeId: number | null;
  CreatedAtMs: number | null;
  UpdatedAtMs: number | null;
};

function sqliteJson<T>(sqlitePath: string, sql: string): T[] {
  const json = execFileSync('sqlite3', ['-json', sqlitePath, sql], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
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

function toFloat(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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
  oldId: number,
  newId: string,
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO migrate.legacy_id_map (entity, old_id, new_id)
    VALUES (${entity}, ${String(oldId)}, ${newId})
    ON CONFLICT (entity, old_id) DO UPDATE SET new_id = EXCLUDED.new_id, copied_at = NOW()
  `;
}

async function main() {
  const sqlitePath = process.env.LEGACY_SQLITE ?? DEFAULT_SQLITE;
  if (!existsSync(sqlitePath)) {
    throw new Error(`Không thấy SQLite: ${sqlitePath}`);
  }

  const prisma = new PrismaClient();
  await ensureMigrateSchema(prisma);

  const addressMap = await loadMap(prisma, ADDRESS_ENTITY);
  if (addressMap.size === 0) {
    throw new Error(
      'Chưa có map address. Chạy pnpm addresses:migrate-legacy trước.',
    );
  }

  const userMap = await loadMap(prisma, USER_ENTITY);
  if (userMap.size === 0) {
    console.warn('Chưa có map user — CreatedBy sẽ null.');
  }

  const rows = sqliteJson<LegacyProjectLodat>(
    sqlitePath,
    `SELECT l.ID, l.Title, l.AddressId, l.AreaM2, l.FrontageM, l.Direction, l.Note,
            l.CreatedByEmployeeId, l.CreatedAtMs, l.UpdatedAtMs
     FROM tblLodats l
     JOIN tblAddresses a ON a.ID = l.AddressId
     WHERE a.Kind = 'PROJECT'
     ORDER BY l.ID`,
  );
  console.log(`Đọc ${rows.length} lô PROJECT (kho) từ SQLite.`);

  // Preflight addresses
  const missingAddrs = new Set<string>();
  for (const row of rows) {
    if (!addressMap.has(String(row.AddressId))) {
      missingAddrs.add(String(row.AddressId));
    }
  }
  if (missingAddrs.size) {
    console.warn(
      `Preflight: ${missingAddrs.size} AddressId chưa map — các lô đó sẽ bỏ.`,
    );
    console.warn(`  missing address old_ids: ${[...missingAddrs].slice(0, 20).join(',')}`);
  } else {
    console.log('Preflight: mọi AddressId đều có map.');
  }

  const projectLotMap = await loadMap(prisma, PROJECT_LOT_ENTITY);
  let copied = 0;
  let skipped = 0;

  for (const row of rows) {
    const addressId = addressMap.get(String(row.AddressId));
    if (!addressId) {
      console.warn(`  Bỏ lodat ID=${row.ID}: không map address ${row.AddressId}`);
      skipped += 1;
      continue;
    }

    const title = String(row.Title || '').trim() || `Lô #${row.ID}`;
    const createdByEmployeeId =
      row.CreatedByEmployeeId != null
        ? (userMap.get(String(row.CreatedByEmployeeId)) ?? null)
        : null;

    const data = {
      addressId,
      title,
      areaM2: toFloat(row.AreaM2),
      frontageM: toFloat(row.FrontageM),
      direction: trimOrNull(row.Direction),
      note: trimOrNull(row.Note),
      isHidden: false,
      createdByEmployeeId,
      createdAt: toDate(row.CreatedAtMs),
      updatedAt: toDate(row.UpdatedAtMs ?? row.CreatedAtMs),
    };

    const mappedId = projectLotMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.projectLot.findUnique({ where: { id: mappedId } })
      : null;

    const saved = existing
      ? await prisma.projectLot.update({ where: { id: existing.id }, data })
      : await prisma.projectLot.create({ data });

    await upsertMap(prisma, PROJECT_LOT_ENTITY, row.ID, saved.id);
    projectLotMap.set(String(row.ID), saved.id);
    copied += 1;
    if (copied % 500 === 0) {
      console.log(`  … ${copied}/${rows.length}`);
    }
  }

  const mapped = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${PROJECT_LOT_ENTITY}
  `;
  const live = await prisma.projectLot.count();
  await prisma.$disconnect();

  console.log(
    `Xong ProjectLot: ${copied}/${rows.length} (bỏ ${skipped}). Map: ${mapped[0]?.c ?? '?'}. Live: ${live}.`,
  );
  console.log('Không ghi SQLite cũ. Chưa copy Lodat/map/ảnh.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
