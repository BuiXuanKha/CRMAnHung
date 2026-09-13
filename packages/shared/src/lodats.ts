/**
 * Lodats contract — list + detail + gallery + same-ward + transaction history
 *
 * `status` trên list = trạng thái **rao bán** (Mở bán / Dừng bán / Không bán).
 * Tạo lô mặc định = Không bán. Đặt cọc / đã bán thuộc giao dịch P3.
 */
import { z } from 'zod';
import {
  LodatKind,
  LodatSaleStatus,
  TransactionStatus,
  TransactionType,
} from './enums.js';
import { customerFacebookSchema } from './customers.js';

export const lodatListingStatusSchema = z.enum([
  LodatSaleStatus.DANG_BAN,
  LodatSaleStatus.TAM_DUNG,
  LodatSaleStatus.KHONG_BAN,
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
  /** NV tạo / đang rao — dashboard admin */
  createdByEmployeeName: z.string().nullable().optional(),
  /**
   * Đã soạn bài web (`PublicLotListing.bodyHtml` không rỗng).
   * Cột **Web** trên `/lo-dat` + `/lo-dat` — hangtag Đã soạn / Chưa soạn.
   */
  hasWebBody: z.boolean().default(false),
  /** CRM đổi sau lần lưu bài web — icon đỏ (tuỳ chọn hiển thị). */
  needsWebUpdate: z.boolean().default(false),
  /** Chi tiết thuộc tính CRM đổi (cũ → mới) khi needsWebUpdate. */
  needsWebUpdateChanges: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        from: z.string(),
        to: z.string(),
      }),
    )
    .default([]),
  updatedAt: z.string(),
});

export type LodatListItem = z.infer<typeof lodatListItemSchema>;

export const LODAT_LIST_PAGE_SIZE = 50;
export const LODAT_LIST_MAX_PAGE_SIZE = 200;

/** Khoảng giá bước 500tr (§12.1.2) — dùng chung lọc cột + mobile. */
export const lodatPriceBracketSchema = z.enum([
  'no_price',
  'lt_500m',
  '500m_1b',
  '1b_15b',
  '15b_2b',
  '2b_25b',
  '25b_3b',
  'gt_3b',
]);

export type LodatPriceBracket = z.infer<typeof lodatPriceBracketSchema>;

export const lodatAreaBracketSchema = z.enum(['1_100', '100_200', 'gt_200']);

export type LodatAreaBracket = z.infer<typeof lodatAreaBracketSchema>;

export const lodatHasFilterSchema = z.enum(['has', 'empty']);

export type LodatHasFilter = z.infer<typeof lodatHasFilterSchema>;

/** Lọc cột trạng thái: Tất cả · đúng · không đúng. */
export const lodatStatusColFilterSchema = z.enum(['all', 'yes', 'no']);

export type LodatStatusColFilter = z.infer<typeof lodatStatusColFilterSchema>;

export const lodatListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  status: lodatListingStatusSchema.optional(),
  /**
   * Tập trạng thái map active được giữ (AND từ 3 cột lọc).
   * Khi có `statusIn`, bỏ qua `status` / `includePaused` / `pausedOnly`
   * trừ khi ô tìm `@` / `@@` ghi đè ở client.
   */
  statusIn: z.array(lodatListingStatusSchema).max(3).optional(),
  kind: z.nativeEnum(LodatKind).optional(),
  includePaused: z.boolean().optional(),
  pausedOnly: z.boolean().optional(),
  /** Lọc cột — chạy trên API để phân trang đúng (§12.1.2) */
  priceBracket: lodatPriceBracketSchema.optional(),
  areaBracket: lodatAreaBracketSchema.optional(),
  direction: z.string().trim().max(40).optional(),
  photo: lodatHasFilterSchema.optional(),
  addressFilter: lodatHasFilterSchema.optional(),
  /** Lọc cột Web: đã soạn bodyHtml / chưa. */
  webBody: lodatHasFilterSchema.optional(),
  limit: z.coerce.number().int().min(1).max(LODAT_LIST_MAX_PAGE_SIZE).optional(),
  offset: z.coerce.number().int().min(0).optional(),
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
  /** Ẩn trên hồ sơ khách — FAB Messenger không hiện. */
  isHidden: z.boolean().default(false),
  phones: z.array(
    z.object({
      phone: z.string(),
      label: z.string().nullable().optional(),
    }),
  ),
  /** Meta FB để FAB «Mở Messenger» (cùng menu list khách mobile). */
  facebook: customerFacebookSchema.nullable().optional(),
});

export type LodatOwner = z.infer<typeof lodatOwnerSchema>;

/** Một dòng lịch sử chủ (mọi map của lô). */
export const lodatOwnerHistoryItemSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  fullName: z.string(),
  isActive: z.boolean(),
  status: z.string(),
  priceVnd: z.union([z.number(), z.string()]).nullable().optional(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
});

export type LodatOwnerHistoryItem = z.infer<typeof lodatOwnerHistoryItemSchema>;

