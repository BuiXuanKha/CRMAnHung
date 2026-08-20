/**
 * Copy tblPersonCareHistory → CustomerCareNote.
 * READ-ONLY on the old SQLite. Map entity `customer_care`.
 *
 * Needs map `customer` + map `user`.
 * List "Nhu cầu" = latest non-empty NeedSummary (CreatedAtMs DESC, ID DESC).
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *     pnpm exec tsx scripts/migrate-care-from-legacy.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const CARE_ENTITY = 'customer_care';
const CUSTOMER_ENTITY = 'customer';
const USER_ENTITY = 'user';
const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';

type LegacyCare = {
  ID: number;
  PersonId: number;
  EmployeeId: number | null;
  NeedSummary: string | null;
  Note: string | null;
  CreatedAtMs: number | null;
};

function sqliteJson<T>(sqlitePath: string, sql: string): T[] {
  const json = execFileSync('sqlite3', ['-json', sqlitePath, sql], {
    encoding: 'utf8',
  }).trim();
  if (!json) return [];
  return JSON.parse(json) as T[];
}

function toDate(ms: number | null | undefined): Date {
  if (ms && Number.isFinite(Number(ms))) return new Date(Number(ms));
  return new Date();
}

function trimOrNull(value: string | null | undefined): string | null {
  const t = String(value ?? '').trim();
  return t ? t : null;
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
  if (customerMap.size === 0) {
    throw new Error('Chưa có map customer. Chạy pnpm customers:migrate-legacy trước.');
  }

  const owners = await prisma.customer.findMany({
    select: { id: true, employeeId: true },
  });
  const ownerByCustomer = new Map(owners.map((c) => [c.id, c.employeeId]));

  const rows = sqliteJson<LegacyCare>(
    sqlitePath,
    `SELECT ID, PersonId, EmployeeId, NeedSummary, Note, CreatedAtMs
     FROM tblPersonCareHistory
     ORDER BY ID`,
  );
  console.log(`Đọc ${rows.length} lịch sử chăm sóc từ SQLite (chỉ đọc).`);

  const careMap = await loadMap(prisma, CARE_ENTITY);
  let copied = 0;
  let skipped = 0;

  for (const row of rows) {
    const customerId = customerMap.get(String(row.PersonId));
    if (!customerId) {
      console.warn(`  Bỏ care ID=${row.ID}: không map customer ${row.PersonId}`);
      skipped += 1;
      continue;
    }

    const mappedEmployee =
      row.EmployeeId != null ? userMap.get(String(row.EmployeeId)) : undefined;
    const employeeId = mappedEmployee ?? ownerByCustomer.get(customerId);
    if (!employeeId) {
      console.warn(`  Bỏ care ID=${row.ID}: không map user ${row.EmployeeId}`);
      skipped += 1;
      continue;
    }
    if (!mappedEmployee && row.EmployeeId != null) {
      console.warn(
        `  Care ID=${row.ID}: không map user ${row.EmployeeId}, gắn NV chủ hồ sơ`,
      );
    }

    const data = {
      customerId,
      employeeId,
      needSummary: trimOrNull(row.NeedSummary),
      note: String(row.Note ?? '').trim(),
      createdAt: toDate(row.CreatedAtMs),
    };

    const mappedId = careMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.customerCareNote.findUnique({ where: { id: mappedId } })
      : null;

    const saved = existing
      ? await prisma.customerCareNote.update({ where: { id: existing.id }, data })
      : await prisma.customerCareNote.create({ data });

    await upsertMap(prisma, CARE_ENTITY, row.ID, saved.id);
    careMap.set(String(row.ID), saved.id);
    copied += 1;

    if (copied % 50 === 0) {
      console.log(`  … ${copied}/${rows.length}`);
    }
  }

  const mapped = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${CARE_ENTITY}
  `;
  await prisma.$disconnect();
  console.log(
    `Xong chăm sóc: ${copied}/${rows.length} (bỏ ${skipped}). Map customer_care: ${mapped[0]?.c ?? '?'}.`,
  );
  console.log('Không ghi SQLite cũ. Chưa bật form cập nhật chăm sóc.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
