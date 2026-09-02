import {
  PUBLIC_LISTING_PATH,
  listingCommuneHubPath,
  listingPlaceHubPath,
} from '@crmanhung/shared';

export const PUBLIC_SITE_ORIGIN = 'https://anhungland.com';
export const PUBLIC_OG_DEFAULT = '/og-default.png';

export {
  PUBLIC_LISTING_PATH,
  listingCommuneHubPath,
  listingPlaceHubPath,
};

export function listingHref(slug?: string, shareCode?: string | null): string {
  const path = slug ? `${PUBLIC_LISTING_PATH}/${slug}` : PUBLIC_LISTING_PATH;
  const code = shareCode?.trim();
  if (!code) return path;
  const qs = new URLSearchParams({ share: code });
  return `${path}?${qs.toString()}`;
}

export function listingCanonicalUrl(slug: string): string {
  return `${PUBLIC_SITE_ORIGIN}${listingHref(slug)}`;
}

export function listingCommuneHubUrl(communeSlug: string): string {
  return `${PUBLIC_SITE_ORIGIN}${listingCommuneHubPath(communeSlug)}`;
}

export function listingPlaceHubUrl(communeSlug: string, placeSlug: string): string {
  return `${PUBLIC_SITE_ORIGIN}${listingPlaceHubPath(communeSlug, placeSlug)}`;
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${PUBLIC_SITE_ORIGIN}${path}`;
}
