/**
 * Public web content — admin dashboard + listings/posts.
 * Guest reads published only. ADMIN publishes. See docs/domains/public-content.md.
 */
import { z } from 'zod';
import { PublicPostCategory, PublicPostStatus } from './enums.js';

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
