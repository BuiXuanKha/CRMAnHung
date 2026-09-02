import { z } from 'zod';
import { LodatSaleStatus } from './enums.js';
import { PUBLIC_LISTING_PATH, PUBLIC_SITE_ORIGIN } from './public-content.js';

/**
 * Staff share links (`?share=CODE`) + guest contact attribution.
 * Query/cookie identify the **referring employee**, not the listing owner.
 */

export const lotShareContactSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  /** CDN avatar NV; trống = chữ cái trên thẻ / khối liên hệ. */
  avatarUrl: z.string().url().nullable().optional(),
});

/** First-party cookie: khách vào bằng `?share=` — liên hệ NV trên mọi lô trong phiên. */
export const PUBLIC_SHARE_COOKIE = 'crmanhung_share';

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
  return normalizeShareCode(fromQuery) || normalizeShareCode(fromCookie);
}

export type LotShareContact = z.infer<typeof lotShareContactSchema>;

export const lotShareLinkResponseSchema = z.object({
  shareCode: z.string().min(4).max(12),
  slug: z.string().min(1),
  url: z.string().url(),
});

export type LotShareLinkResponse = z.infer<typeof lotShareLinkResponseSchema>;

export const publicLotShareResolveSchema = z.object({
  shareCode: z.string().min(4).max(12),
  listingSlug: z.string().min(1),
  employee: lotShareContactSchema,
  visitCount: z.number().int().nonnegative(),
});

export type PublicLotShareResolve = z.infer<typeof publicLotShareResolveSchema>;

export const publicLotShareVisitResponseSchema = z.object({
  ok: z.literal(true),
  visitCount: z.number().int().nonnegative(),
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

/** Build guest share URL (canonical catalog path + `?share=`). */
export function buildLotShareUrl(
  origin: string,
  slug: string,
  shareCode: string,
): string {
  const base = resolvePublicShareOrigin(origin);
  const path = `${PUBLIC_LISTING_PATH}/${encodeURIComponent(slug)}`;
  const code = normalizeShareCode(shareCode);
  const qs = new URLSearchParams({ share: code || shareCode.trim() });
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
