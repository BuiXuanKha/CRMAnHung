import { PUBLIC_OG_DEFAULT, toAbsoluteUrl } from './site';

const IMG_SRC_RE = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

export function isBrandOgFallback(url: string): boolean {
  return url.endsWith(PUBLIC_OG_DEFAULT) || url.includes(`${PUBLIC_OG_DEFAULT}?`);
}

/** Unique absolute http(s) image URLs. Skips empty, data URIs, and brand OG fallback. */
export function uniqueAbsolutePublicImageUrls(
  urls: Array<string | null | undefined>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const trimmed = raw?.trim();
    if (!trimmed || trimmed.toLowerCase().startsWith('data:')) continue;
    const abs = toAbsoluteUrl(trimmed);
    if (isBrandOgFallback(abs) || seen.has(abs)) continue;
    seen.add(abs);
    out.push(abs);
  }
  return out;
}

export function extractHtmlImageSrcs(html: string | undefined): string[] {
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

/** Gallery (preferred) + cover. Used in sitemap `images` and JSON-LD ImageObject. */
export function listingSeoImageUrls(listing: {
  coverImageUrl?: string | null;
  imageUrls?: string[] | null;
}): string[] {
  const gallery = listing.imageUrls?.filter((u) => u?.trim()) ?? [];
  const raw = gallery.length > 0 ? gallery : [listing.coverImageUrl];
  return uniqueAbsolutePublicImageUrls(raw);
}

export function listingCoverAbsoluteUrl(listing: {
  coverImageUrl?: string | null;
}): string | null {
  return listingSeoImageUrls({ coverImageUrl: listing.coverImageUrl })[0] ?? null;
}

/** Project-address CDN keys: `addresses/{addressId}/…` (not lot or chat). */
export function isPublicAddressImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const raw = url.trim();
  try {
    const path = raw.includes('://') ? new URL(raw).pathname : raw;
    return /(^|\/)addresses\//.test(path);
  } catch {
    return raw.includes('/addresses/');
  }
}

export function postSeoImageUrls(post: {
  coverImageUrl?: string | null;
  bodyHtml?: string | null;
}): string[] {
  return uniqueAbsolutePublicImageUrls([
    post.coverImageUrl,
    ...extractHtmlImageSrcs(post.bodyHtml ?? undefined),
  ]);
}

/** Alt / ImageObject caption: tên lô + địa chỉ, đánh số khi nhiều ảnh. */
export function listingImageAlt(
  listing: { title: string; location?: string | null },
  index: number,
  total: number,
  headline: string,
): string {
  const base = headline.trim() || listing.title.trim();
  if (total <= 1) return base;
  return `${base} — ảnh ${index + 1}`;
}
