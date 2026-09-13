import { PUBLIC_CDN_ORIGIN } from '@crmanhung/shared';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Same-origin proxy for public CDN images used as `og:image`.
 * Zalo fails on cdn.anhungland.com; WebP (and other formats) work via this apex path.
 * Query `?og=N` is ignored here — only used so scrapers treat the URL as a new asset.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return new NextResponse('Not found', { status: 404 });
  }
  if (segments.some((s) => !s || s === '.' || s === '..' || s.includes('\\') || s.includes('\0'))) {
    return new NextResponse('Bad path', { status: 400 });
  }

  const objectKey = segments.join('/');
  const upstreamUrl = `${PUBLIC_CDN_ORIGIN.replace(/\/$/, '')}/${objectKey}`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      // CDN assets are immutable keys; allow edge/ISR-style caching when available.
      next: { revalidate: 86_400 },
      headers: { Accept: 'image/*,*/*' },
    });
  } catch {
    return new NextResponse('Upstream unreachable', { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
  }

  const contentType = (upstream.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!contentType.startsWith('image/')) {
    return new NextResponse('Not an image', { status: 415 });
  }

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      // Avoid CDN Content-Disposition quirks for social scrapers.
    },
  });
}