/** Tóm tắt GD trên chi tiết lô (lodats.md §12.3.5). */
export const lodatTransactionHistoryItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  type: z.nativeEnum(TransactionType),
  status: z.nativeEnum(TransactionStatus),
  salePriceVnd: z.union([z.number(), z.string()]).nullable().optional(),
  sellerNames: z.array(z.string()),
  buyerNames: z.array(z.string()),
  createdAt: z.string(),
});

export type LodatTransactionHistoryItem = z.infer<
  typeof lodatTransactionHistoryItemSchema
>;

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
  /**
   * `LodatImage.id` đang làm ảnh bìa (Xem nhanh khi Lưu).
   * null = fallback ảnh đầu gallery (ảnh dự án nếu có).
   */
  coverImageId: z.string().nullable().optional(),
  wardName: z.string().nullable().optional(),
  owner: lodatOwnerSchema.nullable().optional(),
  canEditSpecs: z.boolean().default(false),
  canEditMap: z.boolean().default(false),
  /** Chỉ NV giữ luồng — Admin không đổi chủ (owner 2026-09-05). */
  canChangeOwner: z.boolean().default(false),
  /** Thêm/gỡ `LodatImage` (kể lô dự án). Ảnh `AddressImage` PROJECT chỉ xem. */
  canEditImages: z.boolean().default(false),
  ownerHistory: z.array(lodatOwnerHistoryItemSchema).default([]),
  transactionHistory: z.array(lodatTransactionHistoryItemSchema).default([]),
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

export const updateLodatSchema = z
  .object({
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
    /** Ảnh đã upload tạm trên form sửa — gắn khi Lưu thành công */
    tempImageIds: z.array(z.string()).max(LODAT_MAX_UPLOAD_IMAGES).optional(),
    /**
     * Ảnh bìa = thumb đang chọn ở Xem nhanh.
     * `coverImageId` = `LodatImage` đã gắn; `coverTempImageId` = temp vừa upload;
     * `null`/`coverImageId: null` = bỏ chọn → fallback gallery đầu.
     */
    coverImageId: z.string().nullable().optional(),
    coverTempImageId: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if ((v.tempImageIds?.length ?? 0) > LODAT_MAX_UPLOAD_IMAGES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tempImageIds'],
        message: `Tối đa ${LODAT_MAX_UPLOAD_IMAGES} ảnh tạm.`,
      });
    }
    if (v.coverTempImageId && v.tempImageIds && !v.tempImageIds.includes(v.coverTempImageId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coverTempImageId'],
        message: 'Ảnh bìa tạm phải nằm trong tempImageIds.',
      });
    }
    if (v.coverImageId && v.coverTempImageId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coverImageId'],
        message: 'Chỉ gửi một trong coverImageId / coverTempImageId.',
      });
    }
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
    status: lodatListingStatusSchema.default(LodatSaleStatus.KHONG_BAN),
    priceVnd: z.union([z.number().nonnegative(), z.string()]).nullable().optional(),
    priceNote: z.string().trim().max(200).nullable().optional(),
    brokerFeeNote: z.string().trim().max(200).nullable().optional(),
    mapNote: z.string().trim().max(4000).nullable().optional(),
    /** Ảnh chat Messenger reuse cho lô dân (CRM cũ «ảnh từ hội thoại») */
    chatImageIds: z.array(z.string()).max(LODAT_MAX_UPLOAD_IMAGES).optional(),
    /** Ảnh đã upload tạm (`POST /lodats/temp-images`) — gắn khi tạo lô thành công */
    tempImageIds: z.array(z.string()).max(LODAT_MAX_UPLOAD_IMAGES).optional(),
    /** Ảnh bìa = thumb đang chọn (temp hoặc chat). Thiếu = ảnh đầu sau khi gắn. */
    coverTempImageId: z.string().optional(),
    coverChatImageId: z.string().optional(),
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
    const chatN = v.chatImageIds?.length ?? 0;
    const tempN = v.tempImageIds?.length ?? 0;
    if (chatN + tempN > LODAT_MAX_UPLOAD_IMAGES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tempImageIds'],
        message: `Tối đa ${LODAT_MAX_UPLOAD_IMAGES} ảnh (chat + file).`,
      });
    }
    if (v.coverTempImageId && v.coverChatImageId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coverTempImageId'],
        message: 'Chỉ gửi một trong coverTempImageId / coverChatImageId.',
      });
    }
    if (v.coverTempImageId && !(v.tempImageIds ?? []).includes(v.coverTempImageId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coverTempImageId'],
        message: 'Ảnh bìa tạm phải nằm trong tempImageIds.',
      });
    }
    if (v.coverChatImageId && !(v.chatImageIds ?? []).includes(v.coverChatImageId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coverChatImageId'],
        message: 'Ảnh bìa chat phải nằm trong chatImageIds.',
      });
    }
  });

export type CreateLodatInput = z.infer<typeof createLodatSchema>;

