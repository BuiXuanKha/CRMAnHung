import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PUBLIC_SHARE_COOKIE, normalizeShareCode } from '@crmanhung/shared';

/**
 * Persist `?share=` for the browser session so related lots keep the
 * referring staff contact. Direct visits (no code) stay company hotline.
 */
export function middleware(request: NextRequest) {
  const code = normalizeShareCode(request.nextUrl.searchParams.get('share'));
  if (!code) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set(PUBLIC_SHARE_COOKIE, code, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
  });
  return res;
}

export const config = {
  matcher: ['/mua-ban-nha-dat-huyen-nam-sach/:path*'],
};
