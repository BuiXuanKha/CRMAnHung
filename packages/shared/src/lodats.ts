/**
 * Lodats contract — P2 mock
 *
 * `status` trên list = trạng thái **rao bán** (Mở bán / Tạm dừng),
 * không phải đã bán / đặt cọc (giao dịch P3).
 */
import { z } from 'zod';
import { LodatKind, LodatSaleStatus } from './enums.js';

export const lodatListingStatusSchema = z.enum([
  LodatSaleStatus.DANG_BAN,
  LodatSaleStatus.TAM_DUNG,
]);

export type LodatListingStatus = z.infer<typeof lodatListingStatusSchema>;

export const lodatListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  address: z.string().nullable().optional(),
  areaM2: z.number().nullable().optional(),
  frontageM: z.number().nullable().optional(),
  direction: z.string().nullable().optional(),
  priceVnd: z.number().int().nullable().optional(),
  priceNote: z.string().nullable().optional(),
  commissionPercent: z.number().nullable().optional(),
  kind: z.nativeEnum(LodatKind),
  status: lodatListingStatusSchema,
  coverImageUrl: z.string().nullable().optional(),
  extraPhotoCount: z.number().int().nonnegative().default(0),
  customerHint: z.string().nullable().optional(),
  updatedAt: z.string(),
});

export type LodatListItem = z.infer<typeof lodatListItemSchema>;

export const lodatListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  status: lodatListingStatusSchema.optional(),
  kind: z.nativeEnum(LodatKind).optional(),
  includePaused: z.boolean().optional(),
  pausedOnly: z.boolean().optional(),
});

export type LodatListQuery = z.infer<typeof lodatListQuerySchema>;

export const lodatListResponseSchema = z.object({
  items: z.array(lodatListItemSchema),
  total: z.number().int().nonnegative(),
});

export type LodatListResponse = z.infer<typeof lodatListResponseSchema>;

export const updateLodatSaleStatusSchema = z.object({
  status: lodatListingStatusSchema,
});

export type UpdateLodatSaleStatusInput = z.infer<typeof updateLodatSaleStatusSchema>;
