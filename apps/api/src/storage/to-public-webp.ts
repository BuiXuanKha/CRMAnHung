import sharp from 'sharp';
import { PUBLIC_SEO_IMAGE_MIME, withPublicWebpExt } from '@crmanhung/shared';

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
    .webp({ quality: PUBLIC_WEBP_QUALITY, effort: 4 })
    .toBuffer();
  return { buffer: out, contentType: PUBLIC_SEO_IMAGE_MIME };
}

export { withPublicWebpExt };
