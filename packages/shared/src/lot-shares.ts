import { z } from 'zod';
import { LodatSaleStatus } from './enums.js';
import { PUBLIC_LISTING_PATH, PUBLIC_SITE_ORIGIN } from './public-content.js';
import { PUBLIC_OG_MEDIA_GENERATION } from './seo-image.js';

/**
 * Staff share links (`?share=CODE&og=N`) + guest contact attribution.
 * Query/cookie identify the **referring employee**, not the listing owner.
 * `og=N` matches {@link PUBLIC_OG_MEDIA_GENERATION} so Zalo treats the page URL
 * as new when the OG contract changes (scrapers cache by full URL, not by lot).
 */

export const lotShareContactSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  /** CDN avatar NV; trống = chữ cái trên thẻ / khối liên hệ. */
  avatarUrl: z.string().url().nullable().optional(),
});

/** First-party cookie: khách `?share=` — liên hệ NV trên trang chủ + chi tiết lô. */
export const PUBLIC_SHARE_COOKIE = 'crmanhung_share';

/** 30 calendar days from first click of that employee (reset only when employee changes). */
export const PUBLIC_SHARE_COOKIE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const PUBLIC_SHARE_COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60;

export type PublicShareCookiePayload = {
  shareCode: string;
  employeeId: string;
  expiresAtMs: number;
};

/** Forwarded by middleware on the same `?share=` request so layout can read it before Set-Cookie. */
export const PUBLIC_SHARE_REQUEST_HEADER = 'x-crmanhung-share-code';

/** Cookie-safe (`CODE~employeeId~expiresAtMs`); employeeId left empty — server resolves code → staff. */
const SHARE_COOKIE_DELIM = '~';

const shareCookieWireSchema = z.object({
  c: z.string(),
  e: z.string(),
  x: z.number().int().positive(),
});

export function serializePublicShareCookie(payload: PublicShareCookiePayload): string {
  const shareCode = normalizeShareCode(payload.shareCode);
  const employeeId = payload.employeeId.trim().replaceAll(SHARE_COOKIE_DELIM, '');
  const expiresAtMs = Math.max(0, Math.floor(payload.expiresAtMs));
  return `${shareCode}${SHARE_COOKIE_DELIM}${employeeId}${SHARE_COOKIE_DELIM}${expiresAtMs}`;
}

function parseDelimitedShareCookie(raw: string): PublicShareCookiePayload | null {
  const parts = raw.split(SHARE_COOKIE_DELIM);
  if (parts.length !== 3) return null;
  const shareCode = normalizeShareCode(parts[0]);
  if (!shareCode) return null;
  const expiresAtMs = Number(parts[2]);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < 0) return null;
  return { shareCode, employeeId: parts[1]?.trim() ?? '', expiresAtMs };
}

function parseJsonShareCookie(raw: string): PublicShareCookiePayload | null {
  try {
    const parsed = shareCookieWireSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const shareCode = normalizeShareCode(parsed.data.c);
    if (!shareCode) return null;
    return {
      shareCode,
      employeeId: parsed.data.e.trim(),
      expiresAtMs: parsed.data.x,
    };
  } catch {
    return null;
  }
}

export function parsePublicShareCookie(
  raw: string | null | undefined,
): PublicShareCookiePayload | null {
  const s = raw?.trim() ?? '';
  if (!s) return null;
  const legacy = normalizeShareCode(s);
  if (legacy) {
    return { shareCode: legacy, employeeId: '', expiresAtMs: 0 };
  }
  return parseDelimitedShareCookie(s) ?? parseJsonShareCookie(s);
}

export function shareCodeFromCookieValue(raw: string | null | undefined): string {
  return parsePublicShareCookie(raw)?.shareCode ?? '';
}

export function remainingShareCookieMaxAgeSec(
  expiresAtMs: number,
  nowMs = Date.now(),
): number {
  return Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
}

