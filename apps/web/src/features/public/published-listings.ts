import {
  toGuestListing,
  type PublicGuestListing,
  type PublicWebLotRow,
} from '@crmanhung/shared';
import { listPublicWebLots } from '@/features/public-content/api';
import { PUBLIC_PRODUCTS, type PublicProduct } from './mock-data';

export type PublicListingView = PublicGuestListing & {
  kindLabel: string;
  areaLabel: string | null;
  frontageLabel: string | null;
  directionLabel: string | null;
};

function overlayExcerpt(row: PublicWebLotRow): string {
  const custom = row.excerpt?.trim();
  if (custom) return custom;
  return [row.title, row.location].filter(Boolean).join('. ');
}

function overlayPriceLabel(row: PublicWebLotRow): string | null {
  if (row.priceMode === 'CONTACT') return null;
  const label = row.priceLabel?.trim();
  return label || null;
}

/** Overlay Đăng web — no JWT `/lodats`. Safe for `next build` + public SSR. */
function overlayToView(row: PublicWebLotRow): PublicListingView | null {
  const guest = toGuestListing({
    isPublished: row.isPublished,
    slug: row.slug,
    title: row.title,
    location: row.location,
    priceLabel: overlayPriceLabel(row),
    excerpt: overlayExcerpt(row),
    coverImageUrl: row.coverImageUrl,
  });
  if (!guest) return null;
  return {
    ...guest,
    kindLabel: 'Nhà đất',
    areaLabel: null,
    frontageLabel: null,
    directionLabel: null,
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

function fallbackMarketingCatalog(): PublicListingView[] {
  return PUBLIC_PRODUCTS.map(productToListingView).filter(
    (row): row is PublicListingView => row != null,
  );
}

/** Overlay Đăng web — source of truth for sitemap /san-pham. Never fetches `/lodats`. */
export async function listPublishedOverlayListings(): Promise<PublicListingView[]> {
  const overlay = await listPublicWebLots();
  return overlay.map(overlayToView).filter((row): row is PublicListingView => row != null);
}

export async function listSitemapListings(): Promise<PublicGuestListing[]> {
  const overlay = await listPublishedOverlayListings();
  if (overlay.length > 0) return overlay;
  return fallbackMarketingCatalog();
}

export async function listPublicCatalog(): Promise<PublicListingView[]> {
  const overlay = await listPublishedOverlayListings();
  if (overlay.length > 0) return overlay;
  return fallbackMarketingCatalog();
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
