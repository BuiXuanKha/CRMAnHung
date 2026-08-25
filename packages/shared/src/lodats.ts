/**
 * Lodats contract — list + detail + gallery images + same-ward
 *
 * `status` trên list = trạng thái **rao bán** (Mở bán / Tạm dừng),
 * không phải đã bán / đặt cọc (giao dịch P3).
 */
import { z } from 'zod';
import { LodatKind, LodatSaleStatus } from './enums.js';

export const lodatListingStatusSchema = z.enum([
  LodatSaleStatus.DANG_BAN,
  LodatSaleStatus.TAM_DUNG,
]);

export type LodatListingStatus = z.infer<typeof lodatListingStatusSchema>;

export const lodatListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  address: z.string().nullable().optional(),
  areaM2: z.number().nullable().optional(),
  frontageM: z.number().nullable().optional(),
  direction: z.string().nullable().optional(),
  /** Giá trên map — DB BigInt; JSON number hoặc string */
  priceVnd: z.union([z.number(), z.string()]).nullable().optional(),
  priceNote: z.string().nullable().optional(),
  brokerFeeNote: z.string().nullable().optional(),
  commissionPercent: z.number().nullable().optional(),
  kind: z.nativeEnum(LodatKind),
  status: lodatListingStatusSchema,
  coverImageUrl: z.string().nullable().optional(),
  extraPhotoCount: z.number().int().nonnegative().default(0),
  customerHint: z.string().nullable().optional(),
  /** Có projectLotId = lô dự án (trỏ kho); không = đất dân */
  projectLotId: z.string().nullable().optional(),
  updatedAt: z.string(),
});

export type LodatListItem = z.infer<typeof lodatListItemSchema>;

export const lodatListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  status: lodatListingStatusSchema.optional(),
  kind: z.nativeEnum(LodatKind).optional(),
  includePaused: z.boolean().optional(),
  pausedOnly: z.boolean().optional(),
});

export type LodatListQuery = z.infer<typeof lodatListQuerySchema>;

export const lodatListResponseSchema = z.object({
  items: z.array(lodatListItemSchema),
  total: z.number().int().nonnegative(),
});

export type LodatListResponse = z.infer<typeof lodatListResponseSchema>;

export const updateLodatSaleStatusSchema = z.object({
  status: lodatListingStatusSchema,
});

export type UpdateLodatSaleStatusInput = z.infer<typeof updateLodatSaleStatusSchema>;

/** Chủ hiện tại trên chi tiết (map active). */
export const lodatOwnerSchema = z.object({
  customerId: z.string(),
  fullName: z.string(),
  phones: z.array(
    z.object({
      phone: z.string(),
      label: z.string().nullable().optional(),
    }),
  ),
});

export type LodatOwner = z.infer<typeof lodatOwnerSchema>;

/**
 * Ảnh trên chi tiết / gallery.
 * `source: address` = ảnh dự án chung (không lưu xoay từ NV).
 * `source: lodat` = ảnh lô — `id` dùng PATCH rotation.
 */
export const lodatImageSchema = z.object({
  id: z.string().nullable(),
  url: z.string(),
  rotationDeg: z.number().int().default(0),
  source: z.enum(['lodat', 'address']),
});

export type LodatImage = z.infer<typeof lodatImageSchema>;

/** Chi tiết `/lo-dat/[id]` — mở rộng list item. */
export const lodatDetailSchema = lodatListItemSchema.extend({
  note: z.string().nullable().optional(),
  /** Địa chỉ dân (REGULAR); PROJECT = null — địa chỉ qua kho */
  addressId: z.string().nullable().optional(),
  /** Ghi chú trên map chủ active */
  mapNote: z.string().nullable().optional(),
  /** @deprecated dùng `images` — giữ để tương thích tạm */
  imageUrls: z.array(z.string()).default([]),
  images: z.array(lodatImageSchema).default([]),
  wardName: z.string().nullable().optional(),
  owner: lodatOwnerSchema.nullable().optional(),
  canEditSpecs: z.boolean().default(false),
  canEditMap: z.boolean().default(false),
  canEditImages: z.boolean().default(false),
});

export type LodatDetail = z.infer<typeof lodatDetailSchema>;

export const LODAT_DIRECTION_OPTIONS = [
  'Đông',
  'Tây',
  'Nam',
  'Bắc',
  'Đông Bắc',
  'Đông Nam',
  'Tây Bắc',
  'Tây Nam',
  'Mặt nước',
  'Khác',
] as const;

