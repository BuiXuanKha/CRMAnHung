/**
 * Public web content — dashboard listings/posts.
 * Guest reads published only. STAFF publishes own lots; ADMIN all lots + CMS posts.
 * See docs/domains/public-content.md.
 *
 * Non-breaking: `metaDescription` is optional on staff overlay + guest listing.
 * SERP snippet falls back to `excerpt`. Editor modal may fill it later.
 */
import { z } from 'zod';
import { AddressKind, LodatKind, LodatSaleStatus, PublicPostCategory, PublicPostStatus } from './enums.js';

/** Google snippet length — clip excerpt / metaDescription to this. */
export const META_DESCRIPTION_MAX = 160;

/** Stored post excerpt max (schema + auto-generate). Lot listings still use listingBodyToExcerpt. */
export const PUBLIC_POST_EXCERPT_MAX = 320;

/**
 * Guest catalog URL prefix on anhungland.com (Nam Sách local SEO).
 */
export const PUBLIC_LISTING_PATH = '/mua-ban-nha-dat-huyen-nam-sach';

/** Short guest lot URL — `/dat/{slug}?share=CODE`. */
export const PUBLIC_LISTING_SHORT_PATH = '/dat';

/** Guest canonical / share origin. Not Nest→Next revalidate loopback (`PUBLIC_WEB_ORIGIN`). */
export const PUBLIC_SITE_ORIGIN = 'https://anhungland.com';

/** Reserved path segment under catalog — hub xã / cấp 4; not a lot slug. */
export const PUBLIC_LISTING_HUB_SEGMENT = 'xa';

/**
 * URL slug from Vietnamese label (ward, project, lot title…).
 * `maxLen <= 0` — no character cap (lot URLs). Hub labels still pass 60.
 */
export function toPublicSlug(label: string, maxLen = 60, emptyFallback = 'muc'): string {
  let slug = label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (maxLen > 0 && slug.length > maxLen) {
    slug = slug.slice(0, maxLen).replace(/-+$/g, '');
  }
  return slug || emptyFallback;
}

function foldSlugText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Address parts not already present in title — avoids repeating thôn/xã in the slug. */
export function listingAddressLeftover(
  title: string,
  location?: string | null,
): string {
  const titleFold = foldSlugText(title);
  const loc = location?.trim() ?? '';
  if (!loc) return '';
  if (titleFold.includes(foldSlugText(loc))) return '';
  return loc
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !titleFold.includes(foldSlugText(p)))
    .join(', ');
}

/** Lot slug must not collide with the hub folder `/xa/…`. */
export function reservePublicLotSlug(slug: string, emptyFallback = 'lo-dat'): string {
  const s = slug.trim() || emptyFallback;
  if (s === PUBLIC_LISTING_HUB_SEGMENT) return `lo-${PUBLIC_LISTING_HUB_SEGMENT}`;
  return s;
}

/**
 * Guest lot URL: title + leftover address (no 80-char cap, no mid-word cut).
 * Stable after create — regenerate only via `lots:regenerate-public-slugs`.
 */
export function toListingPublicSlug(title: string, location?: string | null): string {
  const leftover = listingAddressLeftover(title, location);
  const combined = [title.trim(), leftover].filter(Boolean).join(' ');
  return reservePublicLotSlug(toPublicSlug(combined, 0, 'lo-dat'));
}

/** Stored / submitted post slug max (title 160 → slug typically shorter). */
export const PUBLIC_POST_SLUG_MAX = 200;

/**
 * Guest article URL slug from title — no character cap, no mid-word cut.
 * Same rules as lots (`toPublicSlug(..., 0)`), fallback `bai-viet`.
 */
export function toPublicPostSlug(title: string): string {
  return toPublicSlug(title, 0, 'bai-viet');
}

export function listingCommuneHubPath(communeSlug: string): string {
  return `${PUBLIC_LISTING_PATH}/${PUBLIC_LISTING_HUB_SEGMENT}/${communeSlug}`;
}

export function listingPlaceHubPath(communeSlug: string, placeSlug: string): string {
  return `${listingCommuneHubPath(communeSlug)}/${placeSlug}`;
}

/** Hub kind: xã (cấp 3) hoặc địa chỉ trong xã (cấp 4 — thôn/KĐT/dự án). */
export const publicListingHubKindSchema = z.enum(['commune', 'place']);

