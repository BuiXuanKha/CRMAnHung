/**
 * Title services contract — hồ sơ làm sổ đỏ.
 *
 * Breaking vs mock P3: `customerId` bắt buộc; tiền BigInt (JSON number|string);
 * `createdByEmployeeId` trên list/detail; `expectedDoneAt`; attachment **không**
 * có URL public / objectKey client (signed GET sau authz). Ghim: `pinTitleServiceSchema`.
 * Số ngày dừng khi Hoàn thành **hoặc** Hủy (`completedAt` luôn ghi).
 * List: `limit` mặc định 50, tối đa 200; `offset` từ 0; `total` = COUNT.
 */
import { z } from 'zod';
import {
  TitleServiceDocKind,
  TitleServiceMoneyKind,
  TitleServiceStatus,
  TitleServiceStepType,
} from './enums.js';

/** BigInt tiền VND trên JSON (giống transactions). */
export const titleServiceVndSchema = z.union([z.number(), z.string()]);

export const titleServiceProgressSchema = z.object({
  id: z.string(),
  stepType: z.nativeEnum(TitleServiceStepType),
  note: z.string().nullable().optional(),
  happenedAt: z.string(),
  /** Khi bước Công việc gắn WorkTask đã hoàn thành. */
  completedAt: z.string().nullable().optional(),
  workTaskId: z.string().nullable().optional(),
  createdByEmployeeId: z.string().optional(),
  employeeName: z.string().nullable().optional(),
});

export type TitleServiceProgress = z.infer<typeof titleServiceProgressSchema>;

export const titleServiceMoneyEntrySchema = z.object({
  id: z.string(),
  kind: z.nativeEnum(TitleServiceMoneyKind),
  title: z.string(),
  amountVnd: titleServiceVndSchema,
  note: z.string().nullable().optional(),
  happenedAt: z.string(),
  createdByEmployeeId: z.string().optional(),
  employeeName: z.string().nullable().optional(),
});

export type TitleServiceMoneyEntry = z.infer<typeof titleServiceMoneyEntrySchema>;

/** Metadata file mật — không `url`, không `objectKey` (client không tự ghép CDN). */
export const titleServiceAttachmentSchema = z.object({
  id: z.string(),
  kind: z.nativeEnum(TitleServiceDocKind),
  fileName: z.string(),
  createdAt: z.string(),
  createdByEmployeeId: z.string().optional(),
});

export type TitleServiceAttachment = z.infer<typeof titleServiceAttachmentSchema>;

/** Signed GET sau authz — TTL ngắn, không persist trên list/detail. */
export const titleServiceAttachmentSignedUrlSchema = z.object({
  url: z.string(),
  expiresAt: z.string(),
});

export type TitleServiceAttachmentSignedUrl = z.infer<
  typeof titleServiceAttachmentSignedUrlSchema
>;

export const titleServiceListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  primaryPhone: z.string().nullable().optional(),
  status: z.nativeEnum(TitleServiceStatus),
  agreedFeeVnd: titleServiceVndSchema.nullable().optional(),
  needSummary: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  isPinned: z.boolean(),
  pinnedAt: z.string().nullable().optional(),
  startedAt: z.string(),
  expectedDoneAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  createdByEmployeeId: z.string(),
  createdByName: z.string().nullable().optional(),
  daysWorking: z.number().int().nonnegative(),
  documentCount: z.number().int().nonnegative(),
  totalThuVnd: titleServiceVndSchema,
  totalChiVnd: titleServiceVndSchema,
  latestProgress: titleServiceProgressSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TitleServiceListItem = z.infer<typeof titleServiceListItemSchema>;

export const titleServiceDetailSchema = titleServiceListItemSchema.extend({
  progress: z.array(titleServiceProgressSchema).default([]),
  moneyEntries: z.array(titleServiceMoneyEntrySchema).default([]),
  attachments: z.array(titleServiceAttachmentSchema).default([]),
});

export type TitleServiceDetail = z.infer<typeof titleServiceDetailSchema>;

/** List sổ đỏ: trang mặc định 50, tối đa 200 (cùng customers/lodats). */
export const TITLE_SERVICE_LIST_PAGE_SIZE = 50;
export const TITLE_SERVICE_LIST_MAX_PAGE_SIZE = 200;

export const titleServiceListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  status: z.nativeEnum(TitleServiceStatus).optional(),
  /** ADMIN lọc theo NV tạo. */
  createdByEmployeeId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(TITLE_SERVICE_LIST_MAX_PAGE_SIZE).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type TitleServiceListQuery = z.infer<typeof titleServiceListQuerySchema>;

/** Thẻ tổng hợp list — thu/chi theo cùng filter API (không chỉ trang đang xem). */
export const titleServiceListStatsSchema = z.object({
  totalThuVnd: titleServiceVndSchema,
  totalChiVnd: titleServiceVndSchema,
});

export type TitleServiceListStats = z.infer<typeof titleServiceListStatsSchema>;

export const titleServiceListResponseSchema = z.object({
  items: z.array(titleServiceListItemSchema),
  total: z.number().int().nonnegative(),
  stats: titleServiceListStatsSchema,
});

export type TitleServiceListResponse = z.infer<typeof titleServiceListResponseSchema>;

export const createTitleServiceSchema = z.object({
  customerId: z.string().trim().min(1, 'Chọn khách hàng.'),
  agreedFeeVnd: titleServiceVndSchema.nullable().optional(),
  needSummary: z.string().optional(),
  note: z.string().optional(),
  startedAt: z.string().optional(),
  expectedDoneAt: z.string().nullable().optional(),
});

export type CreateTitleServiceInput = z.infer<typeof createTitleServiceSchema>;

export const updateTitleServiceSchema = z.object({
  status: z.nativeEnum(TitleServiceStatus).optional(),
  agreedFeeVnd: titleServiceVndSchema.nullable().optional(),
  needSummary: z.string().optional(),
  note: z.string().optional(),
  expectedDoneAt: z.string().nullable().optional(),
});

export type UpdateTitleServiceInput = z.infer<typeof updateTitleServiceSchema>;

export const pinTitleServiceSchema = z.object({
  pinned: z.boolean(),
});

export type PinTitleServiceInput = z.infer<typeof pinTitleServiceSchema>;

export const addTitleServiceProgressSchema = z.object({
  stepType: z.nativeEnum(TitleServiceStepType),
  note: z.string().optional(),
  happenedAt: z.string().optional(),
});

export type AddTitleServiceProgressInput = z.infer<typeof addTitleServiceProgressSchema>;

export const addTitleServiceMoneySchema = z.object({
  kind: z.nativeEnum(TitleServiceMoneyKind),
  title: z.string().trim().min(1, 'Nhập tiêu đề khoản tiền.'),
  amountVnd: z.number().int().positive('Nhập số tiền hợp lệ.'),
  happenedAt: z.string().optional(),
  note: z.string().optional(),
});

export type AddTitleServiceMoneyInput = z.infer<typeof addTitleServiceMoneySchema>;

/** Mock / metadata. Upload thật = multipart; server đặt objectKey private. */
export const addTitleServiceAttachmentSchema = z.object({
  kind: z.nativeEnum(TitleServiceDocKind),
  fileName: z.string().trim().min(1, 'Nhập tên file.'),
});

export type AddTitleServiceAttachmentInput = z.infer<typeof addTitleServiceAttachmentSchema>;
