export const PUBLIC_SITE_ORIGIN = 'https://anhungland.com';
export const PUBLIC_OG_DEFAULT = '/og-default.png';

export function listingCanonicalUrl(slug: string): string {
  return `${PUBLIC_SITE_ORIGIN}/san-pham/${slug}`;
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${PUBLIC_SITE_ORIGIN}${path}`;
}