export type PublicListingHubKind = z.infer<typeof publicListingHubKindSchema>;

export const publicListingHubSchema = z.object({
  kind: publicListingHubKindSchema,
  /** Hub URL slug. For `place`, unique within parent commune. */
  slug: z.string().min(1),
  label: z.string().min(1),
  /** Parent xã slug — required when `kind === 'place'`. */
  communeSlug: z.string().min(1).optional(),
  communeLabel: z.string().min(1).optional(),
  districtLabel: z.string().nullable().optional(),
  provinceLabel: z.string().nullable().optional(),
  listingCount: z.number().int().nonnegative(),
  updatedAt: z.string().datetime().optional(),
});

export type PublicListingHub = z.infer<typeof publicListingHubSchema>;

export const publicListingHubListResponseSchema = z.object({
  items: z.array(publicListingHubSchema),
});

export type PublicListingHubListResponse = z.infer<typeof publicListingHubListResponseSchema>;

export const publicListingPriceModeSchema = z.enum(['AMOUNT', 'CONTACT']);

export type PublicListingPriceMode = z.infer<typeof publicListingPriceModeSchema>;

export const publicWebLotRowSchema = z.object({
  id: z.string(),
  lodatId: z.string(),
  slug: z.string(),
  title: z.string(),
  /** SEO document title (GPT seoTitle). On-page H1 uses `title` (GPT h1). */
  seoTitle: z.string().trim().max(160).nullable().optional(),
  location: z.string(),
  coverImageUrl: z.string().nullable(),
  /** Hiện trên web khách */
  isPublished: z.boolean(),
  priceMode: publicListingPriceModeSchema,
  priceLabel: z.string().nullable(),
  /** Copy public đã duyệt — overlay list/preview (plain text, SEO) */
  excerpt: z.string().optional(),
  /** HTML mô tả công khai (TipTap). Ảnh trong bài = URL CDN. */
  bodyHtml: z.string().optional(),
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
  /** Optional SERP/OG snippet. Empty → use excerpt. Overlay editor can set later. */
  metaDescription: z.string().trim().max(320).nullable().optional(),
});

export type PublicWebStaffLotRow = z.infer<typeof publicWebStaffLotRowSchema>;

/**
 * Request body shape for external GPT lot-content API.
 * Built from public-safe listing facts — no CRM map VND or customer PII.
 */
export const lotGptLocationSchema = z.object({
  village: z.string(),
  commune: z.string(),
  district: z.string(),
  province: z.string(),
});

export type LotGptLocation = z.infer<typeof lotGptLocationSchema>;

/** Core lot facts for GPT — preview JSON may omit extraDescription until NV nhập. */
export const lotGptRequestBaseSchema = z.object({
  title: z.string(),
  location: lotGptLocationSchema,
  area: z.number().nullable(),
  residentialArea: z.number().nullable(),
  frontage: z.number().nullable(),
  direction: z.string().nullable(),
  /** Public numeric price (VND) when parseable from priceLabel; else null. */
  price: z.number().nullable(),
  /** Human price copy when `price` is null or for GPT wording. */
  priceText: z.string().nullable(),
  /** Extra public fields when available */
  kind: z.string().optional(),
  excerpt: z.string().optional(),
  slug: z.string().optional(),
});

export type LotGptRequestDraft = z.infer<typeof lotGptRequestBaseSchema> & {
  extraDescription?: string;
};

/** Full payload POST to GPT — extraDescription bắt buộc. */
export const lotGptRequestPayloadSchema = lotGptRequestBaseSchema.extend({
  extraDescription: z
    .string()
    .trim()
    .min(1, 'Nhập mô tả thêm để GPT viết bài sinh động hơn.'),
});

export type LotGptRequestPayload = z.infer<typeof lotGptRequestPayloadSchema>;

/** Raw assistant text from POST /admin/public-web/lots/gpt-content */
export const lotGptGenerateResponseSchema = z.object({
  content: z.string(),
});

export type LotGptGenerateResponse = z.infer<typeof lotGptGenerateResponseSchema>;

/** Parsed GPT content — maps to listing editor + Facebook. */
export const lotGptContentResultSchema = z.object({
  seoTitle: z.string(),
  h1: z.string(),
  metaDescription: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  bodyHtml: z.string(),
  facebookPost: z.string(),
});

