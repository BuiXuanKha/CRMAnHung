import { z } from 'zod';
import { LodatSaleStatus } from './enums.js';
import { PUBLIC_LISTING_SHORT_PATH } from './public-content.js';

export const lotShareContactSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
});

export type LotShareContact = z.infer<typeof lotShareContactSchema>;

export const lotShareLinkResponseSchema = z.object({
  shareCode: z.string().min(4).max(12),
  slug: z.string().min(1),
  url: z.string().url(),
});

export type LotShareLinkResponse = z.infer<typeof lotShareLinkResponseSchema>;

export const publicLotShareResolveSchema = z.object({
  shareCode: z.string().min(4).max(12),
  listingSlug: z.string().min(1),
  employee: lotShareContactSchema,
  visitCount: z.number().int().nonnegative(),
});

export type PublicLotShareResolve = z.infer<typeof publicLotShareResolveSchema>;

export const publicLotShareVisitResponseSchema = z.object({
  ok: z.literal(true),
  visitCount: z.number().int().nonnegative(),
});

export type PublicLotShareVisitResponse = z.infer<typeof publicLotShareVisitResponseSchema>;

/** Build guest share URL (short path + query). */
export function buildLotShareUrl(
  origin: string,
  slug: string,
  shareCode: string,
): string {
  const base = origin.replace(/\/$/, '');
  const path = `${PUBLIC_LISTING_SHORT_PATH}/${encodeURIComponent(slug)}`;
  const qs = new URLSearchParams({ share: shareCode });
  return `${base}${path}?${qs.toString()}`;
}

/** Guest listing sale badge — lô đã publish vẫn mở khi Tạm dừng / Đã bán. */
export const publicListingSaleStatusSchema = z.nativeEnum(LodatSaleStatus);

export type PublicListingSaleStatus = z.infer<typeof publicListingSaleStatusSchema>;
