import { getProductBySlug } from './mock-data';
import { PUBLIC_LISTING_PATH } from './site';

const LISTING_DETAIL = new RegExp(`^${PUBLIC_LISTING_PATH}/([^/]+)/?$`);

export function parseSanPhamPath(
  pathname: string,
): { kind: 'list' } | { kind: 'detail'; slug: string } | null {
  if (
    pathname === PUBLIC_LISTING_PATH ||
    pathname === `${PUBLIC_LISTING_PATH}/` ||
    pathname === '/san-pham' ||
    pathname === '/san-pham/'
  ) {
    return { kind: 'list' };
  }
  const match =
    pathname.match(LISTING_DETAIL) || pathname.match(/^\/san-pham\/([^/]+)\/?$/);
  if (!match) return null;
  return { kind: 'detail', slug: match[1] };
}

/** ViewContent (chi tiết) / ViewProductList (danh sách mua bán nhà đất). */
export function trackSanPhamPixel(pathname: string): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const parsed = parseSanPhamPath(pathname);
  if (!parsed) return;

  if (parsed.kind === 'list') {
    window.fbq('trackCustom', 'ViewProductList', {
      content_name: 'Danh sách nhà đất',
      content_category: 'mua-ban-nha-dat',
    });
    return;
  }

  const product = getProductBySlug(parsed.slug);
  window.fbq('track', 'ViewContent', {
    content_type: 'product',
    content_ids: [parsed.slug],
    content_name: product?.title ?? parsed.slug,
    content_category: product?.typeLabel ?? 'mua-ban-nha-dat',
  });
}
