import {
  toGuestListing,
  type PublicCatalogListing,
  type PublicGuestListing,
} from '@crmanhung/shared';
import {
  getPublishedCatalogBySlug,
  getPublicLotSlugRedirect,
  listPublishedCatalog,
} from '@/features/public-content/api';
import {
  pickRelatedListingSection,
  pickRelatedListingSections,
  type RelatedListingSection,
} from './related-listings';
import type { PublicProduct } from './mock-data';

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
  };
}

export function productToListingView(product: PublicProduct): PublicListingView | null {
  const guest = toGuestListing({
    isPublished: product.isPublished,
    slug: product.slug,
    title: product.title,
    location: product.location,
    priceLabel: product.priceLabel,
    excerpt: product.excerpt,
    coverImageUrl: product.imageUrl,
    metaDescription: product.metaDescription,
  });
  if (!guest) return null;
  return {
    ...guest,
    kindLabel: product.typeLabel,
    areaLabel: product.areaLabel,
    frontageLabel: product.frontageLabel,
    directionLabel: product.directionLabel,
    ...(product.gallery?.length ? { imageUrls: product.gallery } : {}),
  };
}

export async function listPublishedOverlayListings(): Promise<PublicListingView[]> {
  const items = await listPublishedCatalog();
  return items.map(catalogToView);
}

export async function listSitemapListings(): Promise<PublicGuestListing[]> {
  return listPublishedOverlayListings();
}

export async function listPublicCatalog(): Promise<PublicListingView[]> {
  return listPublishedOverlayListings();
}

export async function getPublicListingBySlug(slug: string): Promise<PublicListingView | null> {
  const fromApi = await getPublishedCatalogBySlug(slug);
  return fromApi ? catalogToView(fromApi) : null;
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
