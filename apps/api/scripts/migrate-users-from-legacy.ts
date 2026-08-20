/**
 * Copy tblUsers from legacy SQLite → Postgres User.
 * READ-ONLY on the old DB. Mapping goes to schema migrate (not public).
 *
 * Usage (on VPS, from apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *     pnpm exec tsx scripts/migrate-users-from-legacy.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const ENTITY = 'user';
const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';

type LegacyUser = {
  ID: number;
  FullName: string;
  Username: string;
  PasswordHash: string;
  Role: string;
  IsActive: number;
  CreatedAtMs: number | null;
};

function readLegacyUsers(sqlitePath: string): LegacyUser[] {
  const json = execFileSync(
    'sqlite3',
    [
      '-json',
      sqlitePath,
      'SELECT ID, FullName, Username, PasswordHash, Role, IsActive, CreatedAtMs FROM tblUsers ORDER BY ID',
    ],
    { encoding: 'utf8' },
  ).trim();
  if (!json) return [];
  return JSON.parse(json) as LegacyUser[];
}

function normalizeRole(role: string): 'ADMIN' | 'STAFF' {
  return String(role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STAFF';
}

async function main() {
  const sqlitePath = process.env.LEGACY_SQLITE ?? DEFAULT_SQLITE;
  if (!existsSync(sqlitePath)) {
    throw new Error(`Không thấy SQLite: ${sqlitePath}`);
  }

  const prisma = new PrismaClient();
  const rows = readLegacyUsers(sqlitePath);
  console.log(`Đọc ${rows.length} user từ SQLite (chỉ đọc).`);

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

  let copied = 0;
  for (const row of rows) {
    const username = String(row.Username).trim();
    if (!username) {
      console.warn(`Bỏ user cũ ID=${row.ID}: username trống`);
      continue;
    }

    const createdAt =
      row.CreatedAtMs && Number.isFinite(row.CreatedAtMs)
        ? new Date(Number(row.CreatedAtMs))
        : new Date();

    const user = await prisma.user.upsert({
      where: { username },
      create: {
        fullName: String(row.FullName || username).trim() || username,
        username,
        passwordHash: String(row.PasswordHash),
        role: normalizeRole(row.Role),
        isActive: Number(row.IsActive) === 1,
        createdAt,
      },
      update: {
        fullName: String(row.FullName || username).trim() || username,
        passwordHash: String(row.PasswordHash),
        role: normalizeRole(row.Role),
        isActive: Number(row.IsActive) === 1,
      },
    });

    await prisma.$executeRaw`
      INSERT INTO migrate.legacy_id_map (entity, old_id, new_id)
      VALUES (${ENTITY}, ${String(row.ID)}, ${user.id})
      ON CONFLICT (entity, old_id) DO UPDATE SET new_id = EXCLUDED.new_id, copied_at = NOW()
    `;
    copied += 1;
    console.log(`  ${row.ID} → ${user.id}  ${username}  (${user.role})`);
  }

  const mapped = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${ENTITY}
  `;
  await prisma.$disconnect();
  console.log(`Xong: ${copied}/${rows.length} user. Map user: ${mapped[0]?.c ?? '?'}`);
  console.log('Không ghi file SQLite cũ. Mật khẩu = hash CRM cũ (không log).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
