/**
 * Copy tblPersonPhone → CustomerPhone.
 * READ-ONLY on the old SQLite. Map entity `customer_phone`.
 *
 * Needs map `customer` (customers already copied).
 * Primary phone on list = SortOrder ASC, then ID ASC (same as CRM cũ).
 *
 * Normalize via digitsFromPhoneRaw → `0` + 9 digits (BUG-018).
 * Same number across employees is kept (unique is per employeeId + phone).
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *     pnpm exec tsx scripts/migrate-phones-from-legacy.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { digitsFromPhoneRaw } from '@crmanhung/shared';
import { PrismaClient } from '@prisma/client';

const PHONE_ENTITY = 'customer_phone';
const CUSTOMER_ENTITY = 'customer';
const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';

type LegacyPhone = {
  ID: number;
  PersonId: number;
  Phone: string;
  Label: string | null;
  SortOrder: number;
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

  const customerMap = await loadMap(prisma, CUSTOMER_ENTITY);
  if (customerMap.size === 0) {
    throw new Error(
      'Chưa có map customer. Chạy pnpm customers:migrate-legacy trước.',
    );
  }

  const customerIds = [...new Set(customerMap.values())];
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, employeeId: true },
  });
  const employeeByCustomer = new Map(
    customers.map((c) => [c.id, c.employeeId] as const),
  );

  const rows = sqliteJson<LegacyPhone>(
    sqlitePath,
    `SELECT ID, PersonId, Phone, Label, SortOrder, CreatedAtMs
     FROM tblPersonPhone
     ORDER BY PersonId, SortOrder, ID`,
  );
  console.log(`Đọc ${rows.length} SĐT từ SQLite (chỉ đọc).`);

  const phoneMap = await loadMap(prisma, PHONE_ENTITY);
  let copied = 0;
  let skipped = 0;

  for (const row of rows) {
    const customerId = customerMap.get(String(row.PersonId));
    if (!customerId) {
      console.warn(`  Bỏ phone ID=${row.ID}: không map customer ${row.PersonId}`);
      skipped += 1;
      continue;
    }

    const employeeId = employeeByCustomer.get(customerId);
    if (!employeeId) {
      console.warn(`  Bỏ phone ID=${row.ID}: thiếu employeeId cho ${customerId}`);
      skipped += 1;
      continue;
    }

    const phone = digitsFromPhoneRaw(String(row.Phone || ''));
    if (!/^0\d{9}$/.test(phone)) {
      console.warn(`  Bỏ phone ID=${row.ID}: số không chuẩn «${row.Phone}»`);
      skipped += 1;
      continue;
    }

    const data = {
      customerId,
      employeeId,
      phone,
      label: trimOrNull(row.Label),
      sortOrder: Number.isFinite(Number(row.SortOrder)) ? Number(row.SortOrder) : 0,
      createdAt: toDate(row.CreatedAtMs),
    };

    const mappedId = phoneMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.customerPhone.findUnique({ where: { id: mappedId } })
      : null;

    try {
      const saved = existing
        ? await prisma.customerPhone.update({ where: { id: existing.id }, data })
        : await prisma.customerPhone.create({ data });

      await upsertMap(prisma, PHONE_ENTITY, row.ID, saved.id);
      phoneMap.set(String(row.ID), saved.id);
      copied += 1;
    } catch (err) {
      console.warn(`  Bỏ phone ID=${row.ID}: unique conflict (${phone} / NV)`);
      skipped += 1;
      console.warn(err);
    }

    if (copied % 50 === 0 && copied > 0) {
      console.log(`  … ${copied}/${rows.length}`);
    }
  }

  const mapped = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${PHONE_ENTITY}
  `;
  await prisma.$disconnect();
  console.log(
    `Xong SĐT: ${copied}/${rows.length} (bỏ ${skipped}). Map customer_phone: ${mapped[0]?.c ?? '?'}.`,
  );
  console.log('Không ghi SQLite cũ. Chưa copy lịch sử chăm sóc / tin nhắn.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