/**
 * Last-click by share code only (browser never needs employeeId).
 * Same live code with valid window → keep expiry; different code → new 30 days.
 * `employeeId` in the cookie payload stays empty for wire compatibility.
 */
export function nextPublicShareCookie(input: {
  nowMs: number;
  shareCode: string;
  existing: PublicShareCookiePayload | null;
}): PublicShareCookiePayload {
  const shareCode = normalizeShareCode(input.shareCode);
  const existing = input.existing;
  const sameCode =
    Boolean(existing?.shareCode) &&
    existing!.shareCode === shareCode &&
    existing!.expiresAtMs > input.nowMs;
  return {
    shareCode,
    employeeId: '',
    expiresAtMs: sameCode
      ? existing!.expiresAtMs
      : input.nowMs + PUBLIC_SHARE_COOKIE_TTL_MS,
  };
}

/** Same alphabet as API share codes (no I/O/0/1). */
export const SHARE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{4,12}$/i;

export function normalizeShareCode(raw: string | null | undefined): string {
  const s = raw?.trim().toUpperCase() ?? '';
  return SHARE_CODE_PATTERN.test(s) ? s : '';
}

/** `?share=` wins over cookie (khách đổi link NV). */
export function pickShareCode(
  fromQuery: string | null | undefined,
  fromCookie: string | null | undefined,
): string {
  return normalizeShareCode(fromQuery) || shareCodeFromCookieValue(fromCookie);
}

export type LotShareContact = z.infer<typeof lotShareContactSchema>;

export const lotShareLinkResponseSchema = z.object({
  shareCode: z.string().min(4).max(12),
  slug: z.string().min(1),
  url: z.string().url(),
});

export type LotShareLinkResponse = z.infer<typeof lotShareLinkResponseSchema>;

/** Public resolve: hotline for UI only — no internal employeeId / visitCount. */
export const publicLotShareResolveSchema = z.object({
  shareCode: z.string().min(4).max(12),
  listingSlug: z.string().min(1),
  employee: lotShareContactSchema,
});

export type PublicLotShareResolve = z.infer<typeof publicLotShareResolveSchema>;

export const publicLotShareVisitResponseSchema = z.object({
  ok: z.literal(true),
});

export type PublicLotShareVisitResponse = z.infer<typeof publicLotShareVisitResponseSchema>;

