import {
  PUBLIC_LISTING_PATH,
  PUBLIC_LISTING_PATH_LEGACY,
  listingCommuneHubPath,
  listingPlaceHubPath,
} from '@crmanhung/shared';

export const PUBLIC_SITE_ORIGIN = 'https://anhungland.com';
export const PUBLIC_OG_DEFAULT = '/og-default.png';

export {
  PUBLIC_LISTING_PATH,
  PUBLIC_LISTING_PATH_LEGACY,
  listingCommuneHubPath,
  listingPlaceHubPath,
};

export function listingHref(slug?: string): string {
  return slug ? `${PUBLIC_LISTING_PATH}/${slug}` : PUBLIC_LISTING_PATH;
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
