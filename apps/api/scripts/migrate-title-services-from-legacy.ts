/**
 * Copy tblTitleService* → TitleService + progress + money (+ file private R2).
 * READ-ONLY on SQLite and `/var/www/anhungland-crm/api/img`.
 *
 * Maps: `title_service`, `title_service_progress`, `title_service_money`,
 *       `title_service_attachment`.
 *
 * Needs: `user`, `customer`. Giữ CreatedByEmployeeId (kha/buinam) — không gán admin.
 *
 * Usage (VPS, từ apps/api):
 *   LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
 *     pnpm title-services:migrate-legacy
 *
 * SKIP_TITLE_FILES=1 — bỏ file giấy tờ R2 (live hiện 0 file).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

const TITLE_ENTITY = 'title_service';
const PROGRESS_ENTITY = 'title_service_progress';
const MONEY_ENTITY = 'title_service_money';
const ATTACH_ENTITY = 'title_service_attachment';
const USER_ENTITY = 'user';
const CUSTOMER_ENTITY = 'customer';

const DEFAULT_SQLITE = '/var/www/anhungland-crm/database/facebook_customer_crm.db';
const DEFAULT_IMG_ROOT = '/var/www/anhungland-crm/api/img';

const STATUSES = new Set(['DANG_LAM', 'TAM_DUNG', 'HOAN_THANH', 'HUY']);
const STEPS = new Set([
  'BAN_GIA',
  'THU_THAP_GIAY_TO',
  'DO_DAC',
  'NOP_HO_SO',
  'BO_SUNG',
  'LAM_VIEC_CO_QUAN',
  'NHAN_KET_QUA',
  'BAN_GIAO',
  'KHAC',
]);
const MONEY_KINDS = new Set(['THU', 'CHI']);
const DOC_KINDS = new Set(['SO_DO', 'CAN_CUOC', 'KHAC']);

type Row = Record<string, unknown>;

function sqliteJson<T>(sqlitePath: string, sql: string): T[] {
  const json = execFileSync('sqlite3', ['-json', sqlitePath, sql], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
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
  if (ext === '.gif') return 'image/gif';
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

function assertTitleTable(name: string): string {
  if (!/^tblTitleService[A-Za-z]*$/.test(name)) {
    throw new Error(`Tên bảng SQLite không hợp lệ: ${name}`);
  }
  return name;
}

function selectAll(sqlitePath: string, table: string): Row[] {
  const safe = assertTitleTable(table);
  return sqliteJson<Row>(sqlitePath, `SELECT * FROM ${safe} ORDER BY ID`);
}

function rowOldId(row: Row): number | null {
  return asNumber(col(row, 'ID'));
}

function groupByService(rows: Row[]): Map<number, Row[]> {
  const map = new Map<number, Row[]>();
  for (const row of rows) {
    const sid = asNumber(col(row, 'TitleServiceId'));
    if (sid == null) continue;
    const list = map.get(sid) ?? [];
    list.push(row);
    map.set(sid, list);
  }
  return map;
}

async function putPrivate(
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

  const dossiers = selectAll(sqlitePath, 'tblTitleService');
  const progress = selectAll(sqlitePath, 'tblTitleServiceProgress');
  const money = selectAll(sqlitePath, 'tblTitleServiceMoney');
  const attachments = selectAll(sqlitePath, 'tblTitleServiceAttachment');
  console.log(
    `Nguồn: ${dossiers.length} hồ sơ, ${progress.length} tiến độ, ${money.length} tiền, ${attachments.length} file.`,
  );

  const prisma = new PrismaClient();
  await ensureMigrateSchema(prisma);

  const userMap = await loadMap(prisma, USER_ENTITY);
  const customerMap = await loadMap(prisma, CUSTOMER_ENTITY);
  const titleMap = await loadMap(prisma, TITLE_ENTITY);
  console.log(
    `Map sẵn: user=${userMap.size} customer=${customerMap.size} title_service=${titleMap.size}`,
  );
  if (userMap.size === 0) {
    throw new Error('Chưa có map user — chạy pnpm users:migrate-legacy trước.');
  }
  if (customerMap.size === 0) {
    throw new Error('Chưa có map customer — chạy pnpm customers:migrate-legacy trước.');
  }

  const personIds = [...new Set(dossiers.map((r) => asNumber(col(r, 'PersonId'))).filter(Boolean))];
  const empIds = [
    ...new Set(dossiers.map((r) => asNumber(col(r, 'CreatedByEmployeeId'))).filter(Boolean)),
  ];
  const missingPerson = personIds.filter((id) => !customerMap.has(String(id)));
  const missingEmp = empIds.filter((id) => !userMap.has(String(id)));
  console.log(
    `Preflight FK: PersonId ${personIds.length - missingPerson.length}/${personIds.length}, EmployeeId ${empIds.length - missingEmp.length}/${empIds.length}.`,
  );
  if (missingPerson.length) console.warn(`  Thiếu map customer: ${missingPerson.join(', ')}`);
  if (missingEmp.length) console.warn(`  Thiếu map user: ${missingEmp.join(', ')}`);

  const skipFiles = process.env.SKIP_TITLE_FILES === '1';
  const imgRoot = process.env.LEGACY_IMG_ROOT ?? DEFAULT_IMG_ROOT;
  const env = { ...loadDotEnv(path.join(process.cwd(), '.env')), ...process.env };
  const s3Ready = Boolean(
    env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_PRIVATE_BUCKET,
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
  const privateBucket = env.R2_PRIVATE_BUCKET ?? '';

  const progressBy = groupByService(progress);
  const moneyBy = groupByService(money);
  const attachBy = groupByService(attachments);

  let copied = 0;
  let skipped = 0;

  for (const row of dossiers) {
    const oldId = rowOldId(row);
    if (oldId == null) {
      skipped += 1;
      continue;
    }
    const personOld = asNumber(col(row, 'PersonId'));
    const createdByOld = asNumber(col(row, 'CreatedByEmployeeId'));
    const customerId = personOld != null ? customerMap.get(String(personOld)) : undefined;
    const createdByEmployeeId =
      createdByOld != null ? userMap.get(String(createdByOld)) : undefined;
    if (!customerId || !createdByEmployeeId) {
      console.warn(
        `  Bỏ hồ sơ ${oldId}: person=${personOld}→${!!customerId} user=${createdByOld}→${!!createdByEmployeeId}`,
      );
      skipped += 1;
      continue;
    }

    const creator = await prisma.user.findUnique({
      where: { id: createdByEmployeeId },
      select: { username: true },
    });
    if (!creator) {
      console.warn(`  Bỏ hồ sơ ${oldId}: user ${createdByEmployeeId} không còn.`);
      skipped += 1;
      continue;
    }
    if (createdByOld === 5 && creator.username !== 'kha') {
      console.warn(
        `  Bỏ hồ sơ ${oldId}: EmployeeId 5 phải là kha, đang là ${creator.username}.`,
      );
      skipped += 1;
      continue;
    }
    if (createdByOld === 3 && creator.username !== 'buinam') {
      console.warn(
        `  Bỏ hồ sơ ${oldId}: EmployeeId 3 phải là buinam, đang là ${creator.username}.`,
      );
      skipped += 1;
      continue;
    }
    if (creator.username === 'admin' && createdByOld !== 1) {
      console.warn(`  Bỏ hồ sơ ${oldId}: không gán NV ${createdByOld} vào admin.`);
      skipped += 1;
      continue;
    }

    const code = asString(col(row, 'Code')) || `SD-LEGACY-${oldId}`;
    const statusRaw = (asString(col(row, 'Status')) || 'DANG_LAM').toUpperCase();
    const status = STATUSES.has(statusRaw) ? statusRaw : 'DANG_LAM';
    let completedAt = toDateOrNull(col(row, 'CompletedAtMs'));
    if ((status === 'HOAN_THANH' || status === 'HUY') && !completedAt) {
      completedAt = toDate(col(row, 'UpdatedAtMs', 'StartedAtMs'));
    }
    const isPinned = asNumber(col(row, 'IsPinned')) === 1;
    const data = {
      code,
      customerId,
      status,
      agreedFeeVnd: toBigInt(col(row, 'AgreedFeeVnd')),
      needSummary: asString(col(row, 'NeedSummary')),
      note: asString(col(row, 'Note')),
      startedAt: toDate(col(row, 'StartedAtMs')),
      expectedDoneAt: toDateOrNull(col(row, 'ExpectedDoneAtMs')),
      completedAt,
      createdByEmployeeId,
      isPinned,
      pinnedAt: isPinned ? toDateOrNull(col(row, 'PinnedAtMs')) : null,
      createdAt: toDate(col(row, 'CreatedAtMs')),
      updatedAt: toDate(col(row, 'UpdatedAtMs', 'CreatedAtMs')),
    };

    const mappedId = titleMap.get(String(oldId));
    const existing = mappedId
      ? await prisma.titleService.findUnique({ where: { id: mappedId } })
      : await prisma.titleService.findUnique({ where: { code } });

    if (existing) {
      await prisma.titleServiceProgress.deleteMany({ where: { titleServiceId: existing.id } });
      await prisma.titleServiceMoney.deleteMany({ where: { titleServiceId: existing.id } });
      await prisma.titleServiceAttachment.deleteMany({ where: { titleServiceId: existing.id } });
      await prisma.titleService.update({ where: { id: existing.id }, data });
      await upsertMap(prisma, TITLE_ENTITY, oldId, existing.id);
      titleMap.set(String(oldId), existing.id);
    } else {
      const created = await prisma.titleService.create({ data });
      await upsertMap(prisma, TITLE_ENTITY, oldId, created.id);
      titleMap.set(String(oldId), created.id);
    }
    const titleId = titleMap.get(String(oldId))!;

    for (const p of progressBy.get(oldId) ?? []) {
      const stepRaw = (asString(col(p, 'StepType')) || 'KHAC').toUpperCase();
      const stepType = STEPS.has(stepRaw) ? stepRaw : 'KHAC';
      const noteExtra = !STEPS.has(stepRaw) ? stepRaw : null;
      const note = asString(col(p, 'Note')) || noteExtra;
      const empOld = asNumber(col(p, 'CreatedByEmployeeId'));
      const empId = (empOld != null ? userMap.get(String(empOld)) : undefined) ?? createdByEmployeeId;
      const saved = await prisma.titleServiceProgress.create({
        data: {
          titleServiceId: titleId,
          stepType,
          note,
          happenedAt: toDate(col(p, 'HappenedAtMs')),
          createdByEmployeeId: empId,
          createdAt: toDate(col(p, 'CreatedAtMs', 'HappenedAtMs')),
        },
      });
      const pOld = rowOldId(p);
      if (pOld != null) await upsertMap(prisma, PROGRESS_ENTITY, pOld, saved.id);
    }

    for (const m of moneyBy.get(oldId) ?? []) {
      const kindRaw = (asString(col(m, 'Kind')) || '').toUpperCase();
      if (!MONEY_KINDS.has(kindRaw)) {
        console.warn(`  Bỏ tiền hồ sơ ${oldId}: kind=${kindRaw}`);
        continue;
      }
      const amount = toBigInt(col(m, 'AmountVnd'));
      if (amount == null || amount <= 0n) {
        console.warn(`  Bỏ tiền hồ sơ ${oldId}: amount không hợp lệ`);
        continue;
      }
      const title = asString(col(m, 'Title')) || (kindRaw === 'THU' ? 'Thu tiền dịch vụ' : 'Chi phí');
      const empOld = asNumber(col(m, 'CreatedByEmployeeId'));
      const empId = (empOld != null ? userMap.get(String(empOld)) : undefined) ?? createdByEmployeeId;
      const saved = await prisma.titleServiceMoney.create({
        data: {
          titleServiceId: titleId,
          kind: kindRaw,
          title,
          amountVnd: amount,
          note: asString(col(m, 'Note')),
          happenedAt: toDate(col(m, 'HappenedAtMs')),
          createdByEmployeeId: empId,
          createdAt: toDate(col(m, 'CreatedAtMs', 'HappenedAtMs')),
        },
      });
      const mOld = rowOldId(m);
      if (mOld != null) await upsertMap(prisma, MONEY_ENTITY, mOld, saved.id);
    }

    if (!skipFiles) {
      for (const att of attachBy.get(oldId) ?? []) {
        const stored = asString(col(att, 'StoredPath')) || '';
        const file = stored ? resolveLegacyFile(stored, imgRoot) : null;
        if (!file) {
          if (stored) console.warn(`  File hồ sơ ${oldId}: không thấy ${stored}`);
          continue;
        }
        if (!s3 || !privateBucket) {
          console.warn(`  Bỏ file hồ sơ ${oldId}: thiếu R2_PRIVATE_BUCKET`);
          continue;
        }
        const kindRaw = (asString(col(att, 'Kind')) || 'KHAC').toUpperCase();
        const kind = DOC_KINDS.has(kindRaw) ? kindRaw : 'KHAC';
        const objectKey = `title-services/${titleId}/${file.fileName}`;
        await putPrivate(s3, privateBucket, objectKey, file.abs, file.fileName);
        const empOld = asNumber(col(att, 'CreatedByEmployeeId'));
        const empId =
          (empOld != null ? userMap.get(String(empOld)) : undefined) ?? createdByEmployeeId;
        const saved = await prisma.titleServiceAttachment.create({
          data: {
            titleServiceId: titleId,
            kind,
            fileName: asString(col(att, 'FileName')) || file.fileName,
            objectKey,
            createdByEmployeeId: empId,
            createdAt: toDate(col(att, 'CreatedAtMs')),
          },
        });
        const aOld = rowOldId(att);
        if (aOld != null) await upsertMap(prisma, ATTACH_ENTITY, aOld, saved.id);
      }
    }

    copied += 1;
    console.log(`  ${code} createdBy=${creator.username} customer=${personOld}`);
  }

  const dest = await prisma.titleService.count();
  const mapped = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c FROM migrate.legacy_id_map WHERE entity = ${TITLE_ENTITY}
  `;
  const progN = await prisma.titleServiceProgress.count();
  const moneyN = await prisma.titleServiceMoney.count();
  const fileN = await prisma.titleServiceAttachment.count();
  console.log(`Đã copy ${copied}/${dossiers.length} hồ sơ (bỏ ${skipped}).`);
  console.log(
    `Đích TitleService=${dest}, map title_service=${mapped[0]?.c ?? 0n}, tiến độ=${progN}, tiền=${moneyN}, file=${fileN}.`,
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
