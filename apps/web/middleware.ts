import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  PUBLIC_SHARE_COOKIE,
  PUBLIC_SHARE_REQUEST_HEADER,
  WEB_ROLE_COOKIE,
  crmHomePathForRole,
  isAdminOnlyCrmPath,
  isCrmAppPath,
  isStaffDangBaiPath,
  nextPublicShareCookie,
  normalizeShareCode,
  normalizeWebCrmRole,
  parsePublicShareCookie,
  remainingShareCookieMaxAgeSec,
  serializePublicShareCookie,
  staffDashboardFallbackPath,
} from '@crmanhung/shared';

/** Nest on this VPS — never hairpin through Cloudflare public origin. */
const LOOPBACK_API_ORIGIN = 'http://127.0.0.1:5050';

function lotShareResolveHref(code: string): string {
  const suffix = `/public/lot-shares/${encodeURIComponent(code)}`;
  const api = process.env.NEXT_PUBLIC_API_URL?.trim();
  const prefix = api?.startsWith('/') ? api.replace(/\/$/, '') : '/api/v1';
  const origin = process.env.INTERNAL_API_ORIGIN?.trim() || LOOPBACK_API_ORIGIN;
  return new URL(`${prefix}${suffix}`, `${origin.replace(/\/$/, '')}/`).href;
}

/** Validate share code only — resolve body must not expose employeeId to the edge. */
async function isLiveShareCode(code: string): Promise<boolean> {
  try {
    const res = await fetch(lotShareResolveHref(code), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function cookieOptions(request: NextRequest, maxAge: number) {
  return {
    path: '/',
    sameSite: 'lax' as const,
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    maxAge,
  };
}

function withShareHeader(request: NextRequest, code: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PUBLIC_SHARE_REQUEST_HEADER, code);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function redirectCrm(request: NextRequest, pathname: string, status = 307): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return NextResponse.redirect(url, status);
}

/**
 * BUG-012: coordinate CRM routes by HttpOnly role cookie (set on login/refresh/me).
 * Spoofable for UI only — Nest `@Roles` remains the real gate.
 */
function guardCrmRoutes(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const role = normalizeWebCrmRole(request.cookies.get(WEB_ROLE_COOKIE)?.value);

  if (pathname === '/login') {
    if (!role) return null;
    return redirectCrm(request, crmHomePathForRole(role));
  }

  // BUG-082: normalize typo before login `next=` — guest then gets next=/dashboard.
  if (pathname === '/dashbroad') {
    if (role === 'STAFF') {
      return redirectCrm(request, staffDashboardFallbackPath(), 308);
    }
    return redirectCrm(request, '/dashboard', 308);
  }

  if (!isCrmAppPath(pathname)) return null;

  if (!role) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = '';
    const next = pathname + (request.nextUrl.search || '');
    if (next && next !== '/') login.searchParams.set('next', next);
    return NextResponse.redirect(login);
  }

  if (role === 'ADMIN' && isStaffDangBaiPath(pathname)) {
    return redirectCrm(request, crmHomePathForRole('ADMIN'));
  }

  if (role === 'STAFF' && isAdminOnlyCrmPath(pathname)) {
    if (pathname.startsWith('/dashboard')) {
      return redirectCrm(request, staffDashboardFallbackPath());
    }
    return redirectCrm(request, crmHomePathForRole('STAFF'));
  }

  return null;
}

/**
 * Last-click share cookie: 30 days keyed by share code only.
 * No `?share=` → leave cookie as-is. BUG-035: only persist when resolve succeeds.
 * Bad/unknown/disabled codes must not overwrite a prior good cookie.
 */

export async function middleware(request: NextRequest) {
  const crmGuard = guardCrmRoutes(request);
  if (crmGuard) return crmGuard;

  const code = normalizeShareCode(request.nextUrl.searchParams.get('share'));
  if (!code) return NextResponse.next();

  const live = await isLiveShareCode(code);
  // Resolve failed (404 / inactive / timeout) — keep existing last-click cookie.
  if (!live) return NextResponse.next();

  const nowMs = Date.now();
  const existing = parsePublicShareCookie(request.cookies.get(PUBLIC_SHARE_COOKIE)?.value);
  const next = nextPublicShareCookie({
    nowMs,
    shareCode: code,
    existing,
  });
  const maxAge = remainingShareCookieMaxAgeSec(next.expiresAtMs, nowMs);
  const res = withShareHeader(request, code);
  if (maxAge > 0) {
    res.cookies.set(
      PUBLIC_SHARE_COOKIE,
      serializePublicShareCookie(next),
      cookieOptions(request, maxAge),
    );
  }
  return res;
}

export const config = {
  matcher: [
    '/login',
    '/khach-hang',
    '/khach-hang/:path*',
    '/lo-dat',
    '/lo-dat/:path*',
    '/giao-dich',
    '/giao-dich/:path*',
    '/dich-vu-so-do',
    '/dich-vu-so-do/:path*',
    '/cong-viec',
    '/cong-viec/:path*',
    '/dang-bai',
    '/dang-bai/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/dashbroad',
    '/quan-tri',
    '/quan-tri/:path*',
    '/cai-dat',
    '/cai-dat/:path*',
    '/mua-ban-nha-dat-huyen-nam-sach/:path*',
  ],
};
