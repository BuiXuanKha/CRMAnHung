import { PUBLIC_CDN_ORIGIN } from '@crmanhung/shared';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Longest edge of the JPEG Facebook/Zalo actually download. Gallery files stay full-size WebP on CDN. */
const OG_JPEG_MAX_EDGE = 1200;

/**
 * Same-origin proxy for public CDN images used as `og:image`.
 * Zalo fails on cdn.anhungland.com. Facebook's preview often drops WebP and
 * responses without Content-Length, so this path returns a JPEG with a length.
 * Query `?og=N` is ignored here — only used so scrapers treat the URL as a new asset.
 */

async function toSocialJpeg(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes, { failOn: 'none', animated: false })
    .rotate()
    .resize({
      width: OG_JPEG_MAX_EDGE,
      height: OG_JPEG_MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82 })
    .toBuffer();
}

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

  const raw = Buffer.from(await upstream.arrayBuffer());
  let payload = new Uint8Array(raw);
  let type = contentType;
  try {
    payload = new Uint8Array(await toSocialJpeg(raw));
    type = 'image/jpeg';
  } catch {
    payload = new Uint8Array(raw);
  }

  return new NextResponse(payload, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Content-Length': String(payload.byteLength),
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
