import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  PUBLIC_SHARE_COOKIE,
  PUBLIC_SHARE_REQUEST_HEADER,
  nextPublicShareCookie,
  normalizeShareCode,
  parsePublicShareCookie,
  remainingShareCookieMaxAgeSec,
  serializePublicShareCookie,
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

/**
 * Last-click staff cookie: 30 days; same employee does not reset the clock;
 * a different employee overwrites and restarts. No `?share=` → leave cookie as-is.
 * Always persist a valid-format code so homepage can resolve even if lookup is slow.
 */
export async function middleware(request: NextRequest) {
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
  matcher: ['/mua-ban-nha-dat-huyen-nam-sach/:path*'],
};
