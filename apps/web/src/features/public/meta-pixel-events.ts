import { getProductBySlug } from './mock-data';

export function parseSanPhamPath(pathname: string): { kind: 'list' } | { kind: 'detail'; slug: string } | null {
  if (pathname === '/san-pham' || pathname === '/san-pham/') return { kind: 'list' };
  const match = pathname.match(/^\/san-pham\/([^/]+)\/?$/);
  if (!match) return null;
  return { kind: 'detail', slug: match[1] };
}

/** ViewContent (chi tiết) / ViewProductList (danh sách /san-pham). */
export function trackSanPhamPixel(pathname: string): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const parsed = parseSanPhamPath(pathname);
  if (!parsed) return;

  if (parsed.kind === 'list') {
    window.fbq('trackCustom', 'ViewProductList', {
      content_name: 'Danh sách sản phẩm',
      content_category: 'san-pham',
    });
    return;
  }

  const product = getProductBySlug(parsed.slug);
  window.fbq('track', 'ViewContent', {
    content_type: 'product',
    content_ids: [parsed.slug],
    content_name: product?.title ?? parsed.slug,
    content_category: product?.typeLabel ?? 'san-pham',
  });
}
