/**
 * Public web content — admin dashboard + listings/posts.
 * Guest reads published only. ADMIN publishes. See docs/domains/public-content.md.
 *
 * Non-breaking: `metaDescription` is optional on staff overlay + guest listing.
 * SERP snippet falls back to `excerpt`. Editor modal may fill it later.
 */
import { z } from 'zod';
import { LodatKind, PublicPostCategory, PublicPostStatus } from './enums.js';

/** Google snippet length — clip excerpt / metaDescription to this. */
export const META_DESCRIPTION_MAX = 160;

export const publicListingPriceModeSchema = z.enum(['AMOUNT', 'CONTACT']);

export type PublicListingPriceMode = z.infer<typeof publicListingPriceModeSchema>;

export const publicWebLotRowSchema = z.object({
  id: z.string(),
  lodatId: z.string(),
  slug: z.string(),
  title: z.string(),
  location: z.string(),
  coverImageUrl: z.string().nullable(),
  /** Hiện trên web khách */
  isPublished: z.boolean(),
  priceMode: publicListingPriceModeSchema,
  priceLabel: z.string().nullable(),
});

export type PublicWebLotRow = z.infer<typeof publicWebLotRowSchema>;

/** Lô CRM đang Mở bán — list giữa `/dashboard/lo-dat` + preview phải. */
export const publicWebStaffLotRowSchema = publicWebLotRowSchema.extend({
  staffName: z.string(),
  kind: z.nativeEnum(LodatKind),
  areaM2: z.number().nullable(),
  frontageM: z.number().nullable(),
  direction: z.string().nullable(),
  excerpt: z.string(),
  /** Optional SERP/OG snippet. Empty → use excerpt. Overlay editor can set later. */
  metaDescription: z.string().trim().max(320).nullable().optional(),
});

export type PublicWebStaffLotRow = z.infer<typeof publicWebStaffLotRowSchema>;

/**
 * Published listing as guests and search engines see it.
 * Never include CRM VND, commission, owner notes, or customer PII.
 */
export const publicGuestListingSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  location: z.string(),
  priceLabel: z.string().nullable(),
  excerpt: z.string(),
  coverImageUrl: z.string().nullable(),
  metaDescription: z.string().trim().max(320).nullable().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type PublicGuestListing = z.infer<typeof publicGuestListingSchema>;

export function clipMetaDescription(
  text: string,
  max = META_DESCRIPTION_MAX,
): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.length <= max) return t;
  const sliced = t.slice(0, Math.max(1, max - 1));
  const lastSpace = sliced.lastIndexOf(' ');
  const base = lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced;
  return `${base.trim()}…`;
}

export function listingSearchDescription(listing: {
  metaDescription?: string | null;
  excerpt: string;
}): string {
  const custom = listing.metaDescription?.trim();
  return clipMetaDescription(custom || listing.excerpt);
}

export function toGuestListing(row: {
  isPublished: boolean;
  slug: string;
  title: string;
  location: string;
  priceLabel: string | null;
  excerpt: string;
  coverImageUrl: string | null;
  metaDescription?: string | null;
  updatedAt?: string;
}): PublicGuestListing | null {
  if (!row.isPublished) return null;
  return {
    slug: row.slug,
    title: row.title,
    location: row.location,
    priceLabel: row.priceLabel,
    excerpt: row.excerpt,
    coverImageUrl: row.coverImageUrl,
    ...(row.metaDescription != null ? { metaDescription: row.metaDescription } : {}),
    ...(row.updatedAt ? { updatedAt: row.updatedAt } : {}),
  };
}

/**
 * Parse the **public** price label to VND for JSON-LD Offer.
 * Returns null for Liên hệ, obfuscated labels (e.g. `3 tỷ xxx`), or unparseable text.
 * Do not pass CRM map price here.
 */
export function publicPriceLabelToVnd(label: string | null | undefined): number | null {
  if (!label) return null;
  const t = label.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!t || t === 'liên hệ' || t.includes('xxx') || t.includes('…') || t.includes('...')) {
    return null;
  }
  const match = t.match(/^([\d]+(?:[.,]\d{1,2})?)\s*(tỷ|triệu)$/i);
  if (!match) return null;
  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const unit = match[2];
  if (unit === 'tỷ') return Math.round(amount * 1_000_000_000);
  return Math.round(amount * 1_000_000);
}

export const publicWebPostRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: z.nativeEnum(PublicPostCategory),
  status: z.nativeEnum(PublicPostStatus),
});

export type PublicWebPostRow = z.infer<typeof publicWebPostRowSchema>;

export const publicWebDashboardSchema = z.object({
  publishedLotCount: z.number().int().nonnegative(),
  pendingLotCount: z.number().int().nonnegative(),
  publishedPostCount: z.number().int().nonnegative(),
  draftPostCount: z.number().int().nonnegative(),
  recentLots: z.array(publicWebLotRowSchema),
  recentPosts: z.array(publicWebPostRowSchema),
});

export type PublicWebDashboard = z.infer<typeof publicWebDashboardSchema>;

export const setPublicLotPublishedSchema = z.object({
  isPublished: z.boolean(),
});

export type SetPublicLotPublishedInput = z.infer<typeof setPublicLotPublishedSchema>;

export const setPublicPostStatusSchema = z.object({
  status: z.nativeEnum(PublicPostStatus),
});

export type SetPublicPostStatusInput = z.infer<typeof setPublicPostStatusSchema>;

export const createPublicPostInputSchema = z.object({
  title: z.string().trim().min(1, 'Nhập tiêu đề bài viết'),
  category: z.nativeEnum(PublicPostCategory),
  status: z.nativeEnum(PublicPostStatus),
});

export type CreatePublicPostInput = z.infer<typeof createPublicPostInputSchema>;
