import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  PUBLIC_SHARE_COOKIE,
  nextPublicShareCookie,
  normalizeShareCode,
  parsePublicShareCookie,
  remainingShareCookieMaxAgeSec,
  serializePublicShareCookie,
} from '@crmanhung/shared';

function lotShareResolveHref(request: NextRequest, code: string): string {
  const suffix = `/public/lot-shares/${encodeURIComponent(code)}`;
  const api = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (api && /^https?:\/\//i.test(api)) {
    return `${api.replace(/\/$/, '')}${suffix}`;
  }
  const origin = process.env.INTERNAL_API_ORIGIN?.trim() || request.nextUrl.origin;
  const prefix = api?.startsWith('/') ? api.replace(/\/$/, '') : '/api/v1';
  return new URL(`${prefix}${suffix}`, origin).href;
}

async function lookupShareEmployee(
  request: NextRequest,
  code: string,
): Promise<{ employeeId: string } | null> {
  try {
    const res = await fetch(lotShareResolveHref(request, code), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(2500),
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

/**
 * Last-click staff cookie: 30 days; same employee does not reset the clock;
 * a different employee overwrites and restarts. No `?share=` → leave cookie as-is.
 */
export async function middleware(request: NextRequest) {
  const code = normalizeShareCode(request.nextUrl.searchParams.get('share'));
  if (!code) return NextResponse.next();

  const lookedUp = await lookupShareEmployee(request, code);
  if (!lookedUp) return NextResponse.next();

  const nowMs = Date.now();
  const existing = parsePublicShareCookie(request.cookies.get(PUBLIC_SHARE_COOKIE)?.value);
  const next = nextPublicShareCookie({
    nowMs,
    shareCode: code,
    employeeId: lookedUp.employeeId,
    existing,
  });
  const maxAge = remainingShareCookieMaxAgeSec(next.expiresAtMs, nowMs);
  if (maxAge <= 0) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set(PUBLIC_SHARE_COOKIE, serializePublicShareCookie(next), cookieOptions(request, maxAge));
  return res;
}

export const config = {
  matcher: ['/mua-ban-nha-dat-huyen-nam-sach/:path*'],
};
