import type { Metadata } from 'next';
import {
  listingSearchDescription,
  publicPriceLabelToVnd,
  type PublicGuestListing,
} from '@crmanhung/shared';
import { ANHUNG_BRAND } from './brand';
import {
  PUBLIC_LISTING_PATH,
  PUBLIC_OG_DEFAULT,
  PUBLIC_SITE_ORIGIN,
  listingCanonicalUrl,
  toAbsoluteUrl,
} from './site';

export const SAN_PHAM_LIST_PATH = PUBLIC_LISTING_PATH;
export const SAN_PHAM_LIST_TITLE = 'Nhà đất đang bán';
export const SAN_PHAM_LIST_DESCRIPTION =
  'Nhà đất An Hưng Land đang giới thiệu — xem vị trí, diện tích và giá công bố (hoặc liên hệ). Không cần đăng nhập.';

function listingOgImage(listing: PublicGuestListing): { url: string; alt: string } {
  const src = listing.coverImageUrl?.trim() || PUBLIC_OG_DEFAULT;
  return { url: toAbsoluteUrl(src), alt: listingHeadline(listing) };
}

/** H1 + meta title: tên lô + địa chỉ công khai. Không đổi slug. */
export function listingHeadline(listing: { title: string; location?: string | null }): string {
  const title = listing.title.trim();
  const location = listing.location?.trim() ?? '';
  if (!location) return title;
  if (title.toLowerCase().includes(location.toLowerCase())) return title;
  return `${title} tại ${location}`;
}

/** On-page H1 — stored `title` (GPT h1), verbatim. */
export function listingPageH1(listing: { title: string }): string {
  return listing.title.trim();
}

/** Document / OG / Twitter title — GPT seoTitle when saved, else title; no location suffix. */
export function listingSeoTitle(listing: { seoTitle?: string | null; title: string }): string {
  const seo = listing.seoTitle?.trim();
  if (seo) return seo;
  return listing.title.trim();
}

export function unpublishedListingMetadata(): Metadata {
  return {
    title: 'Không tìm thấy sản phẩm',
    description: 'Sản phẩm không tồn tại hoặc đã được gỡ khỏi web An Hưng Land.',
    robots: { index: false, follow: false },
    // Tránh kế thừa canonical trang chủ từ layout public.
    alternates: { canonical: null },
    openGraph: {
      title: 'Không tìm thấy sản phẩm',
      description: 'Sản phẩm không tồn tại hoặc đã được gỡ khỏi web An Hưng Land.',
      url: PUBLIC_SITE_ORIGIN,
      type: 'website',
      locale: 'vi_VN',
      siteName: ANHUNG_BRAND.name,
    },
  };
}

export function listingMetadata(listing: PublicGuestListing): Metadata {
  const description = listingSearchDescription(listing);
  const url = listingCanonicalUrl(listing.slug);
  const image = listingOgImage(listing);
  const seoTitle = listingSeoTitle(listing);
  const branded = `${seoTitle} | ${ANHUNG_BRAND.name}`;
  return {
    title: seoTitle,
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
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: branded,
      description,
      images: [image.url],
    },
  };
}

export function sanPhamListMetadata(): Metadata {
  const url = `${PUBLIC_SITE_ORIGIN}${SAN_PHAM_LIST_PATH}`;
  return {
    title: SAN_PHAM_LIST_TITLE,
    description: SAN_PHAM_LIST_DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      title: `${SAN_PHAM_LIST_TITLE} | ${ANHUNG_BRAND.name}`,
      description: SAN_PHAM_LIST_DESCRIPTION,
      url,
      type: 'website',
      locale: 'vi_VN',
      siteName: ANHUNG_BRAND.name,
      images: [{ url: toAbsoluteUrl(PUBLIC_OG_DEFAULT), alt: ANHUNG_BRAND.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SAN_PHAM_LIST_TITLE} | ${ANHUNG_BRAND.name}`,
      description: SAN_PHAM_LIST_DESCRIPTION,
      images: [toAbsoluteUrl(PUBLIC_OG_DEFAULT)],
    },
  };
}

function sellerJsonLd() {
  return {
    '@type': 'RealEstateAgent',
    name: ANHUNG_BRAND.name,
    url: PUBLIC_SITE_ORIGIN,
    telephone: `+84${ANHUNG_BRAND.hotlineTel.replace(/^0/, '')}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ANHUNG_BRAND.address,
      addressCountry: 'VN',
    },
  };
}

export function listingJsonLd(listing: PublicGuestListing) {
  const url = listingCanonicalUrl(listing.slug);
  const description = listingSearchDescription(listing);
  const image = listingOgImage(listing).url;
  const priceVnd = publicPriceLabelToVnd(listing.priceLabel);
  const headline = listingHeadline(listing);
  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    url,
    availability: 'https://schema.org/InStock',
    seller: sellerJsonLd(),
  };
  if (priceVnd != null) {
    offers.price = priceVnd;
    offers.priceCurrency = 'VND';
  } else if (listing.priceLabel?.trim()) {
    offers.description = listing.priceLabel.trim();
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: headline,
    description,
    url,
    image,
    inLanguage: 'vi-VN',
    ...(listing.updatedAt ? { dateModified: listing.updatedAt } : {}),
    ...(listing.publishedAt ? { datePosted: listing.publishedAt } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.location,
      addressCountry: 'VN',
    },
    offers,
  };
}

export function listingBreadcrumbJsonLd(listing: PublicGuestListing) {
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
      {
        '@type': 'ListItem',
        position: 3,
        name: listingHeadline(listing),
        item: listingCanonicalUrl(listing.slug),
      },
    ],
  };
}

export function listingItemListJsonLd(listings: PublicGuestListing[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: SAN_PHAM_LIST_TITLE,
    itemListElement: listings.map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: listingCanonicalUrl(listing.slug),
      name: listingHeadline(listing),
    })),
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: ANHUNG_BRAND.name,
    url: PUBLIC_SITE_ORIGIN,
    telephone: `+84${ANHUNG_BRAND.hotlineTel.replace(/^0/, '')}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ANHUNG_BRAND.address,
      addressCountry: 'VN',
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ANHUNG_BRAND.name,
    url: PUBLIC_SITE_ORIGIN,
    inLanguage: 'vi-VN',
  };
}
