'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackSanPhamPixel } from './meta-pixel-events';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** PageView khi đổi trang; ViewProductList trên catalog lô; ViewContent từ LotDetailMetaPixel. */
export function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const skipFirstPageView = useRef(true);

  useEffect(() => {
    trackSanPhamPixel(pathname);
    if (skipFirstPageView.current) {
      skipFirstPageView.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [pathname]);

  return null;
}
