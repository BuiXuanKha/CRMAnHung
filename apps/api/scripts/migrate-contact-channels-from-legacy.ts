/**
 * Copy tblEmployeeHotline + tblEmployeeFacebookProfiles → Postgres.
 * READ-ONLY on the old DB. Mapping goes to schema migrate (not public).
 *
 * Requires users already in migrate.legacy_id_map (entity = user).
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *     pnpm exec tsx scripts/migrate-contact-channels-from-legacy.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const HOTLINE_ENTITY = 'employee_hotline';
const FB_ENTITY = 'employee_facebook_profile';
const USER_ENTITY = 'user';
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

type LegacyFacebookProfile = {
  ID: number;
  EmployeeId: number;
  EmployeeFacebookUid: string;
  NameProfile: string | null;
  IsActive: number;
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

function toDate(ms: number | null | undefined): Date {
  if (ms && Number.isFinite(ms)) return new Date(Number(ms));
  return new Date();
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

async function lookupNewId(
  prisma: PrismaClient,
  entity: string,
  oldId: number | string,
): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ new_id: string }>>`
    SELECT new_id FROM migrate.legacy_id_map
    WHERE entity = ${entity} AND old_id = ${String(oldId)}
    LIMIT 1
  `;
  return rows[0]?.new_id ?? null;
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

async function copyHotlines(
  prisma: PrismaClient,
  rows: LegacyHotline[],
): Promise<{ copied: number; skipped: number }> {
  let copied = 0;
  let skipped = 0;

  for (const row of rows) {
    const employeeId = await lookupNewId(prisma, USER_ENTITY, row.EmployeeId);
    if (!employeeId) {
      console.warn(`  Bỏ hotline cũ ID=${row.ID}: không map user ${row.EmployeeId}`);
      skipped += 1;
      continue;
    }

    const phone = String(row.Phone || '').trim();
    const label = String(row.Label || '').trim() || phone;
    if (!phone) {
      console.warn(`  Bỏ hotline cũ ID=${row.ID}: số trống`);
      skipped += 1;
      continue;
    }

    const createdAt = toDate(row.CreatedAtMs);
    const updatedAt = toDate(row.UpdatedAtMs ?? row.CreatedAtMs);
    const isActive = Number(row.IsActive) === 1;
    const sortOrder = Number.isFinite(row.SortOrder) ? Number(row.SortOrder) : 0;

    const mappedId = await lookupNewId(prisma, HOTLINE_ENTITY, row.ID);
    const existing = mappedId
      ? await prisma.employeeHotline.findUnique({ where: { id: mappedId } })
      : null;

    const data = {
      employeeId,
      phone,
      label,
      isActive,
      sortOrder,
      createdAt,
      updatedAt,
    };

    const saved = existing
      ? await prisma.employeeHotline.update({ where: { id: existing.id }, data })
      : await prisma.employeeHotline.create({ data });

    await upsertMap(prisma, HOTLINE_ENTITY, row.ID, saved.id);
    copied += 1;
    console.log(`  hotline ${row.ID} → ${saved.id}  ${phone}  (${label})`);
  }

  return { copied, skipped };
}

async function copyFacebookProfiles(
  prisma: PrismaClient,
  rows: LegacyFacebookProfile[],
): Promise<{ copied: number; skipped: number }> {
  let copied = 0;
  let skipped = 0;

  for (const row of rows) {
    const employeeId = await lookupNewId(prisma, USER_ENTITY, row.EmployeeId);
    if (!employeeId) {
      console.warn(
        `  Bỏ profile FB cũ ID=${row.ID}: không map user ${row.EmployeeId}`,
      );
      skipped += 1;
      continue;
    }

    const facebookUid = String(row.EmployeeFacebookUid || '').trim();
    if (!facebookUid) {
      console.warn(`  Bỏ profile FB cũ ID=${row.ID}: UID trống`);
      skipped += 1;
      continue;
    }

    const nickname = String(row.NameProfile || '').trim() || null;
    const createdAt = toDate(row.CreatedAtMs);
    const updatedAt = toDate(row.UpdatedAtMs ?? row.CreatedAtMs);
    const isActive = Number(row.IsActive) === 1;

    const mappedId = await lookupNewId(prisma, FB_ENTITY, row.ID);
    const existing = mappedId
      ? await prisma.employeeFacebookProfile.findUnique({ where: { id: mappedId } })
      : null;

    const data = {
      employeeId,
      facebookUid,
      nickname,
      isActive,
      createdAt,
      updatedAt,
    };

    const saved = existing
      ? await prisma.employeeFacebookProfile.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.employeeFacebookProfile.create({ data });

    await upsertMap(prisma, FB_ENTITY, row.ID, saved.id);
    copied += 1;
    console.log(`  fb ${row.ID} → ${saved.id}  ${facebookUid}  (${nickname || '—'})`);
  }

  return { copied, skipped };
}

async function main() {
  const sqlitePath = process.env.LEGACY_SQLITE ?? DEFAULT_SQLITE;
  if (!existsSync(sqlitePath)) {
    throw new Error(`Không thấy SQLite: ${sqlitePath}`);
  }

  const prisma = new PrismaClient();
  await ensureMigrateSchema(prisma);

  const userCount = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${USER_ENTITY}
  `;
  if (!userCount[0] || userCount[0].c === 0n) {
    throw new Error(
      'Chưa có map user. Chạy pnpm users:migrate-legacy trước.',
    );
  }

  const hotlines = sqliteJson<LegacyHotline>(
    sqlitePath,
    `SELECT ID, EmployeeId, Phone, Label, IsActive, SortOrder, CreatedAtMs, UpdatedAtMs
     FROM tblEmployeeHotline
     ORDER BY EmployeeId, SortOrder, ID`,
  );
  const profiles = sqliteJson<LegacyFacebookProfile>(
    sqlitePath,
    `SELECT ID, EmployeeId, EmployeeFacebookUid, NameProfile, IsActive, CreatedAtMs, UpdatedAtMs
     FROM tblEmployeeFacebookProfiles
     ORDER BY EmployeeId, ID`,
  );

  console.log(
    `Đọc ${hotlines.length} hotline, ${profiles.length} profile FB (chỉ đọc SQLite).`,
  );

  const hotlineResult = await copyHotlines(prisma, hotlines);
  const fbResult = await copyFacebookProfiles(prisma, profiles);

  await prisma.$disconnect();
  console.log(
    `Xong hotline: ${hotlineResult.copied}/${hotlines.length} (bỏ ${hotlineResult.skipped}).`,
  );
  console.log(
    `Xong profile FB: ${fbResult.copied}/${profiles.length} (bỏ ${fbResult.skipped}).`,
  );
  console.log('Không ghi file SQLite cũ.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
