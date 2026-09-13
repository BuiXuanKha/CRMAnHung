import sharp from 'sharp';
import {
  PUBLIC_OG_IMAGE_MIME,
  PUBLIC_SEO_IMAGE_MIME,
  withPublicWebpExt,
} from '@crmanhung/shared';

/** Long-edge cap so phone photos are not 4000px on the CDN. */
export const PUBLIC_WEBP_MAX_EDGE = 2560;
export const PUBLIC_WEBP_QUALITY = 80;

const SKIP_MIME = new Set(['image/svg+xml', 'image/svg', 'application/pdf']);

export function isPublicRasterImage(contentType?: string | null, fileName?: string | null): boolean {
  const mime = (contentType ?? '').toLowerCase().split(';')[0].trim();
  if (SKIP_MIME.has(mime)) return false;
  if (mime.startsWith('image/')) return true;
  const name = (fileName ?? '').toLowerCase();
  return /\.(jpe?g|png|webp|gif|bmp|tiff?)$/.test(name);
}

export async function toPublicWebp(buffer: Buffer): Promise<{
  buffer: Buffer;
  contentType: typeof PUBLIC_SEO_IMAGE_MIME;
}> {
  const out = await sharp(buffer, { failOn: 'none', animated: false })
    .rotate()
    .resize({
      width: PUBLIC_WEBP_MAX_EDGE,
      height: PUBLIC_WEBP_MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: PUBLIC_WEBP_QUALITY, effort: 2 })
    .toBuffer();
  return { buffer: out, contentType: PUBLIC_SEO_IMAGE_MIME };
}

export async function assertDecodedWebp(buffer: Buffer): Promise<void> {
  if (!buffer.length || buffer.length < 32) {
    throw new Error('WebP buffer trống');
  }
  const meta = await sharp(buffer, { failOn: 'none', animated: false }).metadata();
  if (meta.format !== 'webp' || !meta.width || !meta.height) {
    throw new Error('WebP decode không hợp lệ');
  }
}


/** Match working `/og-default.png` — Zalo preview OK with this box. */
export const PUBLIC_OG_IMAGE_WIDTH = 1200;
export const PUBLIC_OG_IMAGE_HEIGHT = 630;

/** Cover → PNG 1200×630 for `og:image` (Zalo). Gallery WebP unchanged. */
export async function toPublicOgPng(buffer: Buffer): Promise<{
  buffer: Buffer;
  contentType: typeof PUBLIC_OG_IMAGE_MIME;
}> {
  const out = await sharp(buffer, { failOn: 'none', animated: false })
    .rotate()
    .resize({
      width: PUBLIC_OG_IMAGE_WIDTH,
      height: PUBLIC_OG_IMAGE_HEIGHT,
      fit: 'cover',
      position: 'centre',
    })
    .png({ compressionLevel: 8, palette: false })
    .toBuffer();
  return { buffer: out, contentType: PUBLIC_OG_IMAGE_MIME };
}

/** @deprecated alias */
export const toPublicOgJpeg = toPublicOgPng;
export const PUBLIC_OG_JPEG_MAX_EDGE = PUBLIC_OG_IMAGE_WIDTH;


export { withPublicWebpExt };
