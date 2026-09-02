import { z } from 'zod';
import { UserRole } from './enums.js';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  role: z.nativeEnum(UserRole),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: authUserSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

const vnPhoneSchema = z
  .string()
  .trim()
  .regex(/^0\d{9}$/, 'SĐT phải gồm 10 số, bắt đầu bằng 0');

const vnPhoneInputSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .pipe(vnPhoneSchema);

const usernameSchema = z
  .string()
  .trim()
  .min(2, 'Tên đăng nhập tối thiểu 2 ký tự')
  .max(40, 'Tên đăng nhập tối đa 40 ký tự')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Chỉ dùng chữ, số, dấu chấm, gạch ngang, gạch dưới');

const userPasswordSchema = z
  .string()
  .min(6, 'Mật khẩu tối thiểu 6 ký tự')
  .max(128, 'Mật khẩu tối đa 128 ký tự');

/** ADMIN directory — GET /users (lọc NV trên list sổ đỏ). */
export const userDirectoryItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean().optional(),
});

export type UserDirectoryItem = z.infer<typeof userDirectoryItemSchema>;

/** ADMIN — GET /users (quản lý nhân viên). */
export const userAdminListItemSchema = userDirectoryItemSchema.extend({
  createdAt: z.string().datetime().optional(),
});

export type UserAdminListItem = z.infer<typeof userAdminListItemSchema>;

export const createUserSchema = z.object({
  username: usernameSchema,
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(120),
  phone: vnPhoneInputSchema,
  password: userPasswordSchema,
  role: z.nativeEnum(UserRole).default(UserRole.STAFF),
  isActive: z.boolean().optional().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  username: usernameSchema.optional(),
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(120).optional(),
  phone: vnPhoneInputSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetUserPasswordSchema = z.object({
  password: userPasswordSchema,
});

export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
