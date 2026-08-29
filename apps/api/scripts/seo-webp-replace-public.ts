/**
 * Convert leftover public JPEG/PNG on R2 to WebP, retarget DB, then delete source.
 * Never deletes the old object unless the new WebP is uploaded, decoded, and DB
 * no longer points at the old key. Skips private bucket (title-service docs).
 *
 * Usage (VPS, apps/api):
 *   pnpm images:webp-replace
 *   APPLY=1 pnpm images:webp-replace
 *   APPLY=1 LIMIT=30 pnpm images:webp-replace
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { isWebpObjectKey, withPublicWebpExt } from '@crmanhung/shared';
import { StorageService } from '../src/storage/storage.service';
import { retargetPublicImageKey } from '../src/storage/retarget-public-key';
import { assertDecodedWebp, toPublicWebp } from '../src/storage/to-public-webp';

const prisma = new PrismaClient();
const RASTER_EXT_RE = /\.(jpe?g|png)$/i;
const SKIP_PREFIXES = ['title-services/'];
const CONCURRENCY = 4;

function loadDotEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    const key = t.slice(0, i);
    const val = t.slice(i + 1).replace(/^['"]|['"]$/g, '');
    if (process.env[key] == null) process.env[key] = val;
  }
}

function folderOf(key: string): string {
  const i = key.indexOf('/');
  return i === -1 ? '(root)' : key.slice(0, i);
}

function rewrite(text: string | null | undefined, from: string, to: string): string | null | undefined {
  if (!text || !from || from === to || !text.includes(from)) return text;
  return text.split(from).join(to);
}

async function rewriteSoftUrls(from: string, to: string): Promise<void> {
  const posts = await prisma.publicPost.findMany({
    where: {
      OR: [{ coverImageUrl: { contains: from } }, { bodyHtml: { contains: from } }],
    },
    select: { id: true, coverImageUrl: true, bodyHtml: true },
  });
  for (const post of posts) {
    const coverImageUrl = rewrite(post.coverImageUrl, from, to);
    const bodyHtml = rewrite(post.bodyHtml, from, to);
    if (coverImageUrl !== post.coverImageUrl || bodyHtml !== post.bodyHtml) {
      await prisma.publicPost.update({
        where: { id: post.id },
        data: { coverImageUrl, bodyHtml: bodyHtml ?? post.bodyHtml },
      });
    }
  }
  const listings = await prisma.publicLotListing.findMany({
    where: { bodyHtml: { contains: from } },
    select: { id: true, bodyHtml: true },
  });
  for (const row of listings) {
    const bodyHtml = rewrite(row.bodyHtml, from, to);
    if (bodyHtml !== row.bodyHtml) {
      await prisma.publicLotListing.update({
        where: { id: row.id },
        data: { bodyHtml: bodyHtml ?? row.bodyHtml },
      });
    }
  }
  const faces = await prisma.customerFacebook.findMany({
    where: { avatarUrl: { contains: from } },
    select: { id: true, avatarUrl: true },
  });
  for (const row of faces) {
    const avatarUrl = rewrite(row.avatarUrl, from, to);
    if (avatarUrl !== row.avatarUrl) {
      await prisma.customerFacebook.update({ where: { id: row.id }, data: { avatarUrl } });
    }
  }
}

async function mapPool<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      await fn(items[index]);
    }
  }
  const n = Math.min(Math.max(1, limit), Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
}

async function ensureWebpObject(
  storage: StorageService,
  fromKey: string,
  toKey: string,
): Promise<void> {
  const existing = await storage.getPublicObject(toKey);
  if (existing) {
    await assertDecodedWebp(existing.buffer);
    return;
  }
  const src = await storage.getPublicObject(fromKey);
  if (!src) throw new Error(`thiếu object nguồn ${fromKey}`);
  const webp = await toPublicWebp(src.buffer);
  await assertDecodedWebp(webp.buffer);
  await storage.uploadPublicAtKey(toKey, {
    buffer: webp.buffer,
    contentType: webp.contentType,
    contentFileName: path.basename(toKey),
  });
  const check = await storage.getPublicObject(toKey);
  if (!check) throw new Error(`không đọc lại được ${toKey}`);
  await assertDecodedWebp(check.buffer);
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env'));
  const apply = process.env.APPLY === '1';
  const limitRaw = Number(process.env.LIMIT ?? '0');
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 0;
  const storage = new StorageService(new ConfigService());
  if (!storage.isConfigured()) {
    throw new Error('R2 chưa cấu hình (R2_ENDPOINT / keys / bucket / public URL).');
  }

  const allKeys = await storage.listPublicObjectKeys();
  const sources = allKeys.filter((key) => {
    if (isWebpObjectKey(key)) return false;
    if (!RASTER_EXT_RE.test(key)) return false;
    if (SKIP_PREFIXES.some((p) => key.startsWith(p))) return false;
    return true;
  });

  const destCount = new Map<string, string[]>();
  for (const from of sources) {
    const to = withPublicWebpExt(from);
    const list = destCount.get(to) ?? [];
    list.push(from);
    destCount.set(to, list);
  }
  const collisions = [...destCount.entries()].filter(([, froms]) => froms.length > 1);
  const skip = new Set(collisions.flatMap(([, froms]) => froms));
  if (collisions.length) {
    console.warn(`SKIP ${skip.size} keys — dest WebP trùng stem:`);
    for (const [to, froms] of collisions) console.warn(`  ${to} <= ${froms.join(', ')}`);
  }

  let planned = sources.filter((k) => !skip.has(k));
  if (limit) planned = planned.slice(0, limit);

  const byFolder = new Map<string, number>();
  for (const key of planned) {
    const folder = folderOf(key);
    byFolder.set(folder, (byFolder.get(folder) ?? 0) + 1);
  }
  console.log(
    `webp-replace apply=${apply} planned=${planned.length} skippedCollision=${skip.size} r2=${allKeys.length}`,
  );
  for (const [folder, n] of [...byFolder.entries()].sort()) {
    console.log(`  ${folder}/\t${n}`);
  }

  const stats = { converted: 0, deleted: 0, failed: 0, skipped: 0 };
  const failures: string[] = [];

  await mapPool(planned, apply ? CONCURRENCY : 1, async (fromKey) => {
    const toKey = withPublicWebpExt(fromKey);
    if (fromKey === toKey) {
      stats.skipped += 1;
      return;
    }
    if (!apply) {
      return;
    }
    try {
      await ensureWebpObject(storage, fromKey, toKey);
      const leftover = await retargetPublicImageKey(prisma, fromKey, toKey);
      await rewriteSoftUrls(fromKey, toKey);
      if (leftover > 0) {
        throw new Error(`DB còn ${leftover} ref tới ${fromKey} — không xóa nguồn`);
      }
      await storage.delete(fromKey, 'public');
      stats.converted += 1;
      stats.deleted += 1;
      console.log(`MOVE ${fromKey} -> ${toKey}`);
    } catch (err) {
      stats.failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${fromKey}: ${msg}`);
      console.warn(`KEEP ${fromKey} (${msg})`);
    }
  });

  console.log(
    `done converted=${stats.converted} deleted=${stats.deleted} failed=${stats.failed} skipped=${stats.skipped} apply=${apply}`,
  );
  if (failures.length) {
    console.warn(`failures ${failures.length}:`);
    for (const line of failures.slice(0, 30)) console.warn(`  ${line}`);
  }
  if (!apply && planned.length > 0) {
    console.log('Chạy APPLY=1 — ghi WebP, cập nhật DB, rồi mới xóa JPEG/PNG.');
  }
  if (stats.failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
