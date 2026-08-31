import { randomUUID } from 'node:crypto';
import {
  isSeoNamedImageKey,
  isWebpObjectKey,
  seoPostImageFileName,
  seoPostImageObjectKey,
} from './public-slug';
import { toPublicWebp } from '../../storage/to-public-webp';
import type { StorageService } from '../../storage/storage.service';

const IMG_SRC_RE = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const UUID_PUBLIC_WEBP_RE =
  /^public-web\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i;

export async function uniqueSeoPostImageKey(
  storage: StorageService,
  input: { title: string; index: number },
): Promise<{ objectKey: string; fileName: string }> {
  let suffix: string | undefined;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const fileName = seoPostImageFileName({
      title: input.title,
      index: input.index,
      suffix,
    });
    const objectKey = seoPostImageObjectKey(fileName);
    const taken = await storage.publicObjectExists(objectKey);
    if (!taken) return { objectKey, fileName };
    suffix = randomUUID().replace(/-/g, '').slice(0, 6);
  }
  const fileName = seoPostImageFileName({
    title: input.title,
    index: input.index,
    suffix: randomUUID().replace(/-/g, '').slice(0, 8),
  });
  return { objectKey: seoPostImageObjectKey(fileName), fileName };
}

function extractHtmlImageSrcs(html: string): string[] {
  if (!html.trim()) return [];
  const out: string[] = [];
  const re = new RegExp(IMG_SRC_RE.source, IMG_SRC_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const src = (match[1] ?? match[2] ?? '').trim();
    if (src) out.push(src);
  }
  return out;
}

function objectKeyFromCdnUrl(url: string): string | null {
  const trimmed = url.trim().split('?')[0] ?? '';
  if (!trimmed) return null;
  const marker = '/public-web/';
  const at = trimmed.indexOf(marker);
  if (at >= 0) return trimmed.slice(at + 1);
  if (trimmed.startsWith('public-web/')) return trimmed.replace(/^\/+/, '');
  return null;
}

function collectPostMediaUrls(coverUrl: string | null, html: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [coverUrl?.trim() || '', ...extractHtmlImageSrcs(html)]) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function alreadySeoPostKey(objectKey: string): boolean {
  return (
    objectKey.startsWith('public-web/') &&
    isSeoNamedImageKey(objectKey) &&
    isWebpObjectKey(objectKey)
  );
}

/**
 * Copy leftover UUID / generic `public-web/` keys to `{slug}-anh-n.webp`
 * and rewrite cover + TipTap HTML. Leaves already-SEO names in place.
 */
export async function rewritePostSeoImages(
  storage: StorageService,
  input: { title: string; coverImageUrl: string | null; bodyHtml: string },
): Promise<{ coverImageUrl: string | null; bodyHtml: string }> {
  if (!storage.isConfigured()) {
    return { coverImageUrl: input.coverImageUrl, bodyHtml: input.bodyHtml };
  }
  const title = input.title.trim();
  if (!title) {
    return { coverImageUrl: input.coverImageUrl, bodyHtml: input.bodyHtml };
  }

  let coverImageUrl = input.coverImageUrl;
  let bodyHtml = input.bodyHtml;
  let index = 1;

  for (const url of collectPostMediaUrls(coverImageUrl, bodyHtml)) {
    const fromKey = objectKeyFromCdnUrl(url);
    if (!fromKey?.startsWith('public-web/')) continue;
    if (alreadySeoPostKey(fromKey)) {
      index += 1;
      continue;
    }
    const { objectKey, fileName } = await uniqueSeoPostImageKey(storage, {
      title,
      index,
    });
    index += 1;
    if (objectKey === fromKey) continue;
    const destExists = await storage.publicObjectExists(objectKey);
    if (!destExists) {
      const src = await storage.getPublicObject(fromKey);
      if (!src) continue;
      const webp = await toPublicWebp(src.buffer);
      await storage.uploadPublicAtKey(objectKey, {
        buffer: webp.buffer,
        contentType: webp.contentType,
        contentFileName: fileName,
      });
    }
    const nextUrl = storage.publicUrl(objectKey);
    if (coverImageUrl === url) coverImageUrl = nextUrl;
    bodyHtml = bodyHtml.split(url).join(nextUrl);
    if (UUID_PUBLIC_WEBP_RE.test(fromKey) && fromKey !== objectKey) {
      await storage.delete(fromKey, 'public').catch(() => undefined);
    }
  }

  return { coverImageUrl, bodyHtml };
}
