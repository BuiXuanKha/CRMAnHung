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
import { isMockPublicWeb } from '@/shared/api/mode';
import { pickRelatedListingSection, type RelatedListingSection } from './related-listings';
import { PUBLIC_PRODUCTS, type PublicProduct } from './mock-data';

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

function fallbackMarketingCatalog(): PublicListingView[] {
  return PUBLIC_PRODUCTS.map(productToListingView).filter(
    (row): row is PublicListingView => row != null,
  );
}

export async function listPublishedOverlayListings(): Promise<PublicListingView[]> {
  const items = await listPublishedCatalog();
  return items.map(catalogToView);
}

export async function listSitemapListings(): Promise<PublicGuestListing[]> {
  const overlay = await listPublishedOverlayListings();
  if (overlay.length > 0) return overlay;
  return isMockPublicWeb() ? fallbackMarketingCatalog() : [];
}

export async function listPublicCatalog(): Promise<PublicListingView[]> {
  const overlay = await listPublishedOverlayListings();
  if (overlay.length > 0) return overlay;
  return isMockPublicWeb() ? fallbackMarketingCatalog() : [];
}

export async function getPublicListingBySlug(slug: string): Promise<PublicListingView | null> {
  const fromApi = await getPublishedCatalogBySlug(slug);
  if (fromApi) return catalogToView(fromApi);
  if (!isMockPublicWeb()) return null;
  const product = PUBLIC_PRODUCTS.find((row) => row.slug === slug);
  return product ? productToListingView(product) : null;
}

export async function getRelatedListingSection(
  listing: PublicListingView,
): Promise<RelatedListingSection | null> {
  const catalog = await listPublicCatalog();
  return pickRelatedListingSection(listing, catalog);
}
