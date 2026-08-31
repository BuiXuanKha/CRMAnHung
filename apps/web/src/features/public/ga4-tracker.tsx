'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { GA4_MEASUREMENT_ID } from './ga4-snippet';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** `page_view` khi đổi trang Next `Link`. Bỏ lần tải đầu — `gtag('config')` đã gửi. */
export function Ga4RouteTracker() {
  const pathname = usePathname();
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    window.gtag?.('config', GA4_MEASUREMENT_ID, { page_path: pathname });
  }, [pathname]);

  return null;
}
