import type { Metadata } from 'next';
import {
  listingSearchDescription,
  type PublicListingHub,
  type PublicListingHubDetail,
} from '@crmanhung/shared';
import { ANHUNG_BRAND } from './brand';
import { communeHubDescription, communeHubHeadline, placeHubDescription, placeHubHeadline } from './listing-hubs';
import { listingHeadline, SAN_PHAM_LIST_PATH, SAN_PHAM_LIST_TITLE } from './listing-seo';
import {
  listingCanonicalUrl,
  listingCommuneHubUrl,
  listingPlaceHubUrl,
  PUBLIC_OG_DEFAULT,
  PUBLIC_SITE_ORIGIN,
  toAbsoluteUrl,
} from './site';

export function unpublishedHubMetadata(): Metadata {
  return {
    title: 'Không tìm thấy khu vực',
    description: 'Chưa có lô đang bán tại địa bàn này hoặc đường dẫn không đúng.',
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export function communeHubMetadata(hub: PublicListingHub): Metadata {
  const title = communeHubHeadline(hub);
  const description = communeHubDescription(hub);
  const url = listingCommuneHubUrl(hub.slug);
  const branded = `${title} | ${ANHUNG_BRAND.name}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: branded,
      description,
      url,
      type: 'website',
      locale: 'vi_VN',
      siteName: ANHUNG_BRAND.name,
      images: [{ url: toAbsoluteUrl(PUBLIC_OG_DEFAULT), alt: ANHUNG_BRAND.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: branded,
      description,
      images: [toAbsoluteUrl(PUBLIC_OG_DEFAULT)],
    },
  };
}

export function communeHubBreadcrumbJsonLd(hub: PublicListingHub) {
  const hubUrl = listingCommuneHubUrl(hub.slug);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: PUBLIC_SITE_ORIGIN },
      {
        '@type': 'ListItem',
        position: 2,
        name: SAN_PHAM_LIST_TITLE,
        item: `${PUBLIC_SITE_ORIGIN}${SAN_PHAM_LIST_PATH}`,
      },
      { '@type': 'ListItem', position: 3, name: hub.label, item: hubUrl },
    ],
  };
}

export function communeHubItemListJsonLd(hub: PublicListingHubDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: communeHubHeadline(hub),
    description: communeHubDescription(hub),
    itemListElement: hub.items.map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: listingCanonicalUrl(listing.slug),
      name: listingHeadline(listing),
      description: listingSearchDescription(listing),
    })),
  };
}

export function placeHubMetadata(hub: PublicListingHub): Metadata {
  const title = placeHubHeadline(hub);
  const description = placeHubDescription(hub);
  const communeSlug = hub.communeSlug?.trim();
  if (!communeSlug) return unpublishedHubMetadata();
  const url = listingPlaceHubUrl(communeSlug, hub.slug);
  const branded = `${title} | ${ANHUNG_BRAND.name}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: branded,
      description,
      url,
      type: 'website',
      locale: 'vi_VN',
      siteName: ANHUNG_BRAND.name,
      images: [{ url: toAbsoluteUrl(PUBLIC_OG_DEFAULT), alt: ANHUNG_BRAND.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: branded,
      description,
      images: [toAbsoluteUrl(PUBLIC_OG_DEFAULT)],
    },
  };
}

export function placeHubBreadcrumbJsonLd(hub: PublicListingHub) {
  const communeSlug = hub.communeSlug?.trim();
  if (!communeSlug) return communeHubBreadcrumbJsonLd(hub);
  const communeUrl = listingCommuneHubUrl(communeSlug);
  const placeUrl = listingPlaceHubUrl(communeSlug, hub.slug);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: PUBLIC_SITE_ORIGIN },
      {
        '@type': 'ListItem',
        position: 2,
        name: SAN_PHAM_LIST_TITLE,
        item: `${PUBLIC_SITE_ORIGIN}${SAN_PHAM_LIST_PATH}`,
      },
      { '@type': 'ListItem', position: 3, name: hub.communeLabel ?? communeSlug, item: communeUrl },
      { '@type': 'ListItem', position: 4, name: hub.label, item: placeUrl },
    ],
  };
}

export function placeHubItemListJsonLd(hub: PublicListingHubDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: placeHubHeadline(hub),
    description: placeHubDescription(hub),
    itemListElement: hub.items.map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: listingCanonicalUrl(listing.slug),
      name: listingHeadline(listing),
      description: listingSearchDescription(listing),
    })),
  };
}
