/**
 * Transactions contract — P3 list mock
 *
 * `type` = Của tôi / Ghi nhận. `status` = cọc → công chứng → hoàn thành / hủy.
 * RECORD không có hoa hồng; doanh thu / hoa hồng chỉ đếm OWN + HOAN_TAT.
 */
import { z } from 'zod';
import { TransactionStatus, TransactionType } from './enums.js';

export const transactionListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  type: z.nativeEnum(TransactionType),
  status: z.nativeEnum(TransactionStatus),
  lodatId: z.string().nullable().optional(),
  lodatTitle: z.string().nullable().optional(),
  sellerNames: z.array(z.string()),
  buyerNames: z.array(z.string()),
  salePriceVnd: z.number().int().nullable().optional(),
  commissionVnd: z.number().int().nullable().optional(),
  notaryAppointmentAt: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type TransactionListItem = z.infer<typeof transactionListItemSchema>;

export const transactionListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
});

export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;

export const transactionListStatsSchema = z.object({
  totalRevenueVnd: z.number().int().nonnegative(),
  totalCommissionVnd: z.number().int().nonnegative(),
});

export type TransactionListStats = z.infer<typeof transactionListStatsSchema>;

export const transactionListResponseSchema = z.object({
  items: z.array(transactionListItemSchema),
  total: z.number().int().nonnegative(),
  stats: transactionListStatsSchema,
});

export type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;
