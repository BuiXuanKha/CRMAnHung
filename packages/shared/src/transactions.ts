/**
 * Transactions contract — list + entity + Nest CRUD.
 *
 * `type` = Của tôi / Ghi nhận. `status` = cọc → công chứng → hoàn thành / hủy.
 * RECORD không có hoa hồng; doanh thu / hoa hồng chỉ đếm OWN + HOAN_TAT.
 * List: `limit` mặc định 50, tối đa 200; `offset` từ 0; `total` = COUNT.
 * Tạo: gửi `lodatId` hoặc `lodatCustomerMapId`.
 * Tiền: DB BigInt; JSON number hoặc string (giống lodats).
 */
import { z } from 'zod';
import {
  TransactionAttachmentKind,
  TransactionPartyRole,
  TransactionStatus,
  TransactionType,
} from './enums.js';

/** BigInt tiền VND trên JSON. */
export const transactionVndSchema = z.union([z.number(), z.string()]);

/** List GD: trang mặc định 50, tối đa 200 (cùng customers/lodats). */
export const TRANSACTION_LIST_PAGE_SIZE = 50;
export const TRANSACTION_LIST_MAX_PAGE_SIZE = 200;

export const transactionListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  type: z.nativeEnum(TransactionType),
  status: z.nativeEnum(TransactionStatus),
  lodatId: z.string().nullable().optional(),
  lodatTitle: z.string().nullable().optional(),
  sellerNames: z.array(z.string()),
  buyerNames: z.array(z.string()),
  salePriceVnd: transactionVndSchema.nullable().optional(),
  commissionVnd: transactionVndSchema.nullable().optional(),
  notaryAppointmentAt: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type TransactionListItem = z.infer<typeof transactionListItemSchema>;

export const transactionListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  createdByEmployeeId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(TRANSACTION_LIST_MAX_PAGE_SIZE).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;

export const transactionListStatsSchema = z.object({
  totalRevenueVnd: transactionVndSchema,
  totalCommissionVnd: transactionVndSchema,
});

export type TransactionListStats = z.infer<typeof transactionListStatsSchema>;

export const transactionListResponseSchema = z.object({
  items: z.array(transactionListItemSchema),
  total: z.number().int().nonnegative(),
  stats: transactionListStatsSchema,
});

export type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;

export const transactionPartySchema = z.object({
  id: z.string(),
  role: z.nativeEnum(TransactionPartyRole),
  customerId: z.string().nullable().optional(),
  freeTextName: z.string(),
  sortOrder: z.number().int().nonnegative(),
});

export type TransactionParty = z.infer<typeof transactionPartySchema>;

export const transactionSnapshotImageSchema = z.object({
  id: z.string(),
  objectKey: z.string(),
  url: z.string().nullable().optional(),
  sortOrder: z.number().int().nonnegative(),
  rotationDeg: z.number().int(),
  sourceLodatImageId: z.string().nullable().optional(),
});

export type TransactionSnapshotImage = z.infer<typeof transactionSnapshotImageSchema>;

export const transactionSnapshotSchema = z.object({
  title: z.string().nullable().optional(),
  addressText: z.string().nullable().optional(),
  areaM2: z.number().nullable().optional(),
  frontageM: z.number().nullable().optional(),
  direction: z.string().nullable().optional(),
  propertyKind: z.string().nullable().optional(),
  mapStatus: z.string().nullable().optional(),
  mapPriceVnd: transactionVndSchema.nullable().optional(),
  mapPriceNote: z.string().nullable().optional(),
  mapBrokerFeeNote: z.string().nullable().optional(),
  mapNote: z.string().nullable().optional(),
  images: z.array(transactionSnapshotImageSchema).default([]),
});

export type TransactionSnapshot = z.infer<typeof transactionSnapshotSchema>;

export const transactionAttachmentSchema = z.object({
  id: z.string(),
  objectKey: z.string(),
  url: z.string().nullable().optional(),
  kind: z.nativeEnum(TransactionAttachmentKind),
  label: z.string().nullable().optional(),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export type TransactionAttachment = z.infer<typeof transactionAttachmentSchema>;

export const transactionDetailSchema = transactionListItemSchema.extend({
  lodatCustomerMapId: z.string(),
  taxPriceVnd: transactionVndSchema.nullable().optional(),
  cancelReason: z.string().nullable().optional(),
  createdByEmployeeId: z.string(),
  completedAt: z.string().nullable().optional(),
  updatedAt: z.string(),
  parties: z.array(transactionPartySchema),
  snapshot: transactionSnapshotSchema.nullable().optional(),
  attachments: z.array(transactionAttachmentSchema).default([]),
});

export type TransactionDetail = z.infer<typeof transactionDetailSchema>;

export const transactionPartyInputSchema = z.object({
  customerId: z
    .string({ required_error: 'Người bán và người mua phải là khách trong CRM.' })
    .trim()
    .min(1, 'Người bán và người mua phải là khách trong CRM.'),
  freeTextName: z.string().trim().min(1, 'Cần tên bên giao dịch.'),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type TransactionPartyInput = z.infer<typeof transactionPartyInputSchema>;

export const createTransactionSchema = z
  .object({
    /** Ưu tiên: API lấy map active của lô. */
    lodatId: z.string().trim().min(1).optional(),
    lodatCustomerMapId: z.string().trim().min(1).optional(),
    type: z.nativeEnum(TransactionType),
    notaryAppointmentAt: z.string().nullable().optional(),
    salePriceVnd: transactionVndSchema,
    taxPriceVnd: transactionVndSchema.nullable().optional(),
    commissionVnd: transactionVndSchema.nullable().optional(),
    note: z.string().trim().max(4000).nullable().optional(),
    sellers: z.array(transactionPartyInputSchema).min(1, 'Cần ít nhất một người bán.'),
    buyers: z.array(transactionPartyInputSchema).min(1, 'Cần ít nhất một người mua.'),
  })
  .superRefine((v, ctx) => {
    if (!v.lodatId && !v.lodatCustomerMapId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lodatId'],
        message: 'Thiếu lô đất.',
      });
    }
    if (v.type === TransactionType.OWN && !v.notaryAppointmentAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['notaryAppointmentAt'],
        message: 'Giao dịch của tôi cần ngày hẹn công chứng.',
      });
    }
  });

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = z
  .object({
    status: z.nativeEnum(TransactionStatus).optional(),
    cancelReason: z.string().trim().max(2000).nullable().optional(),
    notaryAppointmentAt: z.string().nullable().optional(),
    salePriceVnd: transactionVndSchema.optional(),
    taxPriceVnd: transactionVndSchema.nullable().optional(),
    commissionVnd: transactionVndSchema.nullable().optional(),
    note: z.string().trim().max(4000).nullable().optional(),
    sellers: z.array(transactionPartyInputSchema).min(1).optional(),
    buyers: z.array(transactionPartyInputSchema).min(1).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status === TransactionStatus.HUY && !v.cancelReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cancelReason'],
        message: 'Cần lý do khi hủy giao dịch.',
      });
    }
  });

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const OPEN_TRANSACTION_EXISTS_CODE = 'OPEN_TRANSACTION_EXISTS';
export const openTransactionResponseSchema = z.object({
  id: z.string().nullable(),
});

export type OpenTransactionResponse = z.infer<typeof openTransactionResponseSchema>;
