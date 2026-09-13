import { toListingPublicSlug, toPublicPostSlug } from './public-content.js';

export const SEO_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

/** Public CDN photos are encoded WebP (sharp) before R2. */
export const PUBLIC_SEO_IMAGE_EXT = '.webp';
export const PUBLIC_SEO_IMAGE_MIME = 'image/webp';

/**
 * Sibling of a gallery WebP from early OG experiments (`.og.png` / `.og.jpg`).
 * Production `og:image` is the gallery cover WebP via same-origin `/og-media/…?og=N`.
 * Do not generate new OG siblings.
 */
export const PUBLIC_OG_IMAGE_EXT = '.og.png';
export const PUBLIC_OG_IMAGE_MIME = 'image/png';

/** Legacy JPEG sibling from early Zalo attempts — no longer written on upload. */
export const PUBLIC_OG_LEGACY_JPEG_EXT = '.og.jpg';

/** Public R2 CDN (gallery WebP + OG siblings). */
export const PUBLIC_CDN_ORIGIN = 'https://cdn.anhungland.com';

/**
 * Same-origin path prefix that Next proxies to {@link PUBLIC_CDN_ORIGIN}.
 * Zalo scrapes title/description but fails on `cdn.*` images; WebP via `/og-media` works.
 * Do not put cache-bust query on the *page* share URL (`?v=`) — version the image URL instead.
 */
export const PUBLIC_OG_MEDIA_PATH_PREFIX = '/og-media';

/**
 * Bump when the OG serving contract changes (e.g. CDN → same-origin).
 * Applied to `og:image` (`/og-media/…?og=N`) and CRM share page URLs
 * (`?share=CODE&og=N`) so Zalo re-scrapes without random `?v=` hacks.
 */
export const PUBLIC_OG_MEDIA_GENERATION = '1';

const EXT_FROM_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function normalizeExt(raw: string): string {
  const ext = raw.startsWith('.') ? raw.toLowerCase() : `.${raw.toLowerCase()}`;
  if (ext === '.jpeg') return '.jpg';
  if ((SEO_IMAGE_EXTS as readonly string[]).includes(ext)) return ext;
  return '.jpg';
}

/** File extension from upload name / MIME. Always a safe image suffix. */
export function seoImageExt(originalName?: string | null, mime?: string | null): string {
  const fromName = originalName?.trim().match(/(\.[a-zA-Z0-9]{1,8})$/)?.[1];
  if (fromName) return normalizeExt(fromName);
  const fromMime = mime ? EXT_FROM_MIME[mime.toLowerCase()] : undefined;
  return fromMime ?? '.jpg';
}

export function isWebpObjectKey(objectKey: string): boolean {
  const base = objectKey.replace(/^\/+/, '').split('?')[0] ?? '';
  return base.toLowerCase().endsWith(PUBLIC_SEO_IMAGE_EXT);
}

export function isPublicOgImageObjectKey(objectKey: string): boolean {
  const base = objectKey.replace(/^\/+/, '').split('?')[0] ?? '';
  return base.toLowerCase().endsWith(PUBLIC_OG_IMAGE_EXT);
}

/** @deprecated alias — OG sibling is PNG now */
export const isPublicOgJpegObjectKey = isPublicOgImageObjectKey;


/** Swap a path/filename image suffix for the public WebP key. */
export function withPublicWebpExt(pathOrName: string): string {
  const cleaned = pathOrName.replace(/\\/g, '/');
  const slash = cleaned.lastIndexOf('/');
  const dot = cleaned.lastIndexOf('.');
  const stem = dot > slash ? cleaned.slice(0, dot) : cleaned;
  return `${stem}${PUBLIC_SEO_IMAGE_EXT}`;
}

/** WebP gallery key → sibling OG PNG key (`….webp` → `….og.png`). */
export function publicOgImageObjectKeyFromWebp(webpObjectKey: string): string | null {
  const key = normalizeObjectKey(webpObjectKey);
  if (!isWebpObjectKey(key) || isPublicOgImageObjectKey(key)) return null;
  return `${key.slice(0, -PUBLIC_SEO_IMAGE_EXT.length)}${PUBLIC_OG_IMAGE_EXT}`;
}

