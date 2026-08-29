/** Local re-export — keep Nest imports stable; implementation in @crmanhung/shared. */
export {
  toPublicSlug,
  toListingPublicSlug,
  seoImageExt,
  seoImageFileName,
  seoLotImageObjectKey,
  seoAddressImageObjectKey,
  isSeoNamedImageKey,
  PUBLIC_SEO_IMAGE_EXT,
  PUBLIC_SEO_IMAGE_MIME,
  isWebpObjectKey,
  withPublicWebpExt,
} from '@crmanhung/shared';

export function kindLabel(kind: string): string {
  return kind === 'NHA' ? 'Nhà' : 'Đất';
}

export function formatM(value: number | null | undefined, suffix: string): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${value.toLocaleString('vi-VN')} ${suffix}`;
}
