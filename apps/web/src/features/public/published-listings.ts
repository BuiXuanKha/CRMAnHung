import { toGuestListing, type PublicGuestListing } from '@crmanhung/shared';
import { listStaffOpenLots } from '@/features/public-content/api';
import { lotKindLabel, lotPriceDisplay } from '@/features/public-content/display';
import { PUBLIC_PRODUCTS, type PublicProduct } from './mock-data';

export type PublicListingView = PublicGuestListing & {
  kindLabel: string;
  areaLabel: string | null;
  frontageLabel: string | null;
  directionLabel: string | null;
};

function staffToView(
  row: Awaited<ReturnType<typeof listStaffOpenLots>>[number],
): PublicListingView | null {
  const guest = toGuestListing({
    isPublished: row.isPublished,
    slug: row.slug,
    title: row.title,
    location: row.location,
    priceLabel: lotPriceDisplay(row).isMoney ? row.priceLabel : null,
    excerpt: row.excerpt,
    coverImageUrl: row.coverImageUrl,
    metaDescription: row.metaDescription,
  });
  if (!guest) return null;
  return {
    ...guest,
    priceLabel: lotPriceDisplay(row).text,
    kindLabel: lotKindLabel(row),
    areaLabel: row.areaM2 != null ? `${row.areaM2.toLocaleString('vi-VN')} m²` : null,
    frontageLabel:
      row.frontageM != null ? `${row.frontageM.toLocaleString('vi-VN')} m` : null,
    directionLabel: row.direction?.trim() || null,
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
  };
}

/** Overlay Đăng web ∩ lô đang Mở bán — source of truth for sitemap /san-pham. */
export async function listPublishedOverlayListings(): Promise<PublicListingView[]> {
  const staff = await listStaffOpenLots();
  return staff
    .map(staffToView)
    .filter((row): row is PublicListingView => row != null);
}

export async function listSitemapListings(): Promise<PublicGuestListing[]> {
  const overlay = await listPublishedOverlayListings();
  if (overlay.length > 0) return overlay;
  return PUBLIC_PRODUCTS.map(productToListingView).filter(
    (row): row is PublicListingView => row != null,
  );
}

export async function listPublicCatalog(): Promise<PublicListingView[]> {
  const overlay = await listPublishedOverlayListings();
  if (overlay.length > 0) return overlay;
  return PUBLIC_PRODUCTS.map(productToListingView).filter(
    (row): row is PublicListingView => row != null,
  );
}

export async function getPublicListingBySlug(slug: string): Promise<PublicListingView | null> {
  const overlay = await listPublishedOverlayListings();
  const fromOverlay = overlay.find((row) => row.slug === slug);
  if (fromOverlay) return fromOverlay;
  const product = PUBLIC_PRODUCTS.find((row) => row.slug === slug);
  return product ? productToListingView(product) : null;
}

export async function getRelatedListings(slug: string, limit = 3): Promise<PublicListingView[]> {
  const all = await listPublicCatalog();
  return all.filter((row) => row.slug !== slug).slice(0, limit);
}