/** @deprecated alias — OG sibling is PNG now */
export const publicOgJpegObjectKeyFromWebp = publicOgImageObjectKeyFromWebp;

/**
 * Cover CDN URL (WebP) → OG PNG URL for social preview.
 * Non-WebP covers (brand PNG default, legacy JPEG) are left unchanged → returns null.
 */
export function publicOgImageUrlFromCoverUrl(coverUrl: string): string | null {
  const trimmed = coverUrl.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const path = url.pathname;
    if (!path.toLowerCase().endsWith(PUBLIC_SEO_IMAGE_EXT)) return null;
    if (path.toLowerCase().endsWith(PUBLIC_OG_IMAGE_EXT)) return null;
    url.pathname = `${path.slice(0, -PUBLIC_SEO_IMAGE_EXT.length)}${PUBLIC_OG_IMAGE_EXT}`;
    return url.toString();
  } catch {
    const [pathPart, query] = trimmed.split('?');
    const path = pathPart ?? '';
    if (!path.toLowerCase().endsWith(PUBLIC_SEO_IMAGE_EXT)) return null;
    const next = `${path.slice(0, -PUBLIC_SEO_IMAGE_EXT.length)}${PUBLIC_OG_IMAGE_EXT}`;
    return query ? `${next}?${query}` : next;
  }
}

/** @deprecated alias — OG sibling is PNG now (prefer `publicOgImageUrlFromCoverUrl`) */
export const publicOgJpegUrlFromCoverUrl = publicOgImageUrlFromCoverUrl;

/**
 * Absolute CDN URL → same-origin `/og-media/…?og=N` path for Zalo/FB `og:image`.
 * Non-CDN URLs (brand `/og-default.png`, already-proxied paths) → null.
 * Gallery stays on CDN; only social preview uses this proxy (WebP OK).
 */
export function publicCdnUrlToSameOriginOgPath(cdnUrl: string): string | null {
  const trimmed = cdnUrl.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') return null;
    if (url.hostname.toLowerCase() !== new URL(PUBLIC_CDN_ORIGIN).hostname) return null;
    const path = url.pathname;
    if (!path || path === '/' || path.includes('..')) return null;
    return `${PUBLIC_OG_MEDIA_PATH_PREFIX}${path}?og=${PUBLIC_OG_MEDIA_GENERATION}`;
  } catch {
    return null;
  }
}

/**
 * Cover WebP → legacy `….og.jpg` (JPEG backfill still on CDN for non-pilot lots).
 */
export function publicOgLegacyJpegUrlFromCoverUrl(coverUrl: string): string | null {
  const trimmed = coverUrl.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const path = url.pathname;
    if (!path.toLowerCase().endsWith(PUBLIC_SEO_IMAGE_EXT)) return null;
    if (path.toLowerCase().endsWith(PUBLIC_OG_IMAGE_EXT)) return null;
    if (path.toLowerCase().endsWith(PUBLIC_OG_LEGACY_JPEG_EXT)) return null;
    url.pathname = `${path.slice(0, -PUBLIC_SEO_IMAGE_EXT.length)}${PUBLIC_OG_LEGACY_JPEG_EXT}`;
    return url.toString();
  } catch {
    const [pathPart, query] = trimmed.split('?');
    const path = pathPart ?? '';
    if (!path.toLowerCase().endsWith(PUBLIC_SEO_IMAGE_EXT)) return null;
    const next = `${path.slice(0, -PUBLIC_SEO_IMAGE_EXT.length)}${PUBLIC_OG_LEGACY_JPEG_EXT}`;
    return query ? `${next}?${query}` : next;
  }
}

/**
 * Descriptive CDN filename: `{title+location}-anh-{n}.webp`
 * Uses the same slug rules as the public listing URL — no keyword stuffing.
 */