/** Upload ảnh tạm trước khi tạo lô (multipart `file` + `sessionId`). */
export const lodatTempImageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  objectKey: z.string(),
  url: z.string(),
  createdAt: z.string(),
});

export type LodatTempImage = z.infer<typeof lodatTempImageSchema>;

export const uploadLodatTempImageMetaSchema = z.object({
  sessionId: z
    .string()
    .trim()
    .min(8, 'Thiếu session upload.')
    .max(80, 'Session upload quá dài.'),
});

export type UploadLodatTempImageMeta = z.infer<typeof uploadLodatTempImageMetaSchema>;

/** Đổi chủ trên trang sửa (§12.4.4) — map mới nhận giá/trạng thái từ form. */
export const changeLodatOwnerSchema = z.object({
  customerId: z.string().trim().min(1, 'Chọn khách làm chủ mới.'),
  status: lodatListingStatusSchema.optional(),
  priceVnd: z.union([z.number().nonnegative(), z.string()]).nullable().optional(),
  priceNote: z.string().trim().max(200).nullable().optional(),
  brokerFeeNote: z.string().trim().max(200).nullable().optional(),
  mapNote: z.string().trim().max(4000).nullable().optional(),
});

export type ChangeLodatOwnerInput = z.infer<typeof changeLodatOwnerSchema>;

export const lodatWebUpdateChangeSchema = z.object({
  key: z.string(),
  label: z.string(),
  from: z.string(),
  to: z.string(),
});

export type LodatWebUpdateChange = z.infer<typeof lodatWebUpdateChangeSchema>;

/** Dòng hiển thị: «Diện tích thay đổi: 90m² thành 100m²». */
export function formatLodatWebUpdateChangeLine(change: LodatWebUpdateChange): string {
  return `${change.label} thay đổi: ${change.from} thành ${change.to}`;
}

/**
 * Alert icon đỏ: chỉ liệt kê các dòng đổi (cũ → mới).
 * Không có chi tiết (dữ liệu cũ) → nhắc Soạn/Lưu chung.
 */
export function formatLodatWebUpdateChangesMessage(
  changes: LodatWebUpdateChange[] | undefined | null,
): string {
  const lines = (changes ?? [])
    .filter((c) => c.from !== c.to)
    .map(formatLodatWebUpdateChangeLine);
  if (!lines.length) {
    return [
      'Lô đất trên CRM đã được cập nhật sau lần lưu bài đăng web.',
      '',
      'Vào Soạn bài đăng và Lưu lại để cập nhật nội dung trên web khách.',
    ].join('\n');
  }
  return lines.join('\n');
}

/** Gộp theo `key`: giữ `from` lần đầu, cập nhật `to` lần sau. */
export function mergeLodatWebUpdateChanges(
  existing: LodatWebUpdateChange[] | undefined | null,
  next: LodatWebUpdateChange[] | undefined | null,
): LodatWebUpdateChange[] {
  const byKey = new Map<string, LodatWebUpdateChange>();
  for (const row of existing ?? []) {
    if (!row?.key) continue;
    byKey.set(row.key, {
      key: row.key,
      label: row.label || row.key,
      from: row.from ?? '—',
      to: row.to ?? '—',
    });
  }
  for (const row of next ?? []) {
    if (!row?.key || row.from === row.to) continue;
    const prev = byKey.get(row.key);
    if (!prev) {
      byKey.set(row.key, {
        key: row.key,
        label: row.label || row.key,
        from: row.from,
        to: row.to,
      });
      continue;
    }
    byKey.set(row.key, {
      key: row.key,
      label: row.label || prev.label,
      from: prev.from,
      to: row.to,
    });
  }
  return [...byKey.values()].filter((c) => c.from !== c.to);
}

/** Parse JSON Prisma / API → mảng change hợp lệ. */
export function parseLodatWebUpdateChanges(raw: unknown): LodatWebUpdateChange[] {
  if (!Array.isArray(raw)) return [];
  const out: LodatWebUpdateChange[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const key = typeof row.key === 'string' ? row.key.trim() : '';
    if (!key) continue;
    const label =
      typeof row.label === 'string' && row.label.trim() ? row.label.trim() : key;
    const from = typeof row.from === 'string' ? row.from : '—';
    const to = typeof row.to === 'string' ? row.to : '—';
    out.push({ key, label, from, to });
  }
  return out;
}

export function formatLodatWebUpdateArea(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n.toLocaleString('vi-VN')}m²`;
}

export function formatLodatWebUpdateMeters(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n.toLocaleString('vi-VN')}m`;
}

export function formatLodatWebUpdatePrice(n: number | string | null | undefined): string {
  if (n == null || n === '') return '—';
  const v = typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(v)) return '—';
  return `${v.toLocaleString('vi-VN')} đ`;
}

export function formatLodatWebUpdateText(value: string | null | undefined): string {
  const t = value?.trim();
  return t ? t : '—';
}