export type LotGptContentResult = z.infer<typeof lotGptContentResultSchema>;

/** POST /admin/public-web/posts/gpt-content — tên dự án (+ ghi chú tuỳ chọn). */
export const postGptRequestPayloadSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(1, 'Nhập tên dự án')
    .max(160, 'Tên dự án tối đa 160 ký tự'),
  category: z.literal(PublicPostCategory.DU_AN),
  site: z.string().trim().max(80).optional(),
  locale: z.string().trim().max(160).optional(),
  extraNotes: z.string().trim().max(4000).optional(),
});

export type PostGptRequestPayload = z.infer<typeof postGptRequestPayloadSchema>;

export const postGptGenerateResponseSchema = z.object({
  content: z.string(),
});

export type PostGptGenerateResponse = z.infer<typeof postGptGenerateResponseSchema>;

export const postGptContentResultSchema = z.object({
  seoTitle: z.string(),
  h1: z.string(),
  metaDescription: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  bodyHtml: z.string(),
  facebookPost: z.string(),
  locationLabel: z.string().optional(),
});

export type PostGptContentResult = z.infer<typeof postGptContentResultSchema>;

/**
 * Published listing as guests and search engines see it.
 * Never include CRM VND, commission, owner notes, or customer PII.
 */
export const publicGuestListingSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  seoTitle: z.string().trim().max(160).nullable().optional(),
  location: z.string(),
  priceLabel: z.string().nullable(),
  excerpt: z.string(),
  /** TipTap HTML — chi tiết trang khách (Phase 2+). */
  bodyHtml: z.string().optional(),
  coverImageUrl: z.string().nullable(),
  /** Gallery CDN URLs (lodat + project address images). Detail page; cover = first. */
  imageUrls: z.array(z.string().min(1)).optional(),
  metaDescription: z.string().trim().max(320).nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  updatedAt: z.string().datetime().optional(),
  /** Rao bán trên CRM — guest chi tiết vẫn mở khi Tạm dừng / Đã bán. */
  saleStatus: z.nativeEnum(LodatSaleStatus).optional(),
});

export type PublicGuestListing = z.infer<typeof publicGuestListingSchema>;

/** Guest listing card fields — list / hub grid (id optional until catalog row). */
export const publicListingCardSchema = publicGuestListingSchema.extend({
  kindLabel: z.string(),
  areaLabel: z.string().nullable(),
  frontageLabel: z.string().nullable(),
  directionLabel: z.string().nullable(),
  /** Hub xã (cấp 3) — optional until guest API fills from ward. */
  communeSlug: z.string().min(1).nullable().optional(),
  communeLabel: z.string().min(1).nullable().optional(),
  /** Hub cấp 4 trong xã (thôn/KĐT/dự án) — `Address.detail`. Not area m². */
  placeSlug: z.string().min(1).nullable().optional(),
  placeLabel: z.string().min(1).nullable().optional(),
  /** `PROJECT` = lô kho / KĐT; `REGULAR` = đất dân. Guest-safe. */
  addressKind: z.nativeEnum(AddressKind).nullable().optional(),
});

export type PublicListingCard = z.infer<typeof publicListingCardSchema>;

/** Guest catalog card / SEO page — public-safe fields only. */
export const publicCatalogListingSchema = publicListingCardSchema.extend({
  id: z.string(),
});

export type PublicCatalogListing = z.infer<typeof publicCatalogListingSchema>;

export const publicCatalogListResponseSchema = z.object({
  items: z.array(publicCatalogListingSchema),
});

export type PublicCatalogListResponse = z.infer<typeof publicCatalogListResponseSchema>;

/** Guest hub page: meta + published listings in that hub. */
export const publicListingHubDetailSchema = publicListingHubSchema.extend({
  items: z.array(publicListingCardSchema),
});

export type PublicListingHubDetail = z.infer<typeof publicListingHubDetailSchema>;

export function clipMetaDescription(
  text: string,
  max = META_DESCRIPTION_MAX,
): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.length <= max) return t;
  const sliced = t.slice(0, Math.max(1, max - 1));
  const lastSpace = sliced.lastIndexOf(' ');
  const base = lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced;
  return `${base.trim()}…`;
}

export function listingSearchDescription(listing: {
  metaDescription?: string | null;
  excerpt: string;
}): string {
  const custom = listing.metaDescription?.trim();
  return clipMetaDescription(custom || listing.excerpt);
}

