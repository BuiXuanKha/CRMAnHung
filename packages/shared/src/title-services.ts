/**
 * Title services contract — P3 list mock
 *
 * Hồ sơ làm sổ đỏ: trạng thái Đang làm / Tạm dừng / Hoàn thành / Hủy.
 * Số ngày đếm từ startedAt; dừng khi Hoàn thành hoặc Hủy.
 */
import { z } from 'zod';
import {
  TitleServiceDocKind,
  TitleServiceMoneyKind,
  TitleServiceStatus,
  TitleServiceStepType,
} from './enums.js';

export const titleServiceProgressSchema = z.object({
  id: z.string(),
  stepType: z.nativeEnum(TitleServiceStepType),
  note: z.string().nullable().optional(),
  happenedAt: z.string(),
  employeeName: z.string().nullable().optional(),
});

export type TitleServiceProgress = z.infer<typeof titleServiceProgressSchema>;

export const titleServiceMoneyEntrySchema = z.object({
  id: z.string(),
  kind: z.nativeEnum(TitleServiceMoneyKind),
  title: z.string(),
  amountVnd: z.number().int().nonnegative(),
  happenedAt: z.string(),
  employeeName: z.string().nullable().optional(),
});

export type TitleServiceMoneyEntry = z.infer<typeof titleServiceMoneyEntrySchema>;

export const titleServiceAttachmentSchema = z.object({
  id: z.string(),
  kind: z.nativeEnum(TitleServiceDocKind),
  fileName: z.string(),
  createdAt: z.string(),
});

export type TitleServiceAttachment = z.infer<typeof titleServiceAttachmentSchema>;

export const titleServiceListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  customerId: z.string().nullable().optional(),
  customerName: z.string(),
  primaryPhone: z.string().nullable().optional(),
  status: z.nativeEnum(TitleServiceStatus),
  agreedFeeVnd: z.number().int().nullable().optional(),
  needSummary: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  isPinned: z.boolean(),
  startedAt: z.string(),
  completedAt: z.string().nullable().optional(),
  daysWorking: z.number().int().nonnegative(),
  documentCount: z.number().int().nonnegative(),
  totalThuVnd: z.number().int().nonnegative(),
  totalChiVnd: z.number().int().nonnegative(),
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

export const titleServiceListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  status: z.nativeEnum(TitleServiceStatus).optional(),
});

export type TitleServiceListQuery = z.infer<typeof titleServiceListQuerySchema>;

export const titleServiceListResponseSchema = z.object({
  items: z.array(titleServiceListItemSchema),
  total: z.number().int().nonnegative(),
});

export type TitleServiceListResponse = z.infer<typeof titleServiceListResponseSchema>;

export const updateTitleServiceSchema = z.object({
  status: z.nativeEnum(TitleServiceStatus).optional(),
  agreedFeeVnd: z.number().int().nullable().optional(),
  needSummary: z.string().optional(),
  note: z.string().optional(),
  isPinned: z.boolean().optional(),
});

export type UpdateTitleServiceInput = z.infer<typeof updateTitleServiceSchema>;

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
});

export type AddTitleServiceMoneyInput = z.infer<typeof addTitleServiceMoneySchema>;

export const addTitleServiceAttachmentSchema = z.object({
  kind: z.nativeEnum(TitleServiceDocKind),
  fileName: z.string().trim().min(1, 'Nhập tên file.'),
});

export type AddTitleServiceAttachmentInput = z.infer<typeof addTitleServiceAttachmentSchema>;
