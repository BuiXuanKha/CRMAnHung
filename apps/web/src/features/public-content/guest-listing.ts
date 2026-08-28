import type { PublicCatalogListing, PublicWebStaffLotRow } from '@crmanhung/shared';
import { lotPriceDisplay } from './display';

/**
 * Guest card on anhungland.com — public overlay only.
 * Never include staff name, customer PII, commission, or raw CRM VND.
 */
export type PublicGuestLot = {
  id: string;
  slug: string;
  title: string;
  location: string;
  coverImageUrl: string | null;
  /** Public price label or «Liên hệ» — not CRM map price. */
  priceLabel: string;
  areaLabel: string | null;
  excerpt?: string;
  bodyHtml?: string;
};

/** Overlay-only card when CRM `/lodats` is not callable (build / unauthenticated SSR). */
export function overlayRowToGuestLot(row: {
  id: string;
  slug: string;
  title: string;
  location: string;
  coverImageUrl: string | null;
  priceLabel: string | null;
}): PublicGuestLot {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    location: row.location,
    coverImageUrl: row.coverImageUrl,
    priceLabel: row.priceLabel?.trim() || 'Liên hệ',
    areaLabel: null,
  };
}

export function catalogToGuestLot(row: PublicCatalogListing): PublicGuestLot {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    location: row.location,
    coverImageUrl: row.coverImageUrl,
    priceLabel: row.priceLabel?.trim() || 'Liên hệ',
    areaLabel: row.areaLabel,
    excerpt: row.excerpt,
    ...(row.bodyHtml != null ? { bodyHtml: row.bodyHtml } : {}),
  };
}

export function toPublicGuestLot(row: PublicWebStaffLotRow): PublicGuestLot {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    location: row.location,
    coverImageUrl: row.coverImageUrl,
    priceLabel: lotPriceDisplay(row).text,
    areaLabel:
      row.areaM2 != null ? `${row.areaM2.toLocaleString('vi-VN')} m²` : null,
  };
}

export function publishedStaffLotsToGuest(rows: PublicWebStaffLotRow[]): PublicGuestLot[] {
  return rows.filter((row) => row.isPublished).map(toPublicGuestLot);
}