function foldHeadline(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** On-page H1 — stored `title` (GPT h1), verbatim. */
export function listingPageH1(listing: { title: string }): string {
  return listing.title.trim();
}

/**
 * Title + leftover address parts not already in the title.
 * Avoids «… tại Nham Cáp tại Nham Cáp, Đồng Lạc, …».
 */
export function listingHeadline(listing: {
  title: string;
  location?: string | null;
}): string {
  const title = listing.title.trim();
  const location = listing.location?.trim() ?? '';
  if (!location) return title;
  const titleFold = foldHeadline(title);
  const locFold = foldHeadline(location);
  if (!locFold || titleFold.includes(locFold)) return title;

  const leftover = location
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !titleFold.includes(foldHeadline(p)));
  if (leftover.length === 0) return title;

  const extra = leftover.join(', ');
  if (/\btại\b/i.test(title)) return `${title}, ${extra}`;
  return `${title} tại ${extra}`;
}

/** Document / OG title — GPT seoTitle when saved; strip brand (layout template adds it). */
export function listingSeoTitle(listing: {
  seoTitle?: string | null;
  title: string;
}): string {
  const raw = listing.seoTitle?.trim() || listing.title.trim();
  return raw.replace(/\s*\|\s*An Hưng Land\s*$/i, '').trim() || listing.title.trim();
}

/**
 * Parse public area copy (`105 m²`, `70,8 m²`, `1.000 m²`, `12 ha`) to square metres.
 * Returns null when unparseable.
 */
export function publicAreaLabelToM2(label: string | null | undefined): number | null {
  if (!label) return null;
  const t = label.trim();
  const ha = t.match(/^([\d.]+(?:[.,]\d+)?)\s*ha$/i);
  if (ha) {
    const n = parseViDecimal(ha[1]);
    return n != null ? Math.round(n * 10_000) : null;
  }
  const m2 = t.match(/^([\d.]+(?:[.,]\d+)?)\s*m²$/i);
  if (!m2) return null;
  return parseViDecimal(m2[1]);
}

function parseViDecimal(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) {
    const n = Number(s.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  if (s.includes(',')) {
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    const n = Number(s.replace(/\./g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function toGuestListing(row: {
  isPublished: boolean;
  slug: string;
  title: string;
  seoTitle?: string | null;
  location: string;
  priceLabel: string | null;
  excerpt: string;
  bodyHtml?: string;
  coverImageUrl: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
}): PublicGuestListing | null {
  if (!row.isPublished) return null;
  return {
    slug: row.slug,
    title: row.title,
    ...(row.seoTitle != null ? { seoTitle: row.seoTitle } : {}),
    location: row.location,
    priceLabel: row.priceLabel,
    excerpt: row.excerpt,
    ...(row.bodyHtml != null ? { bodyHtml: row.bodyHtml } : {}),
    coverImageUrl: row.coverImageUrl,
    ...(row.metaDescription != null ? { metaDescription: row.metaDescription } : {}),
    ...(row.publishedAt != null ? { publishedAt: row.publishedAt } : {}),
    ...(row.updatedAt ? { updatedAt: row.updatedAt } : {}),
  };
}

/**
 * Parse the **public** price label to VND for JSON-LD Offer.
 * Returns null for Liên hệ, obfuscated labels (e.g. `3 tỷ xxx`), or unparseable text.
 * Do not pass CRM map price here.
 */
export function publicPriceLabelToVnd(label: string | null | undefined): number | null {
  if (!label) return null;
  const t = label.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!t || t === 'liên hệ' || t.includes('xxx') || t.includes('…') || t.includes('...')) {
    return null;
  }
  const match = t.match(/^([\d]+(?:[.,]\d{1,2})?)\s*(tỷ|triệu)$/i);
  if (!match) return null;
  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const unit = match[2];
  if (unit === 'tỷ') return Math.round(amount * 1_000_000_000);
  return Math.round(amount * 1_000_000);
}

export const publicWebPostRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: z.nativeEnum(PublicPostCategory),
  status: z.nativeEnum(PublicPostStatus),
  /** Ảnh bìa / thumbnail trên list & OG */
  coverImageUrl: z.string().nullable().optional(),
  /** HTML nội dung bài (TipTap). Ảnh trong bài = URL CDN. */
  bodyHtml: z.string().optional(),
  /** Đoạn tóm tắt ngắn — teaser / SEO fallback */
  excerpt: z.string().optional(),
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

function stripHtmlText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const createPublicPostInputSchema = z
  .object({
    title: z.string().trim().min(1, 'Nhập tiêu đề bài viết').max(160, 'Tiêu đề tối đa 160 ký tự'),
    category: z.nativeEnum(PublicPostCategory),
    status: z.nativeEnum(PublicPostStatus),
    coverImageUrl: z.string().trim().nullable().optional(),
    bodyHtml: z.string().optional(),
    excerpt: z.string().trim().max(PUBLIC_POST_EXCERPT_MAX).optional(),
    slug: z.string().trim().max(PUBLIC_POST_SLUG_MAX).optional(),
    metaDescription: z.string().trim().max(META_DESCRIPTION_MAX).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== PublicPostStatus.PUBLISHED) return;
    if (!data.coverImageUrl?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chọn ảnh bìa trước khi xuất bản',
        path: ['coverImageUrl'],
      });
    }
    const text = stripHtmlText(data.bodyHtml ?? '');
    if (!text) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nhập nội dung bài trước khi xuất bản',
        path: ['bodyHtml'],
      });
    }
  });

