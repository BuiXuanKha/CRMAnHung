/**
 * Customers contract — P1
 * Soft-hide = `isHidden` (không dùng deletedAt ở phase này).
 */
import { z } from 'zod';
import { CustomerStatus } from './enums.js';

const vnPhoneSchema = z
  .string()
  .trim()
  .regex(/^0\d{9}$/, 'SĐT phải gồm 10 số, bắt đầu bằng 0');

export const customerPhoneSchema = z.object({
  id: z.string(),
  phone: z.string(),
  label: z.string().nullable().optional(),
});

export type CustomerPhone = z.infer<typeof customerPhoneSchema>;

export const customerFacebookSchema = z.object({
  customerUid: z.string().nullable().optional(),
  threadId: z.string().nullable().optional(),
  facebookName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  scanSource: z.string().nullable().optional(),
  scanSourceLabel: z.string().nullable().optional(),
  employeeFacebookUid: z.string().nullable().optional(),
});

export type CustomerFacebookMeta = z.infer<typeof customerFacebookSchema>;

export const customerCareNoteSchema = z.object({
  id: z.string(),
  note: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  createdAt: z.string(),
});

export type CustomerCareNote = z.infer<typeof customerCareNoteSchema>;

export const customerSourceHotlineSchema = z.object({
  id: z.string(),
  phone: z.string(),
  label: z.string(),
});

export type CustomerSourceHotline = z.infer<typeof customerSourceHotlineSchema>;

export const customerSourceFacebookProfileSchema = z.object({
  id: z.string(),
  facebookUid: z.string(),
  nickname: z.string().nullable(),
});

export type CustomerSourceFacebookProfile = z.infer<
  typeof customerSourceFacebookProfileSchema
>;

export const customerListItemSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  fullName: z.string(),
  status: z.nativeEnum(CustomerStatus),
  budgetMinVnd: z.number().int().nullable().optional(),
  budgetMaxVnd: z.number().int().nullable().optional(),
  note: z.string().nullable().optional(),
  isPinned: z.boolean(),
  isHidden: z.boolean(),
  pinnedAt: z.string().nullable().optional(),
  autoRestoredAt: z.string().nullable().optional(),
  primaryPhone: z.string().nullable().optional(),
  phones: z.array(customerPhoneSchema).default([]),
  facebook: customerFacebookSchema.nullable().optional(),
  sourceHotline: customerSourceHotlineSchema.nullable().optional(),
  /** Profile/page NV quét khách — cột Kênh liên hệ khi không có hotline. */
  sourceFacebookProfile: customerSourceFacebookProfileSchema.nullable().optional(),
  /** Cột Nhu cầu = NeedSummary mới nhất (care). Chưa copy history → null. */
  latestNeedSummary: z.string().nullable().optional(),
  latestCareNote: z.string().nullable().optional(),
  lodatCount: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CustomerListItem = z.infer<typeof customerListItemSchema>;

export const customerDetailSchema = customerListItemSchema.extend({
  careNotes: z.array(customerCareNoteSchema).default([]),
});

export type CustomerDetail = z.infer<typeof customerDetailSchema>;

export const customerListResponseSchema = z.object({
  items: z.array(customerListItemSchema),
  total: z.number().int().nonnegative(),
});

export type CustomerListResponse = z.infer<typeof customerListResponseSchema>;

export const customerListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  includeHidden: z.boolean().optional(),
  hiddenOnly: z.boolean().optional(),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập tên khách'),
  phone: vnPhoneSchema,
  note: z.string().trim().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  note: z.string().trim().nullable().optional(),
  budgetMinVnd: z.number().int().nonnegative().nullable().optional(),
  budgetMaxVnd: z.number().int().nonnegative().nullable().optional(),
  isPinned: z.boolean().optional(),
  isHidden: z.boolean().optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const createCareNoteSchema = z.object({
  note: z.string().trim().min(1, 'Vui lòng nhập ghi chú'),
});

export type CreateCareNoteInput = z.infer<typeof createCareNoteSchema>;
