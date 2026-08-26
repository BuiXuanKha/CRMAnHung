/**
 * Public web content — admin dashboard + listings/posts.
 * Guest reads published only. ADMIN publishes. See docs/domains/public-content.md.
 */
import { z } from 'zod';
import { LodatKind, PublicPostCategory, PublicPostStatus } from './enums.js';

export const publicListingPriceModeSchema = z.enum(['AMOUNT', 'CONTACT']);

export type PublicListingPriceMode = z.infer<typeof publicListingPriceModeSchema>;

export const publicWebLotRowSchema = z.object({
  id: z.string(),
  lodatId: z.string(),
  slug: z.string(),
  title: z.string(),
  location: z.string(),
  coverImageUrl: z.string().nullable(),
  /** Hiện trên web khách */
  isPublished: z.boolean(),
  priceMode: publicListingPriceModeSchema,
  priceLabel: z.string().nullable(),
  /** Copy public đã duyệt — overlay list/preview */
  excerpt: z.string().optional(),
});

export type PublicWebLotRow = z.infer<typeof publicWebLotRowSchema>;

/** Lô CRM đang Mở bán — list giữa `/dashboard/lo-dat` + preview phải. */
export const publicWebStaffLotRowSchema = publicWebLotRowSchema.extend({
  staffName: z.string(),
  kind: z.nativeEnum(LodatKind),
  areaM2: z.number().nullable(),
  frontageM: z.number().nullable(),
  direction: z.string().nullable(),
  excerpt: z.string(),
  /** Giá CRM — lọc khoảng giá trên `/dashboard/lo-dat`; không hiện cho khách */
  priceVnd: z.union([z.number(), z.string()]).nullable(),
});

export type PublicWebStaffLotRow = z.infer<typeof publicWebStaffLotRowSchema>;

export const publicWebPostRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: z.nativeEnum(PublicPostCategory),
  status: z.nativeEnum(PublicPostStatus),
});

export type PublicWebPostRow = z.infer<typeof publicWebPostRowSchema>;

export const publicWebDashboardSchema = z.object({
  publishedLotCount: z.number().int().nonnegative(),
  pendingLotCount: z.number().int().nonnegative(),
  publishedPostCount: z.number().int().nonnegative(),
  draftPostCount: z.number().int().nonnegative(),
  recentLots: z.array(publicWebLotRowSchema),
  recentPosts: z.array(publicWebPostRowSchema),
});

export type PublicWebDashboard = z.infer<typeof publicWebDashboardSchema>;

export const setPublicLotPublishedSchema = z.object({
  isPublished: z.boolean(),
});

export type SetPublicLotPublishedInput = z.infer<typeof setPublicLotPublishedSchema>;

export const setPublicPostStatusSchema = z.object({
  status: z.nativeEnum(PublicPostStatus),
});

export type SetPublicPostStatusInput = z.infer<typeof setPublicPostStatusSchema>;

export const createPublicPostInputSchema = z.object({
  title: z.string().trim().min(1, 'Nhập tiêu đề bài viết'),
  category: z.nativeEnum(PublicPostCategory),
  status: z.nativeEnum(PublicPostStatus),
});

export type CreatePublicPostInput = z.infer<typeof createPublicPostInputSchema>;

export const updatePublicListingDraftSchema = z
  .object({
    title: z.string().trim().min(1, 'Nhập tiêu đề bài đăng').max(160, 'Tiêu đề tối đa 160 ký tự'),
    location: z.string().trim().max(240, 'Địa chỉ quá dài'),
    priceMode: publicListingPriceModeSchema,
    priceLabel: z.string().trim().max(80, 'Giá công khai quá dài').nullable(),
    excerpt: z
      .string()
      .trim()
      .min(1, 'Nhập mô tả công khai')
      .max(2000, 'Mô tả tối đa 2000 ký tự'),
  })
  .superRefine((data, ctx) => {
    if (data.priceMode === 'AMOUNT' && !data.priceLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nhập giá công khai hoặc chọn Liên hệ',
        path: ['priceLabel'],
      });
    }
  });

export type UpdatePublicListingDraftInput = z.infer<typeof updatePublicListingDraftSchema>;
