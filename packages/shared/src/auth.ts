import { z } from 'zod';
import { UserRole } from './enums.js';
import { digitsFromPhoneRaw } from './vn-phone.js';

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
  /** SĐT NV — hiện liên hệ trên trang khách khi NV đã login. */
  phone: z.string().trim().min(1).max(20).optional(),
  /** CDN avatar; trống = chữ tắt trên header / list. */
  avatarUrl: z.string().url().nullable().optional(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: authUserSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const refreshTokenSchema = z.object({
  /** Optional for browser CRM (HttpOnly cookie). Required for extension body refresh. */
  refreshToken: z.string().min(1).optional(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

const vnPhoneSchema = z
  .string()
  .trim()
  .regex(/^0\d{9}$/, 'SĐT phải gồm 10 số, bắt đầu bằng 0');

const vnPhoneInputSchema = z
  .string()
  .trim()
  .transform((v) => digitsFromPhoneRaw(v))
  .pipe(vnPhoneSchema);

const usernameSchema = z
  .string()
  .trim()
  .min(2, 'Tên đăng nhập tối thiểu 2 ký tự')
  .max(40, 'Tên đăng nhập tối đa 40 ký tự')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Chỉ dùng chữ, số, dấu chấm, gạch ngang, gạch dưới');

/** Create / reset password — 6–18 chars, at least one letter + one digit. Login stays free-form. */
export const USER_PASSWORD_HINT =
  '6–18 ký tự, có chữ và số (vd. abc123)';

export const userPasswordSchema = z
  .string()
  .min(6, 'Mật khẩu tối thiểu 6 ký tự')
  .max(18, 'Mật khẩu tối đa 18 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu phải có ít nhất một chữ cái')
  .regex(/\d/, 'Mật khẩu phải có ít nhất một chữ số');

export function isValidUserPassword(password: string): boolean {
  return userPasswordSchema.safeParse(password).success;
}

/** ADMIN directory — GET /users (lọc NV trên list sổ đỏ). */
export const userDirectoryItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().url().nullable().optional(),
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
  /** When sent, must be a full VN mobile — admin may change phone, not clear it. */
  phone: vnPhoneInputSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetUserPasswordSchema = z.object({
  password: userPasswordSchema,
});

export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;

/** Self-service — avatar → Đổi mật khẩu. */
export const changeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại.'),
    newPassword: userPasswordSchema,
  })
  .superRefine((data, ctx) => {
    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
        path: ['newPassword'],
      });
    }
  });

export type ChangeOwnPasswordInput = z.infer<typeof changeOwnPasswordSchema>;
