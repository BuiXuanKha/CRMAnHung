/**
 * Addresses + admin-units contract — P2
 * Sổ địa chỉ dùng chung; CRUD chỉ ADMIN. STAFF đọc để chọn khi tạo lô.
 */
import { z } from 'zod';
import { AddressKind } from './enums.js';

export const adminUnitItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable().optional(),
  isHidden: z.boolean().default(false),
});

export type AdminUnitItem = z.infer<typeof adminUnitItemSchema>;

export const adminUnitListResponseSchema = z.object({
  items: z.array(adminUnitItemSchema),
});

export type AdminUnitListResponse = z.infer<typeof adminUnitListResponseSchema>;

export const createAdminUnitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nhập tên.')
    .max(120, 'Tên tối đa 120 ký tự.'),
  parentId: z.string().optional(),
});

export type CreateAdminUnitInput = z.infer<typeof createAdminUnitSchema>;

export const addressImageSchema = z.object({
  id: z.string(),
  objectKey: z.string(),
  url: z.string().nullable().optional(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
});

export type AddressImageItem = z.infer<typeof addressImageSchema>;

export const addressListItemSchema = z.object({
  id: z.string(),
  kind: z.nativeEnum(AddressKind),
  detail: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  provinceId: z.string(),
  districtId: z.string(),
  wardId: z.string(),
  province: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  ward: z.string().nullable().optional(),
  isHidden: z.boolean(),
  lodatCount: z.number().int().nonnegative().default(0),
  imageCount: z.number().int().nonnegative().default(0),
  coverImageUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AddressListItem = z.infer<typeof addressListItemSchema>;

export const addressListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  kind: z.nativeEnum(AddressKind).optional(),
  includeHidden: z.boolean().optional(),
  /** Chỉ dự án chưa có lô kho — dropdown import Excel (CRM cũ `withoutLodats`). */
  withoutLodats: z.boolean().optional(),
});

export type AddressListQuery = z.infer<typeof addressListQuerySchema>;

export const addressListResponseSchema = z.object({
  items: z.array(addressListItemSchema),
  total: z.number().int().nonnegative(),
});

export type AddressListResponse = z.infer<typeof addressListResponseSchema>;

export const createAddressSchema = z
  .object({
    kind: z.nativeEnum(AddressKind),
    wardId: z.string().min(1, 'Chọn Xã / Phường.'),
    detail: z.string().trim().max(200).optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.kind === AddressKind.PROJECT && !String(val.detail || '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nhập Tên dự án.',
        path: ['detail'],
      });
    }
  });

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

export const updateAddressSchema = z
  .object({
    kind: z.nativeEnum(AddressKind).optional(),
    wardId: z.string().min(1).optional(),
    detail: z.string().trim().max(200).optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
    isHidden: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.kind === AddressKind.PROJECT && val.detail !== undefined) {
      if (!String(val.detail || '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nhập Tên dự án.',
          path: ['detail'],
        });
      }
    }
  });

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

export const addressDetailSchema = addressListItemSchema.extend({
  images: z.array(addressImageSchema).default([]),
});

export type AddressDetail = z.infer<typeof addressDetailSchema>;

/** Label gọn: «Detail · Ward, District, Province» hoặc chỉ chuỗi hành chính. */
export function formatAddressLabel(item: {
  kind?: AddressKind | string | null;
  detail?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  lodatCount?: number | null;
}): string {
  const right = [item.ward, item.district, item.province].filter(Boolean).join(', ');
  const detail = String(item.detail || '').trim();
  let left = detail;
  if (item.kind === AddressKind.PROJECT || item.kind === 'PROJECT') {
    const count = Number(item.lodatCount) || 0;
    left = detail ? `${detail} (${count} lô)` : `(${count} lô)`;
  }
  if (left && right) return `${left} · ${right}`;
  return left || right || '—';
}

/** Label dropdown import Excel — không gắn «(N lô)» (CRM cũ: detail · ward · district · province). */
export function formatProjectImportLabel(item: {
  detail?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
}): string {
  const tail = [item.ward, item.district, item.province].filter(Boolean).join(' · ');
  const detail = String(item.detail || '').trim();
  return detail ? `${detail} · ${tail}` : tail;
}

/** Giới hạn POST /addresses/:id/lodats/import — khớp CRM cũ. */
export const PROJECT_LOT_IMPORT_MAX_ROWS = 2500;

/** 5 cột chuẩn file Excel import lô kho dự án (đúng thứ tự file mẫu). */
export const PROJECT_LOT_EXCEL_COLUMNS = [
  { field: 'title', label: 'Tên lô đất', required: true },
  { field: 'areaM2', label: 'Diện tích', required: false },
  { field: 'frontageM', label: 'Mặt tiền', required: false },
  { field: 'direction', label: 'Hướng', required: false },
  { field: 'note', label: 'Ghi chú', required: false },
] as const;

export const importProjectLotRowSchema = z.object({
  title: z.string().trim().min(1, 'Thiếu tên lô đất.').max(200),
  areaM2: z.number().nonnegative().nullable().optional(),
  frontageM: z.number().nonnegative().nullable().optional(),
  direction: z.string().trim().max(40).nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
});

export type ImportProjectLotRow = z.infer<typeof importProjectLotRowSchema>;

export const importProjectLotsInputSchema = z.object({
  rows: z
    .array(importProjectLotRowSchema)
    .min(1, 'Danh sách lô import trống.')
    .max(PROJECT_LOT_IMPORT_MAX_ROWS, `Tối đa ${PROJECT_LOT_IMPORT_MAX_ROWS} dòng mỗi lần import.`),
});

export type ImportProjectLotsInput = z.infer<typeof importProjectLotsInputSchema>;

export const importProjectLotResultItemSchema = z.object({
  rowIndex: z.number().int().positive(),
  ok: z.boolean(),
  id: z.string().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
});

export const importProjectLotsResponseSchema = z.object({
  ok: z.literal(true),
  addressId: z.string(),
  total: z.number().int().nonnegative(),
  created: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  results: z.array(importProjectLotResultItemSchema),
});

export type ImportProjectLotsResponse = z.infer<typeof importProjectLotsResponseSchema>;
