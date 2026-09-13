import type { Metadata } from 'next';
import {
  listingHeadline,
  listingPageH1,
  listingSearchDescription,
  listingSeoTitle,
  publicAreaLabelToM2,
  publicOgJpegUrlFromCoverUrl,
  publicPriceLabelToVnd,
  type PublicGuestListing,
} from '@crmanhung/shared';
import { ANHUNG_BRAND } from './brand';
import { parseLotGptLocation } from '@/features/public-content/lot-gpt-context';
import { publicSearchRobots } from './search-index';
import {
  isPublicAddressImageUrl,
  listingCoverAbsoluteUrl,
  listingImageAlt,
  listingSeoImageUrls,
} from './listing-image-seo';
import {
  PUBLIC_LISTING_PATH,
  PUBLIC_OG_DEFAULT,
  PUBLIC_SITE_ORIGIN,
  listingCanonicalUrl,
  listingCommuneHubPath,
  toAbsoluteUrl,
} from './site';

export { listingHeadline, listingPageH1, listingSeoTitle } from '@crmanhung/shared';
export { listingSeoImageUrls } from './listing-image-seo';

type ListingSeoInput = PublicGuestListing & {
  placeLabel?: string | null;
  communeLabel?: string | null;
  communeSlug?: string | null;
  placeSlug?: string | null;
  kindLabel?: string | null;
  areaLabel?: string | null;
  frontageLabel?: string | null;
  directionLabel?: string | null;
};

export function listingImageAltText(
  listing: { title: string; location?: string | null; placeLabel?: string | null },
  index: number,
  total: number,
  imageUrl?: string | null,
): string {
  if (isPublicAddressImageUrl(imageUrl)) {
    const project =
      listing.placeLabel?.trim() || listing.location?.trim() || listing.title.trim();
    return project;
  }
  return listingImageAlt(listing, index, total, listingHeadline(listing));
}

/** Cover / OG alt — project name when the file is a project-address photo. */
export function listingCoverAlt(listing: {
  title: string;
  location?: string | null;
  placeLabel?: string | null;
  coverImageUrl?: string | null;
}): string {
  return listingImageAltText(listing, 0, 1, listing.coverImageUrl);
}

export const SAN_PHAM_LIST_PATH = PUBLIC_LISTING_PATH;
export const SAN_PHAM_LIST_TITLE = 'Nhà đất đang bán';
export const SAN_PHAM_LIST_DESCRIPTION =
  'Nhà đất An Hưng Land đang giới thiệu — xem vị trí, diện tích và giá công bố (hoặc liên hệ). Không cần đăng nhập.';

function listingOgImage(listing: PublicGuestListing & { placeLabel?: string | null }): {
  url: string;
  alt: string;
} {
  const cover = listing.coverImageUrl?.trim() || '';
  // Gallery stays WebP; Zalo needs JPEG for link preview (FB accepts both).
  const og = cover ? publicOgJpegUrlFromCoverUrl(cover) || cover : PUBLIC_OG_DEFAULT;
  return { url: toAbsoluteUrl(og), alt: listingCoverAlt(listing) };
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

export function listingMetadata(
  listing: PublicGuestListing & { placeLabel?: string | null },
): Metadata {
  const description = listingSearchDescription(listing);
  const url = listingCanonicalUrl(listing.slug);
  const image = listingOgImage(listing);
  const seoTitle = listingSeoTitle(listing);
  const branded = `${seoTitle} | ${ANHUNG_BRAND.name}`;
  return {
    title: seoTitle,
    description,
    alternates: { canonical: url },
    robots: publicSearchRobots(),
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
      images: [image],
    },
  };
}

export function sanPhamListMetadata(): Metadata {
  const url = `${PUBLIC_SITE_ORIGIN}${SAN_PHAM_LIST_PATH}`;
  return {
    title: SAN_PHAM_LIST_TITLE,
    description: SAN_PHAM_LIST_DESCRIPTION,
    alternates: { canonical: url },
    robots: publicSearchRobots(),
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
      images: [{ url: toAbsoluteUrl(PUBLIC_OG_DEFAULT), alt: ANHUNG_BRAND.name }],
    },
  };
}

