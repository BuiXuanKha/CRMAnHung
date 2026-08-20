/**
 * Employee hotlines + Facebook page/nick names.
 * Settings modals; customer list channel filter; add-by-phone source.
 */
import { z } from 'zod';

const vnPhoneSchema = z
  .string()
  .trim()
  .regex(/^0\d{9}$/, 'SĐT phải gồm 10 số, bắt đầu bằng 0');

export const employeeHotlineSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  phone: z.string(),
  label: z.string(),
  isActive: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EmployeeHotline = z.infer<typeof employeeHotlineSchema>;

export const employeeHotlineListResponseSchema = z.object({
  items: z.array(employeeHotlineSchema),
  total: z.number().int().nonnegative(),
});

export type EmployeeHotlineListResponse = z.infer<
  typeof employeeHotlineListResponseSchema
>;

export const createEmployeeHotlineSchema = z.object({
  phone: vnPhoneSchema,
  label: z.string().trim().min(1, 'Tên hiển thị không được để trống').max(80),
});

export type CreateEmployeeHotlineInput = z.infer<typeof createEmployeeHotlineSchema>;

export const patchEmployeeHotlineSchema = z
  .object({
    label: z.string().trim().min(1).max(80).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.label !== undefined || v.isActive !== undefined, {
    message: 'Cần label hoặc isActive',
  });

export type PatchEmployeeHotlineInput = z.infer<typeof patchEmployeeHotlineSchema>;

export const employeeFacebookPageSchema = z.object({
  facebookUid: z.string(),
  nickname: z.string(),
  customerCount: z.number().int().nonnegative(),
  lastUsedAt: z.string().nullable(),
  profileId: z.string().nullable(),
  saved: z.boolean(),
});

export type EmployeeFacebookPage = z.infer<typeof employeeFacebookPageSchema>;

export const employeeFacebookPageListResponseSchema = z.object({
  items: z.array(employeeFacebookPageSchema),
  total: z.number().int().nonnegative(),
});

export type EmployeeFacebookPageListResponse = z.infer<
  typeof employeeFacebookPageListResponseSchema
>;

export const saveEmployeeFacebookPageSchema = z.object({
  facebookUid: z.string().trim().min(1),
  nickname: z.string().trim().min(1).max(120),
});

export type SaveEmployeeFacebookPageInput = z.infer<
  typeof saveEmployeeFacebookPageSchema
>;