export type CreatePublicPostInput = z.infer<typeof createPublicPostInputSchema>;

export { stripHtmlText as stripPublicPostHtmlText };

/** Plain excerpt for SEO / catalog from TipTap HTML (lot listings — up to 2000). */
export function listingBodyToExcerpt(bodyHtml?: string | null): string {
  const text = stripHtmlText(bodyHtml ?? '');
  if (!text) return '';
  if (text.length <= 2000) return text;
  return `${text.slice(0, 1999).trim()}…`;
}

/** Auto-generated post excerpt — schema max, not listingBodyToExcerpt (2000). */
export function postBodyToExcerpt(bodyHtml?: string | null): string {
  return clipMetaDescription(stripHtmlText(bodyHtml ?? ''), PUBLIC_POST_EXCERPT_MAX);
}

/** Hide article lead when stored excerpt dumps the full body (legacy auto-excerpt). */
export function shouldShowPostLead(post: {
  excerpt?: string | null;
  bodyHtml?: string | null;
}): boolean {
  const excerpt = post.excerpt?.trim() ?? '';
  if (!excerpt) return false;
  const body = stripHtmlText(post.bodyHtml ?? '');
  if (!body) return true;
  return excerpt.length <= PUBLIC_POST_EXCERPT_MAX;
}

export const updatePublicListingDraftSchema = z
  .object({
    title: z.string().trim().min(1, 'Nhập tiêu đề bài đăng').max(160, 'Tiêu đề tối đa 160 ký tự'),
    location: z.string().trim().max(240, 'Địa chỉ quá dài'),
    priceMode: publicListingPriceModeSchema,
    priceLabel: z.string().trim().max(80, 'Giá công khai quá dài').nullable(),
    bodyHtml: z.string().optional(),
    slug: z.string().trim().min(1).max(200).optional(),
    metaDescription: z.string().trim().max(320).nullable().optional(),
    seoTitle: z.string().trim().max(160).nullable().optional(),
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

/** Guest article — published only. */
export const publicGuestPostSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.nativeEnum(PublicPostCategory),
  coverImageUrl: z.string().nullable().optional(),
  bodyHtml: z.string().optional(),
  excerpt: z.string(),
  metaDescription: z.string().trim().max(320).nullable().optional(),
  authorLabel: z.string().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type PublicGuestPost = z.infer<typeof publicGuestPostSchema>;

export const publicGuestPostListResponseSchema = z.object({
  items: z.array(publicGuestPostSchema),
});

export type PublicGuestPostListResponse = z.infer<typeof publicGuestPostListResponseSchema>;

/** Upload ảnh public (bìa / ảnh trong TipTap) — POST /admin/public-web/media */
export const uploadPublicMediaResponseSchema = z.object({
  url: z.string().url(),
  objectKey: z.string().min(1).optional(),
});

export type UploadPublicMediaResponse = z.infer<typeof uploadPublicMediaResponseSchema>;

/** MIME ảnh chấp nhận cho media public web. */
export const PUBLIC_MEDIA_ACCEPT_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const PUBLIC_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
