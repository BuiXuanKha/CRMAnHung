/**
 * Copy tblPerson (basic fields only) → Postgres Customer.
 * READ-ONLY on the old DB. Mapping: migrate.legacy_id_map entity `customer`.
 *
 * Does not copy phones, Facebook, care history, or hotlines.
 * Requires users already mapped (entity `user`).
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *     pnpm exec tsx scripts/migrate-customers-from-legacy.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const CUSTOMER_ENTITY = 'customer';
const USER_ENTITY = 'user';
const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';

type LegacyPerson = {
  ID: number;
  EmployeeId: number;
  FullName: string | null;
  Note: string | null;
  Status: string | null;
  MinBudgetVnd: number | null;
  MaxBudgetVnd: number | null;
  IsHidden: number;
  IsPinned: number;
  PinnedAtMs: number | null;
  AutoRestoredAtMs: number | null;
  CreatedAtMs: number | null;
  UpdatedAtMs: number | null;
};

function sqliteJson<T>(sqlitePath: string, sql: string): T[] {
  const json = execFileSync('sqlite3', ['-json', sqlitePath, sql], {
    encoding: 'utf8',
  }).trim();
  if (!json) return [];
  return JSON.parse(json) as T[];
}

function toDate(ms: number | null | undefined): Date | null {
  if (ms == null) return null;
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n);
}

function toBudget(value: number | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
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

  const userMap = await loadMap(prisma, USER_ENTITY);
  if (userMap.size === 0) {
    throw new Error('Chưa có map user. Chạy pnpm users:migrate-legacy trước.');
  }

  const customerMap = await loadMap(prisma, CUSTOMER_ENTITY);
  const rows = sqliteJson<LegacyPerson>(
    sqlitePath,
    `SELECT ID, EmployeeId, FullName, Note, Status,
            MinBudgetVnd, MaxBudgetVnd, IsHidden, IsPinned,
            PinnedAtMs, AutoRestoredAtMs, CreatedAtMs, UpdatedAtMs
     FROM tblPerson
     ORDER BY ID`,
  );

  console.log(`Đọc ${rows.length} khách từ SQLite (chỉ đọc, chỉ cột cơ bản).`);

  let copied = 0;
  let skipped = 0;

  for (const row of rows) {
    const employeeId = userMap.get(String(row.EmployeeId));
    if (!employeeId) {
      console.warn(`  Bỏ person ID=${row.ID}: không map user ${row.EmployeeId}`);
      skipped += 1;
      continue;
    }

    const fullName =
      String(row.FullName || '').trim() || `Khách ${row.ID}`;
    const note = String(row.Note || '').trim() || null;
    const status = String(row.Status || '').trim() || 'KHACH_MOI';
    const createdAt = toDate(row.CreatedAtMs) ?? new Date();
    const updatedAt = toDate(row.UpdatedAtMs) ?? createdAt;
    const isPinned = Number(row.IsPinned) === 1;
    const data = {
      employeeId,
      fullName,
      status,
      budgetMinVnd: toBudget(row.MinBudgetVnd),
      budgetMaxVnd: toBudget(row.MaxBudgetVnd),
      note,
      isPinned,
      isHidden: Number(row.IsHidden) === 1,
      pinnedAt: isPinned ? toDate(row.PinnedAtMs) : null,
      autoRestoredAt: toDate(row.AutoRestoredAtMs),
      createdAt,
      updatedAt,
    };

    const mappedId = customerMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.customer.findUnique({ where: { id: mappedId } })
      : null;

    const saved = existing
      ? await prisma.customer.update({ where: { id: existing.id }, data })
      : await prisma.customer.create({ data });

    await upsertMap(prisma, CUSTOMER_ENTITY, row.ID, saved.id);
    customerMap.set(String(row.ID), saved.id);
    copied += 1;

    if (copied % 100 === 0) {
      console.log(`  … ${copied}/${rows.length}`);
    }
  }

  const mapped = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${CUSTOMER_ENTITY}
  `;
  await prisma.$disconnect();
  console.log(
    `Xong: ${copied}/${rows.length} khách (bỏ ${skipped}). Map customer: ${mapped[0]?.c ?? '?'}.`,
  );
  console.log('Chưa copy SĐT / Facebook / chăm sóc / hotline. Không ghi SQLite cũ.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
