import { PUBLIC_LISTING_PATH } from './site';

/** Detail slug — exclude reserved hub segment `xa`. */
const LISTING_DETAIL = new RegExp(`^${PUBLIC_LISTING_PATH}/(?!xa(?:/|$))([^/]+)/?$`);

export function parseSanPhamPath(
  pathname: string,
): { kind: 'list' } | { kind: 'detail'; slug: string } | null {
  if (
    pathname === PUBLIC_LISTING_PATH ||
    pathname === `${PUBLIC_LISTING_PATH}/` ||
    pathname === '/san-pham' ||
    pathname === '/san-pham/' ||
    pathname === '/mua-ban-nha-dat' ||
    pathname === '/mua-ban-nha-dat/'
  ) {
    return { kind: 'list' };
  }
  const match =
    pathname.match(LISTING_DETAIL) ||
    pathname.match(/^\/san-pham\/(?!xa(?:\/|$))([^/]+)\/?$/) ||
    pathname.match(/^\/mua-ban-nha-dat\/(?!xa(?:\/|$))([^/]+)\/?$/);
  if (!match) return null;
  return { kind: 'detail', slug: match[1] };
}

export function trackListingViewContent(input: {
  slug: string;
  title: string;
  kindLabel?: string | null;
}): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const name = input.title.trim() || input.slug;
  window.fbq('track', 'ViewContent', {
    content_type: 'product',
    content_ids: [input.slug],
    content_name: name,
    content_category: input.kindLabel?.trim() || 'mua-ban-nha-dat-huyen-nam-sach',
  });
}

/** ViewProductList on catalog; ViewContent is fired from LotDetailMetaPixel with SSR data. */
export function trackSanPhamPixel(pathname: string): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const parsed = parseSanPhamPath(pathname);
  if (!parsed || parsed.kind !== 'list') return;

  window.fbq('trackCustom', 'ViewProductList', {
    content_name: 'Danh sách nhà đất',
    content_category: 'mua-ban-nha-dat-huyen-nam-sach',
  });
}