export function seoImageFileName(input: {
  title: string;
  location?: string | null;
  index: number;
  ext: string;
  suffix?: string;
}): string {
  const stem = toListingPublicSlug(input.title, input.location);
  const ext = normalizeExt(input.ext);
  const n = Number.isFinite(input.index) ? Math.max(1, Math.floor(input.index)) : 1;
  const extra = input.suffix?.replace(/[^a-z0-9]/gi, '').slice(0, 8);
  const tail = extra ? `-${extra.toLowerCase()}` : '';
  return `${stem}-anh-${n}${tail}${ext}`;
}

function safeIdSegment(id: string, fallback: string): string {
  const clean = id.replace(/[^a-zA-Z0-9_-]/g, '');
  return clean || fallback;
}

export function seoLotImageObjectKey(lodatId: string, fileName: string): string {
  return `lodats/${safeIdSegment(lodatId, 'lo')}/${fileName}`;
}

export function seoAddressImageObjectKey(addressId: string, fileName: string): string {
  return `addresses/${safeIdSegment(addressId, 'dia-chi')}/${fileName}`;
}

/** Same stem as the public listing slug: `{title+location}`. */
export function seoImageSlugStem(title: string, location?: string | null): string {
  return toListingPublicSlug(title, location);
}

export function canonicalSeoLotImageObjectKey(input: {
  lodatId: string;
  title: string;
  location?: string | null;
  index: number;
  suffix?: string;
}): string {
  return seoLotImageObjectKey(
    input.lodatId,
    seoImageFileName({
      title: input.title,
      location: input.location,
      index: input.index,
      ext: PUBLIC_SEO_IMAGE_EXT,
      suffix: input.suffix,
    }),
  );
}

export function canonicalSeoAddressImageObjectKey(input: {
  addressId: string;
  title: string;
  location?: string | null;
  index: number;
  suffix?: string;
}): string {
  return seoAddressImageObjectKey(
    input.addressId,
    seoImageFileName({
      title: input.title,
      location: input.location,
      index: input.index,
      ext: PUBLIC_SEO_IMAGE_EXT,
      suffix: input.suffix,
    }),
  );
}

function normalizeObjectKey(objectKey: string): string {
  return objectKey.replace(/^\/+/, '').split('?')[0] ?? '';
}

/** True when the CDN key is not yet the desired `{slug}-anh-n.webp`. */
export function seoImageObjectKeyNeedsRetarget(
  currentObjectKey: string,
  desiredObjectKey: string,
): boolean {
  return normalizeObjectKey(currentObjectKey) !== normalizeObjectKey(desiredObjectKey);
}

/** True when the file is already `{stem}-anh-n.webp` for this title+location (any index / suffix). */
export function objectKeyMatchesSeoStem(objectKey: string, stem: string): boolean {
  const base = normalizeObjectKey(objectKey).split('/').pop() ?? '';
  return (
    Boolean(stem) &&
    base.startsWith(`${stem}-anh-`) &&
    isSeoNamedImageKey(objectKey) &&
    isWebpObjectKey(objectKey)
  );
}

/**
 * CMS post cover / TipTap photos: `{post-slug}-anh-{n}.webp` under `public-web/`.
 */
export function seoPostImageFileName(input: {
  title: string;
  index: number;
  suffix?: string;
}): string {
  const stem = toPublicPostSlug(input.title);
  const n = Number.isFinite(input.index) ? Math.max(1, Math.floor(input.index)) : 1;
  const extra = input.suffix?.replace(/[^a-z0-9]/gi, '').slice(0, 8);
  const tail = extra ? `-${extra.toLowerCase()}` : '';
  return `${stem}-anh-${n}${tail}${PUBLIC_SEO_IMAGE_EXT}`;
}

export function seoPostImageObjectKey(fileName: string): string {
  const base = fileName.replace(/^\/+/, '').split('/').pop() ?? fileName;
  return `public-web/${base}`;
}

const SEO_FILE_RE = /^.+-anh-\d+(-[a-z0-9]{1,8})?\.(jpg|jpeg|png|webp|gif)$/i;

/** True when the CDN basename already follows `{slug}-anh-{n}.ext`. */
export function isSeoNamedImageKey(objectKey: string): boolean {
  const base = objectKey.replace(/^\/+/, '').split('/').pop() ?? '';
  return SEO_FILE_RE.test(base);
}