/** Logged-in staff contact for public listing CTAs. Missing/short phone → null. */
export function contactFromAuthUser(
  user:
    | { fullName?: string | null; phone?: string | null; avatarUrl?: string | null }
    | null
    | undefined,
): LotShareContact | null {
  const fullName = user?.fullName?.trim() ?? '';
  const phone = user?.phone?.trim() ?? '';
  const digits = phone.replace(/\D/g, '');
  if (!fullName || digits.length < 9) return null;
  const avatarUrl = user?.avatarUrl?.trim() || undefined;
  return avatarUrl ? { fullName, phone, avatarUrl } : { fullName, phone };
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

/**
 * Origin for guest share URLs.
 * Loopback (`PUBLIC_WEB_ORIGIN` for ISR) must never leak into clipboard / Facebook.
 */
export function resolvePublicShareOrigin(raw?: string | null): string {
  const s = raw?.trim();
  if (!s) return PUBLIC_SITE_ORIGIN;
  try {
    if (isLoopbackHost(new URL(s).hostname)) return PUBLIC_SITE_ORIGIN;
  } catch {
    return PUBLIC_SITE_ORIGIN;
  }
  return s.replace(/\/$/, '');
}

/** Build guest share URL (catalog path + `?share=` + `og=` generation). */
export function buildLotShareUrl(
  origin: string,
  slug: string,
  shareCode: string,
): string {
  const base = resolvePublicShareOrigin(origin);
  const path = `${PUBLIC_LISTING_PATH}/${encodeURIComponent(slug)}`;
  const code = normalizeShareCode(shareCode);
  const qs = new URLSearchParams({
    share: code || shareCode.trim(),
    og: PUBLIC_OG_MEDIA_GENERATION,
  });
  return `${base}${path}?${qs.toString()}`;
}

/** Share URL for clipboard — always public origin, never revalidate loopback. */
export function guestLotShareUrl(
  slug: string,
  shareCode: string,
  origin?: string | null,
): string {
  return buildLotShareUrl(resolvePublicShareOrigin(origin), slug, shareCode);
}

/** Guest listing sale badge — lô đã publish vẫn mở khi Tạm dừng / Đã bán. */
export const publicListingSaleStatusSchema = z.nativeEnum(LodatSaleStatus);

export type PublicListingSaleStatus = z.infer<typeof publicListingSaleStatusSchema>;

/** ADMIN `/dashboard/thong-ke` — số lô mỗi NV đã tạo link share. */
export const shareEmployeeStatSchema = z.object({
  employeeId: z.string().min(1),
  fullName: z.string(),
  username: z.string(),
  phone: z.string().nullable(),
  role: z.string(),
  isActive: z.boolean(),
  avatarUrl: z.string().url().nullable().optional(),
  sharedListingCount: z.number().int().nonnegative(),
  /** Mỗi lần khách (cookie share) tải hoặc đổi trang public — kể cả F5. */
  attributedViewCount: z.number().int().nonnegative(),
});

export type ShareEmployeeStat = z.infer<typeof shareEmployeeStatSchema>;

export const shareEmployeeStatsResponseSchema = z.object({
  items: z.array(shareEmployeeStatSchema),
  total: z.number().int().nonnegative(),
  /** Khách không cookie share — mỗi lần tải/đổi trang public, F5 = +1. */
  directViewCount: z.number().int().nonnegative(),
});

export type ShareEmployeeStatsResponse = z.infer<typeof shareEmployeeStatsResponseSchema>;

export const SHARE_STATS_DIRECT_ID = '__direct__';

export type ShareStatsDisplayRow =
  | { kind: 'employee'; employee: ShareEmployeeStat }
  | { kind: 'direct'; attributedViewCount: number };

function shareStatsSortKey(row: ShareStatsDisplayRow): {
  views: number;
  shares: number;
  name: string;
  directLast: number;
} {
  if (row.kind === 'direct') {
    return { views: row.attributedViewCount, shares: 0, name: '', directLast: 1 };
  }
  return {
    views: row.employee.attributedViewCount,
    shares: row.employee.sharedListingCount,
    name: row.employee.fullName,
    directLast: 0,
  };
}

/** NV + đúng một dòng Truy cập trực tiếp. Sort: lượt xem → đã share → tên; trực tiếp sau NV khi bằng điểm. */
export function mergeShareStatsDisplayRows(
  items: ShareEmployeeStat[],
  directViewCount: number,
): ShareStatsDisplayRow[] {
  const rows: ShareStatsDisplayRow[] = [
    ...items.map((employee) => ({ kind: 'employee' as const, employee })),
    { kind: 'direct', attributedViewCount: Math.max(0, Math.floor(directViewCount)) },
  ];
  return rows.sort((a, b) => {
    const left = shareStatsSortKey(a);
    const right = shareStatsSortKey(b);
    if (right.views !== left.views) return right.views - left.views;
    if (right.shares !== left.shares) return right.shares - left.shares;
    if (left.directLast !== right.directLast) return left.directLast - right.directLast;
    return left.name.localeCompare(right.name, 'vi');
  });
}

export const publicPageViewRequestSchema = z.object({
  shareCode: z.string().max(12).optional(),
});

export type PublicPageViewRequest = z.infer<typeof publicPageViewRequestSchema>;

export const publicSharePageViewResponseSchema = z.object({
  ok: z.literal(true),
  viewCount: z.number().int().nonnegative(),
});

export type PublicSharePageViewResponse = z.infer<typeof publicSharePageViewResponseSchema>;
