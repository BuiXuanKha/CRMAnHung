export const PUBLIC_SITE_ORIGIN = 'https://anhungland.com';
export const PUBLIC_OG_DEFAULT = '/og-default.png';

/** Guest catalog — keyword-friendly; old `/san-pham` 301s here. */
export const PUBLIC_LISTING_PATH = '/mua-ban-nha-dat';

export function listingHref(slug?: string): string {
  return slug ? `${PUBLIC_LISTING_PATH}/${slug}` : PUBLIC_LISTING_PATH;
}

export function listingCanonicalUrl(slug: string): string {
  return `${PUBLIC_SITE_ORIGIN}${listingHref(slug)}`;
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${PUBLIC_SITE_ORIGIN}${path}`;
}
