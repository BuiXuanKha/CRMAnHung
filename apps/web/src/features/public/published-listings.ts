import {
  type PublicCatalogListing,
  type PublicGuestListing,
} from '@crmanhung/shared';
import {
  getPublishedCatalogBySlug,
  getPublicLotSlugRedirect,
  listPublishedCatalog,
} from '@/features/public-content/api';
import { isNextProductionBuild } from '@/features/public/next-production-build';
import {
  pickRelatedListingSection,
  pickRelatedListingSections,
  type RelatedListingSection,
} from './related-listings';

export type { RelatedListingSection };

export { getPublicLotSlugRedirect };

export type PublicListingView = PublicGuestListing & {
  kindLabel: string;
  areaLabel: string | null;
  frontageLabel: string | null;
  directionLabel: string | null;
  imageUrls?: string[];
  communeSlug?: string | null;
  communeLabel?: string | null;
  placeSlug?: string | null;
  placeLabel?: string | null;
  addressKind?: PublicCatalogListing['addressKind'];
  saleStatus?: PublicCatalogListing['saleStatus'];
};

function catalogToView(row: PublicCatalogListing): PublicListingView {
  return {
    slug: row.slug,
    title: row.title,
    ...(row.seoTitle != null ? { seoTitle: row.seoTitle } : {}),
    location: row.location,
    priceLabel: row.priceLabel,
    excerpt: row.excerpt,
    ...(row.bodyHtml != null ? { bodyHtml: row.bodyHtml } : {}),
    coverImageUrl: row.coverImageUrl,
    ...(row.imageUrls?.length ? { imageUrls: row.imageUrls } : {}),
    ...(row.metaDescription != null ? { metaDescription: row.metaDescription } : {}),
    ...(row.publishedAt != null ? { publishedAt: row.publishedAt } : {}),
    ...(row.updatedAt ? { updatedAt: row.updatedAt } : {}),
    kindLabel: row.kindLabel,
    areaLabel: row.areaLabel,
    frontageLabel: row.frontageLabel,
    directionLabel: row.directionLabel,
    ...(row.communeSlug != null ? { communeSlug: row.communeSlug } : {}),
    ...(row.communeLabel != null ? { communeLabel: row.communeLabel } : {}),
    ...(row.placeSlug != null ? { placeSlug: row.placeSlug } : {}),
    ...(row.placeLabel != null ? { placeLabel: row.placeLabel } : {}),
    ...(row.addressKind != null ? { addressKind: row.addressKind } : {}),
    ...(row.saleStatus != null ? { saleStatus: row.saleStatus } : {}),
  };
}

export async function listPublishedOverlayListings(): Promise<PublicListingView[]> {
  try {
    const items = await listPublishedCatalog();
    return items.map(catalogToView);
  } catch (err) {
    // CI `next build` has no Nest — soft-fail only during production build collect.
    if (isNextProductionBuild()) return [];
    throw err;
  }
}

export async function listSitemapListings(): Promise<PublicGuestListing[]> {
  return listPublishedOverlayListings();
}

export async function listPublicCatalog(): Promise<PublicListingView[]> {
  return listPublishedOverlayListings();
}

export async function getPublicListingBySlug(slug: string): Promise<PublicListingView | null> {
  try {
    const fromApi = await getPublishedCatalogBySlug(slug);
    return fromApi ? catalogToView(fromApi) : null;
  } catch (err) {
    if (isNextProductionBuild()) return null;
    throw err;
  }
}

export async function getRelatedListingSection(
  listing: PublicListingView,
): Promise<RelatedListingSection | null> {
  const catalog = await listPublicCatalog();
  return pickRelatedListingSection(listing, catalog);
}

export async function getRelatedListingSections(
  listing: PublicListingView,
): Promise<RelatedListingSection[]> {
  const catalog = await listPublicCatalog();
  return pickRelatedListingSections(listing, catalog);
}
