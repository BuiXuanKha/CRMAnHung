/**
 * Copy kênh liên hệ Facebook:
 *   1. tblEmployeeFacebookProfiles → EmployeeFacebookProfile
 *   2. tblPersonFacebook metadata → CustomerFacebook (UID NV, tên nick, thread)
 *
 * READ-ONLY on the old SQLite. Maps:
 *   entity `employee_facebook_profile`, `customer_facebook`.
 *
 * Needs map `user` + map `customer`. Does not copy messenger / images / avatar files.
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *     pnpm exec tsx scripts/migrate-facebook-profiles-from-legacy.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const PROFILE_ENTITY = 'employee_facebook_profile';
const FACEBOOK_ENTITY = 'customer_facebook';
const USER_ENTITY = 'user';
const CUSTOMER_ENTITY = 'customer';
const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';

type LegacyProfile = {
  ID: number;
  EmployeeId: number;
  EmployeeFacebookUid: string;
  NameProfile: string | null;
  IsActive: number;
  CreatedAtMs: number | null;
  UpdatedAtMs: number | null;
};

type LegacyPersonFacebook = {
  ID: number;
  PersonId: number;
  CustomerUid: string | null;
  CustomerName: string | null;
  AvatarUrl: string | null;
  AvatarSourceKey: string | null;
  ThreadId: string | null;
  ThreadType: string | null;
  PageUrl: string | null;
  CapturedAt: string | null;
  EmployeeFacebookUid: string | null;
  AssetId: string | null;
  MailboxId: string | null;
  BusinessId: string | null;
  ScanSource: string | null;
  ScanSourceLabel: string | null;
  CreatedAtMs: number | null;
  UpdatedAtMs: number | null;
};

function sqliteJson<T>(sqlitePath: string, sql: string): T[] {
  const json = execFileSync('sqlite3', ['-json', sqlitePath, sql], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
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

async function copyProfiles(
  prisma: PrismaClient,
  sqlitePath: string,
  userMap: Map<string, string>,
): Promise<void> {
  const rows = sqliteJson<LegacyProfile>(
    sqlitePath,
    `SELECT ID, EmployeeId, EmployeeFacebookUid, NameProfile, IsActive, CreatedAtMs, UpdatedAtMs
     FROM tblEmployeeFacebookProfiles
     ORDER BY ID`,
  );
  console.log(`Đọc ${rows.length} profile Facebook NV từ SQLite (chỉ đọc).`);

  const profileMap = await loadMap(prisma, PROFILE_ENTITY);
  let copied = 0;
  let skipped = 0;

  for (const row of rows) {
    const employeeId = userMap.get(String(row.EmployeeId));
    if (!employeeId) {
      console.warn(`  Bỏ profile ID=${row.ID}: không map user ${row.EmployeeId}`);
      skipped += 1;
      continue;
    }

    const facebookUid = String(row.EmployeeFacebookUid || '').trim();
    if (!facebookUid) {
      console.warn(`  Bỏ profile ID=${row.ID}: UID trống`);
      skipped += 1;
      continue;
    }

    const data = {
      employeeId,
      facebookUid,
      nickname: trimOrNull(row.NameProfile),
      isActive: Number(row.IsActive) === 1,
      createdAt: toDate(row.CreatedAtMs),
      updatedAt: toDate(row.UpdatedAtMs ?? row.CreatedAtMs),
    };

    const mappedId = profileMap.get(String(row.ID));
    const existing = mappedId
      ? await prisma.employeeFacebookProfile.findUnique({ where: { id: mappedId } })
      : null;

    const saved = existing
      ? await prisma.employeeFacebookProfile.update({ where: { id: existing.id }, data })
      : await prisma.employeeFacebookProfile.create({ data });

    await upsertMap(prisma, PROFILE_ENTITY, row.ID, saved.id);
    profileMap.set(String(row.ID), saved.id);
    copied += 1;
    console.log(
      `  profile ${row.ID} → ${saved.id}  ${facebookUid}  (${data.nickname ?? '—'})`,
    );
  }

  console.log(`Xong profile NV: ${copied}/${rows.length} (bỏ ${skipped}).`);
}

async function copyCustomerFacebook(
  prisma: PrismaClient,
  sqlitePath: string,
  customerMap: Map<string, string>,
): Promise<void> {
  const totalRow = sqliteJson<{ c: number }>(
    sqlitePath,
    'SELECT COUNT(*) AS c FROM tblPersonFacebook',
  );
  const total = Number(totalRow[0]?.c ?? 0);
  console.log(`Đọc ${total} tblPersonFacebook từ SQLite (từng lô, chỉ đọc).`);

  const facebookMap = await loadMap(prisma, FACEBOOK_ENTITY);
  let copied = 0;
  let skipped = 0;
  const pageSize = 150;
  let offset = 0;

  while (offset < total) {
    const rows = sqliteJson<LegacyPersonFacebook>(
      sqlitePath,
      `SELECT ID, PersonId, CustomerUid, CustomerName, AvatarUrl, AvatarSourceKey,
              ThreadId, ThreadType, PageUrl, CapturedAt, EmployeeFacebookUid,
              AssetId, MailboxId, BusinessId, ScanSource, ScanSourceLabel,
              CreatedAtMs, UpdatedAtMs
       FROM tblPersonFacebook
       ORDER BY ID
       LIMIT ${pageSize} OFFSET ${offset}`,
    );
    if (rows.length === 0) break;

    for (const row of rows) {
      const customerId = customerMap.get(String(row.PersonId));
      if (!customerId) {
        console.warn(`  Bỏ facebook ID=${row.ID}: không map customer ${row.PersonId}`);
        skipped += 1;
        continue;
      }

      const rawMeta = JSON.stringify({
        avatarSourceKey: trimOrNull(row.AvatarSourceKey),
        threadType: trimOrNull(row.ThreadType),
        pageUrl: trimOrNull(row.PageUrl),
        capturedAt: trimOrNull(row.CapturedAt),
        assetId: trimOrNull(row.AssetId),
        mailboxId: trimOrNull(row.MailboxId),
        businessId: trimOrNull(row.BusinessId),
      });

      const data = {
        customerId,
        customerUid: trimOrNull(row.CustomerUid),
        threadId: trimOrNull(row.ThreadId),
        facebookName: trimOrNull(row.CustomerName),
        avatarUrl: trimOrNull(row.AvatarUrl),
        scanSource: trimOrNull(row.ScanSource),
        scanSourceLabel: trimOrNull(row.ScanSourceLabel),
        employeeFacebookUid: trimOrNull(row.EmployeeFacebookUid),
        rawMeta,
        createdAt: toDate(row.CreatedAtMs),
        updatedAt: toDate(row.UpdatedAtMs ?? row.CreatedAtMs),
      };

      const mappedId = facebookMap.get(String(row.ID));
      const existing = mappedId
        ? await prisma.customerFacebook.findUnique({ where: { id: mappedId } })
        : await prisma.customerFacebook.findUnique({ where: { customerId } });

      const saved = existing
        ? await prisma.customerFacebook.update({ where: { id: existing.id }, data })
        : await prisma.customerFacebook.create({ data });

      await upsertMap(prisma, FACEBOOK_ENTITY, row.ID, saved.id);
      facebookMap.set(String(row.ID), saved.id);
      copied += 1;
    }

    offset += rows.length;
    console.log(`  … đã copy ${copied}/${total}`);
  }

  console.log(`Xong facebook khách: ${copied}/${total} (bỏ ${skipped}).`);
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

  await copyProfiles(prisma, sqlitePath, userMap);
  await copyCustomerFacebook(prisma, sqlitePath, customerMap);

  const mapped = await prisma.$queryRaw<Array<{ entity: string; c: bigint }>>`
    SELECT entity, COUNT(*)::bigint AS c
    FROM migrate.legacy_id_map
    WHERE entity IN (${PROFILE_ENTITY}, ${FACEBOOK_ENTITY})
    GROUP BY entity
    ORDER BY entity
  `;
  await prisma.$disconnect();
  console.log(
    'Map:',
    mapped.map((r) => `${r.entity}=${r.c}`).join(', ') || '(trống)',
  );
  console.log('Không ghi SQLite cũ. Chưa copy tin nhắn / ảnh chat / file avatar.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
