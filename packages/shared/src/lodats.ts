/**
 * Lodats contract — P2 mock
 */
import { z } from 'zod';
import { LodatSaleStatus } from './enums.js';

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
  status: z.nativeEnum(LodatSaleStatus),
  coverImageUrl: z.string().nullable().optional(),
  extraPhotoCount: z.number().int().nonnegative().default(0),
  customerHint: z.string().nullable().optional(),
  updatedAt: z.string(),
});

export type LodatListItem = z.infer<typeof lodatListItemSchema>;

export const lodatListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  status: z.nativeEnum(LodatSaleStatus).optional(),
  includePaused: z.boolean().optional(),
  pausedOnly: z.boolean().optional(),
});

export type LodatListQuery = z.infer<typeof lodatListQuerySchema>;

export const lodatListResponseSchema = z.object({
  items: z.array(lodatListItemSchema),
  total: z.number().int().nonnegative(),
});

export type LodatListResponse = z.infer<typeof lodatListResponseSchema>;
