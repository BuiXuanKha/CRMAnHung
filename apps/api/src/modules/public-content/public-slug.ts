/** Local re-export — keep Nest imports stable; implementation in @crmanhung/shared. */
export {
  toPublicSlug,
  toListingPublicSlug,
  toPublicPostSlug,
  reservePublicLotSlug,
  seoImageExt,
  seoImageFileName,
  seoLotImageObjectKey,
  seoAddressImageObjectKey,
  seoPostImageFileName,
  seoPostImageObjectKey,
  isSeoNamedImageKey,
  PUBLIC_SEO_IMAGE_EXT,
  PUBLIC_SEO_IMAGE_MIME,
  PUBLIC_OG_IMAGE_EXT,
  PUBLIC_OG_IMAGE_MIME,
  isWebpObjectKey,
  isPublicOgJpegObjectKey,
  withPublicWebpExt,
  publicOgJpegObjectKeyFromWebp,
  publicOgJpegUrlFromCoverUrl,
  seoImageSlugStem,
  canonicalSeoLotImageObjectKey,
  canonicalSeoAddressImageObjectKey,
  seoImageObjectKeyNeedsRetarget,
  objectKeyMatchesSeoStem,
} from '@crmanhung/shared';

export function kindLabel(kind: string): string {
  return kind === 'NHA' ? 'Nhà' : 'Đất';
}

export function formatM(value: number | null | undefined, suffix: string): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${value.toLocaleString('vi-VN')} ${suffix}`;
}
