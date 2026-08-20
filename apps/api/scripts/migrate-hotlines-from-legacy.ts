/**
 * Copy tblEmployeeHotline → EmployeeHotline, then set Customer.sourceHotlineId.
 * READ-ONLY on the old SQLite. Maps: entity `employee_hotline`.
 *
 * Needs map `user` + map `customer` (customers already copied).
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *     pnpm exec tsx scripts/migrate-hotlines-from-legacy.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const HOTLINE_ENTITY = 'employee_hotline';
const USER_ENTITY = 'user';
const CUSTOMER_ENTITY = 'customer';
const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';

type LegacyHotline = {
  ID: number;
  EmployeeId: number;
  Phone: string;
  Label: string;
  IsActive: number;
  SortOrder: number;
  CreatedAtMs: number | null;
  UpdatedAtMs: number | null;
};

type LegacyPersonSource = {
  ID: number;
  SourceHotlineId: number;
};

function sqliteJson<T>(sqlitePath: string, sql: string): T[] {
  const json = execFileSync('sqlite3', ['-json', sqlitePath, sql], {
    encoding: 'utf8',
  }).trim();
  if (!json) return [];
  return JSON.parse(json) as T[];
}

function toDate(ms: number | null | undefined): Date {
  if (ms && Number.isFinite(ms)) return new Date(Number(ms));
  return new Date();
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
    throw new Error(
      'Chưa có map customer. Chạy pnpm customers:migrate-legacy trước, rồi gắn nguồn.',
    );
  }

  const hotlines = sqliteJson<LegacyHotline>(
    sqlitePath,
    `SELECT ID, EmployeeId, Phone, Label, IsActive, SortOrder, CreatedAtMs, UpdatedAtMs
     FROM tblEmployeeHotline
     ORDER BY EmployeeId, SortOrder, ID`,
  );
  console.log(`Đọc ${hotlines.length} hotline từ SQLite (chỉ đọc).`);

  const hotlineMap = await loadMap(prisma, HOTLINE_ENTITY);
  let copied = 0;
  let skipped = 0;

  for (const row of hotlines) {
    const employeeId = userMap.get(String(row.EmployeeId));
    if (!employeeId) {
      console.warn(`  Bỏ hotline ID=${row.ID}: không map user ${row.EmployeeId}`);
      skipped += 1;
      continue;
    }

    const phone = String(row.Phone || '').trim();
    const label = String(row.Label || '').trim() || phone;
    if (!phone) {
      console.warn(`  Bỏ hotline ID=${row.ID}: số trống`);
      skipped += 1;
      continue;
    }

    const createdAt = toDate(row.CreatedAtMs);
    const updatedAt = toDate(row.UpdatedAtMs ?? row.CreatedAtMs);
    const data = {
      employeeId,
      phone,
      label,
      isActive: Number(row.IsActive) === 1,
      sortOrder: Number.isFinite(row.SortOrder) ? Number(row.SortOrder) : 0,
      createdAt,
      updatedAt,
    };

    const mappedId = hotlineMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.employeeHotline.findUnique({ where: { id: mappedId } })
      : null;

    const saved = existing
      ? await prisma.employeeHotline.update({ where: { id: existing.id }, data })
      : await prisma.employeeHotline.create({ data });

    await upsertMap(prisma, HOTLINE_ENTITY, row.ID, saved.id);
    hotlineMap.set(String(row.ID), saved.id);
    copied += 1;
    console.log(`  hotline ${row.ID} → ${saved.id}  ${phone}  (${label})`);
  }

  const sources = sqliteJson<LegacyPersonSource>(
    sqlitePath,
    `SELECT ID, SourceHotlineId FROM tblPerson
     WHERE SourceHotlineId IS NOT NULL
     ORDER BY ID`,
  );
  console.log(`Gắn nguồn cho ${sources.length} khách có SourceHotlineId.`);

  let linked = 0;
  let linkSkipped = 0;

  for (const row of sources) {
    const customerId = customerMap.get(String(row.ID));
    const sourceHotlineId = hotlineMap.get(String(row.SourceHotlineId));
    if (!customerId) {
      console.warn(`  Bỏ gắn person ${row.ID}: không map customer`);
      linkSkipped += 1;
      continue;
    }
    if (!sourceHotlineId) {
      console.warn(
        `  Bỏ gắn person ${row.ID}: không map hotline ${row.SourceHotlineId}`,
      );
      linkSkipped += 1;
      continue;
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: { sourceHotlineId },
    });
    linked += 1;
  }

  const mapped = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${HOTLINE_ENTITY}
  `;
  await prisma.$disconnect();
  console.log(
    `Xong hotline: ${copied}/${hotlines.length} (bỏ ${skipped}). Map: ${mapped[0]?.c ?? '?'}.`,
  );
  console.log(`Xong gắn nguồn: ${linked}/${sources.length} (bỏ ${linkSkipped}).`);
  console.log('Không ghi SQLite cũ. Chưa copy profile Facebook NV.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