export const LODAT_PRICE_NOTE_CHIPS = ['Thương lượng', 'Cứng giá', 'Chưa chi tiết'] as const;

export const LODAT_BROKER_FEE_CHIPS = ['1%', '2%', 'Chưa trao đổi'] as const;

export const LODAT_MAX_UPLOAD_IMAGES = 5;

export const updateLodatSchema = z.object({
  title: z.string().trim().min(1, 'Cần nhập tiêu đề lô đất.').max(200).optional(),
  addressId: z.string().nullable().optional(),
  areaM2: z.number().nonnegative().nullable().optional(),
  frontageM: z.number().nonnegative().nullable().optional(),
  direction: z.string().trim().max(40).nullable().optional(),
  note: z.string().trim().max(4000).nullable().optional(),
  kind: z.nativeEnum(LodatKind).optional(),
  priceVnd: z.union([z.number().nonnegative(), z.string()]).nullable().optional(),
  priceNote: z.string().trim().max(200).nullable().optional(),
  brokerFeeNote: z.string().trim().max(200).nullable().optional(),
  mapNote: z.string().trim().max(4000).nullable().optional(),
  status: lodatListingStatusSchema.optional(),
});

export type UpdateLodatInput = z.infer<typeof updateLodatSchema>;

export const updateLodatImageRotationSchema = z.object({
  rotationDeg: z
    .number({ message: 'Góc xoay không hợp lệ.' })
    .int()
    .refine((n) => n % 90 === 0, { message: 'Góc xoay phải là bội số của 90°.' }),
});

export type UpdateLodatImageRotationInput = z.infer<typeof updateLodatImageRotationSchema>;

export const lodatSameWardResponseSchema = z.object({
  wardName: z.string().nullable(),
  items: z.array(lodatListItemSchema),
  total: z.number().int().nonnegative(),
});

export type LodatSameWardResponse = z.infer<typeof lodatSameWardResponseSchema>;

/** Một lô trong kho dự án — picker form tạo lô (lodats.md §12.5). */
export const projectLotOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  areaM2: z.number().nullable().optional(),
  frontageM: z.number().nullable().optional(),
  direction: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  /** NV hiện tại đã có luồng active trên lô kho này */
  takenByMe: z.boolean().default(false),
});

export type ProjectLotOption = z.infer<typeof projectLotOptionSchema>;

export const projectLotOptionsResponseSchema = z.object({
  addressId: z.string(),
  items: z.array(projectLotOptionSchema),
});

export type ProjectLotOptionsResponse = z.infer<typeof projectLotOptionsResponseSchema>;

/**
 * Tạo lô từ khách (lodats.md §12.5) — một trong hai:
 * - Đất dân: `addressId` (REGULAR) + `title` bắt buộc, specs tuỳ chọn
 * - Lô dự án: `projectLotId` (kho) — không specs, không title
 * Khách `customerId` = chủ gắn ngay (map active).
 */
export const createLodatSchema = z
  .object({
    customerId: z.string().min(1, 'Thiếu khách hàng.'),
    addressId: z.string().nullable().optional(),
    projectLotId: z.string().nullable().optional(),
    title: z.string().trim().max(200).nullable().optional(),
    areaM2: z.number().nonnegative().nullable().optional(),
    frontageM: z.number().nonnegative().nullable().optional(),
    direction: z.string().trim().max(40).nullable().optional(),
    kind: z.nativeEnum(LodatKind).optional(),
    note: z.string().trim().max(4000).nullable().optional(),
    status: lodatListingStatusSchema.optional(),
    priceVnd: z.union([z.number().nonnegative(), z.string()]).nullable().optional(),
    priceNote: z.string().trim().max(200).nullable().optional(),
    brokerFeeNote: z.string().trim().max(200).nullable().optional(),
    mapNote: z.string().trim().max(4000).nullable().optional(),
    /** Ảnh chat Messenger reuse cho lô dân (CRM cũ «ảnh từ hội thoại») */
    chatImageIds: z.array(z.string()).max(LODAT_MAX_UPLOAD_IMAGES).optional(),
  })
  .superRefine((v, ctx) => {
    const hasAddress = Boolean(v.addressId);
    const hasLot = Boolean(v.projectLotId);
    if (hasAddress === hasLot) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chọn địa chỉ đất dân hoặc lô kho dự án (một trong hai).',
      });
      return;
    }
    if (hasAddress && !v.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: 'Cần nhập tiêu đề lô đất.',
      });
    }
  });

export type CreateLodatInput = z.infer<typeof createLodatSchema>;