function sellerJsonLd() {
  return {
    '@type': 'RealEstateAgent' as const,
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

function listingPostalAddress(listing: ListingSeoInput) {
  const parsed = parseLotGptLocation(listing.location ?? '');
  const street =
    listing.placeLabel?.trim() || parsed.village.trim() || listing.location?.trim() || '';
  const locality = listing.communeLabel?.trim() || parsed.commune.trim();
  const region = parsed.province.trim();
  return {
    '@type': 'PostalAddress' as const,
    ...(street ? { streetAddress: street } : {}),
    ...(locality ? { addressLocality: locality } : {}),
    ...(region ? { addressRegion: region } : {}),
    addressCountry: 'VN',
  };
}

function listingImageObjectsJsonLd(listing: ListingSeoInput) {
  const urls = listingSeoImageUrls(listing);
  const fallback = listingOgImage(listing).url;
  const list = urls.length > 0 ? urls : [fallback];
  return list.map((contentUrl, index) => ({
    '@type': 'ImageObject',
    contentUrl,
    url: contentUrl,
    caption: listingImageAltText(listing, index, list.length, contentUrl),
    description: listingSearchDescription(listing),
    inLanguage: 'vi-VN',
    ...(index === 0 ? { representativeOfPage: true } : {}),
  }));
}

function listingItemOfferedJsonLd(listing: ListingSeoInput) {
  const h1 = listingPageH1(listing);
  const areaM2 = publicAreaLabelToM2(listing.areaLabel);
  const offeredType = listing.kindLabel?.trim() === 'Nhà' ? 'House' : 'Place';
  const extra: Array<Record<string, unknown>> = [];
  if (listing.frontageLabel?.trim()) {
    extra.push({
      '@type': 'PropertyValue',
      name: 'Mặt tiền',
      value: listing.frontageLabel.trim(),
    });
  }
  if (listing.directionLabel?.trim()) {
    extra.push({
      '@type': 'PropertyValue',
      name: 'Hướng',
      value: listing.directionLabel.trim(),
    });
  }
  return {
    '@type': offeredType,
    name: h1,
    address: listingPostalAddress(listing),
    ...(areaM2 != null
      ? {
          floorSize: {
            '@type': 'QuantitativeValue',
            value: areaM2,
            unitCode: 'MTK',
          },
        }
      : {}),
    ...(extra.length ? { additionalProperty: extra } : {}),
  };
}

export function listingJsonLd(listing: ListingSeoInput) {
  const url = listingCanonicalUrl(listing.slug);
  const description = listingSearchDescription(listing);
  const priceVnd = publicPriceLabelToVnd(listing.priceLabel);
  const h1 = listingPageH1(listing);
  const images = listingImageObjectsJsonLd(listing);
  const itemOffered = listingItemOfferedJsonLd(listing);
  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    url,
    availability: 'https://schema.org/InStock',
    businessFunction: 'http://purl.org/goodrelations/v1#Sell',
    seller: sellerJsonLd(),
    itemOffered,
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
    name: h1,
    headline: h1,
    description,
    url,
    image: images,
    primaryImageOfPage: images[0],
    inLanguage: 'vi-VN',
    ...(listing.updatedAt ? { dateModified: listing.updatedAt } : {}),
    ...(listing.publishedAt ? { datePosted: listing.publishedAt } : {}),
    address: listingPostalAddress(listing),
    offers,
    mainEntity: offers,
  };
}

export function listingCommuneHubCrumb(listing: {
  communeSlug?: string | null;
  communeLabel?: string | null;
}): { name: string; href: string } | null {
  const slug = listing.communeSlug?.trim();
  if (!slug) return null;
  const name = listing.communeLabel?.trim() || slug;
  return { name, href: listingCommuneHubPath(slug) };
}

export function listingBreadcrumbJsonLd(listing: ListingSeoInput) {
  const commune = listingCommuneHubCrumb(listing);
  const items: Array<{ '@type': 'ListItem'; position: number; name: string; item: string }> = [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: PUBLIC_SITE_ORIGIN },
    {
      '@type': 'ListItem',
      position: 2,
      name: SAN_PHAM_LIST_TITLE,
      item: `${PUBLIC_SITE_ORIGIN}${SAN_PHAM_LIST_PATH}`,
    },
  ];
  if (commune) {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: commune.name,
      item: `${PUBLIC_SITE_ORIGIN}${commune.href}`,
    });
  }
  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: listingPageH1(listing),
    item: listingCanonicalUrl(listing.slug),
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export function listingCatalogBreadcrumbJsonLd() {
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
    ],
  };
}

export function listingItemListJsonLd(listings: PublicGuestListing[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: SAN_PHAM_LIST_TITLE,
    numberOfItems: listings.length,
    itemListElement: listings.map((listing, index) => {
      const cover = listingCoverAbsoluteUrl(listing);
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: listingCanonicalUrl(listing.slug),
        name: listingPageH1(listing),
        ...(cover ? { image: cover } : {}),
      };
    }),
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
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${PUBLIC_SITE_ORIGIN}${PUBLIC_LISTING_PATH}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
