'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** PageView khi đổi trang Next.js (mã cơ sở trong `<head>` đã track lần tải đầu). */
export function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [pathname]);

  return null;
}
