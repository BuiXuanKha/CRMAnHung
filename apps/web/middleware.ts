import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  PUBLIC_SHARE_COOKIE,
  PUBLIC_SHARE_REQUEST_HEADER,
  WEB_ROLE_COOKIE,
  crmHomePathForRole,
  isAdminOnlyCrmPath,
  isCrmAppPath,
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

async function lookupShareEmployee(code: string): Promise<{ employeeId: string } | null> {
  try {
    const res = await fetch(lotShareResolveHref(code), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { employeeId?: string };
    const employeeId = body.employeeId?.trim() ?? '';
    return employeeId ? { employeeId } : null;
  } catch {
    return null;
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

function redirectCrm(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return NextResponse.redirect(url);
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

  if (!isCrmAppPath(pathname)) return null;

  if (!role) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = '';
    const next = pathname + (request.nextUrl.search || '');
    if (next && next !== '/') login.searchParams.set('next', next);
    return NextResponse.redirect(login);
  }

  if (pathname === '/dashbroad') {
    return redirectCrm(
      request,
      role === 'ADMIN' ? '/dashboard' : staffDashboardFallbackPath(),
    );
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
 * Last-click staff cookie: 30 days; same employee does not reset the clock;
 * a different employee overwrites and restarts. No `?share=` → leave cookie as-is.
 * Always persist a valid-format code so homepage can resolve even if lookup is slow.
 */
export async function middleware(request: NextRequest) {
  const crmGuard = guardCrmRoutes(request);
  if (crmGuard) return crmGuard;

  const code = normalizeShareCode(request.nextUrl.searchParams.get('share'));
  if (!code) return NextResponse.next();

  const lookedUp = await lookupShareEmployee(code);
  const nowMs = Date.now();
  const existing = parsePublicShareCookie(request.cookies.get(PUBLIC_SHARE_COOKIE)?.value);
  const next = nextPublicShareCookie({
    nowMs,
    shareCode: code,
    employeeId: lookedUp?.employeeId ?? '',
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
