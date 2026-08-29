import { toListingPublicSlug } from './public-content.js';

export const SEO_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

/** Public CDN photos are encoded WebP (sharp) before R2. */
export const PUBLIC_SEO_IMAGE_EXT = '.webp';
export const PUBLIC_SEO_IMAGE_MIME = 'image/webp';

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

/** Swap a path/filename image suffix for the public WebP key. */
export function withPublicWebpExt(pathOrName: string): string {
  const cleaned = pathOrName.replace(/\\/g, '/');
  const slash = cleaned.lastIndexOf('/');
  const dot = cleaned.lastIndexOf('.');
  const stem = dot > slash ? cleaned.slice(0, dot) : cleaned;
  return `${stem}${PUBLIC_SEO_IMAGE_EXT}`;
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

const SEO_FILE_RE = /^.+-anh-\d+(-[a-z0-9]{1,8})?\.(jpg|jpeg|png|webp|gif)$/i;

/** True when the CDN basename already follows `{slug}-anh-{n}.ext`. */
export function isSeoNamedImageKey(objectKey: string): boolean {
  const base = objectKey.replace(/^\/+/, '').split('/').pop() ?? '';
  return SEO_FILE_RE.test(base);
}
