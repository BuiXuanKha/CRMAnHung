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

/** ADMIN directory — GET /users (lọc NV trên list sổ đỏ). */
export const userDirectoryItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean().optional(),
});

export type UserDirectoryItem = z.infer<typeof userDirectoryItemSchema>;
