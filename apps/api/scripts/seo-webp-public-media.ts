/**
 * Convert leftover public-web JPEG/PNG (post cover + TipTap body) to WebP.
 *
 * Usage (VPS, apps/api):
 *   pnpm images:webp-public-media
 *   APPLY=1 pnpm images:webp-public-media
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { isWebpObjectKey, withPublicWebpExt } from '@crmanhung/shared';
import { StorageService } from '../src/storage/storage.service';
import { toPublicWebp } from '../src/storage/to-public-webp';

const prisma = new PrismaClient();
const IMG_SRC_RE = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const RASTER_EXT_RE = /\.(jpe?g|png|gif)(\?|$)/i;

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

function extractHtmlImageSrcs(html: string | null | undefined): string[] {
  if (!html?.trim()) return [];
  const out: string[] = [];
  const re = new RegExp(IMG_SRC_RE.source, IMG_SRC_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const src = (match[1] ?? match[2] ?? '').trim();
    if (src) out.push(src);
  }
  return out;
}

function objectKeyFromCdnUrl(url: string, publicBase: string): string | null {
  const trimmed = url.trim().split('?')[0] ?? '';
  if (!trimmed) return null;
  const base = publicBase.replace(/\/$/, '');
  if (trimmed.startsWith(`${base}/`)) return trimmed.slice(base.length + 1);
  try {
    const parsed = new URL(trimmed);
    const pathName = parsed.pathname.replace(/^\/+/, '');
    if (pathName.startsWith('public-web/')) return pathName;
  } catch {
    if (trimmed.startsWith('public-web/')) return trimmed.replace(/^\/+/, '');
  }
  return null;
}

function isConvertiblePublicWebKey(objectKey: string): boolean {
  if (!objectKey.startsWith('public-web/')) return false;
  if (isWebpObjectKey(objectKey)) return false;
  return RASTER_EXT_RE.test(objectKey);
}

function rewrite(text: string, from: string, to: string): string {
  return from && from !== to ? text.split(from).join(to) : text;
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env'));
  const apply = process.env.APPLY === '1';
  const storage = new StorageService(new ConfigService());
  if (!storage.isConfigured()) {
    throw new Error('R2 chưa cấu hình (R2_ENDPOINT / keys / bucket / public URL).');
  }
  const publicBase = (process.env.R2_PUBLIC_BASE_URL ?? 'https://cdn.anhungland.com').replace(
    /\/$/,
    '',
  );

  const [posts, listings] = await Promise.all([
    prisma.publicPost.findMany({
      select: { id: true, coverImageUrl: true, bodyHtml: true, category: true, slug: true },
    }),
    prisma.publicLotListing.findMany({ select: { id: true, bodyHtml: true } }),
  ]);

  const found = new Map<string, true>();
  function addUrl(raw: string | null | undefined) {
    const url = raw?.trim();
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) return;
    const key = objectKeyFromCdnUrl(url, publicBase);
    if (!key || !isConvertiblePublicWebKey(key)) return;
    found.set(key, true);
  }

  for (const post of posts) {
    addUrl(post.coverImageUrl);
    for (const src of extractHtmlImageSrcs(post.bodyHtml)) addUrl(src);
  }
  for (const listing of listings) {
    for (const src of extractHtmlImageSrcs(listing.bodyHtml)) addUrl(src);
  }

  console.log(
    `webp-public-media apply=${apply} posts=${posts.length} listings=${listings.length} keys=${found.size}`,
  );

  let moved = 0;
  for (const fromKey of found.keys()) {
    const toKey = withPublicWebpExt(fromKey);
    console.log(`${apply ? 'MOVE' : 'DRY'} ${fromKey} -> ${toKey}`);
    if (!apply) continue;
    const src = await storage.getPublicObject(fromKey);
    if (!src) {
      console.warn(`skip missing R2 object ${fromKey}`);
      continue;
    }
    const webp = await toPublicWebp(src.buffer);
    await storage.uploadPublicAtKey(toKey, {
      buffer: webp.buffer,
      contentType: webp.contentType,
      contentFileName: path.basename(toKey),
    });
    for (const post of posts) {
      const coverImageUrl = post.coverImageUrl
        ? rewrite(post.coverImageUrl, fromKey, toKey)
        : post.coverImageUrl;
      const bodyHtml = rewrite(post.bodyHtml, fromKey, toKey);
      if (coverImageUrl !== post.coverImageUrl || bodyHtml !== post.bodyHtml) {
        await prisma.publicPost.update({
          where: { id: post.id },
          data: { coverImageUrl, bodyHtml },
        });
        post.coverImageUrl = coverImageUrl;
        post.bodyHtml = bodyHtml;
      }
    }
    for (const listing of listings) {
      const bodyHtml = rewrite(listing.bodyHtml, fromKey, toKey);
      if (bodyHtml !== listing.bodyHtml) {
        await prisma.publicLotListing.update({
          where: { id: listing.id },
          data: { bodyHtml },
        });
        listing.bodyHtml = bodyHtml;
      }
    }
    await storage.delete(fromKey, 'public');
    moved += 1;
  }

  console.log(`done moved=${moved} planned=${found.size} apply=${apply}`);
  if (!apply && found.size > 0) {
    console.log('Chạy APPLY=1 — convert public-web JPEG/PNG sang WebP, cập nhật URL bài.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
