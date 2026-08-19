'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Pixel ID public (có trong HTML trang khách). Không gắn CRM / login. */
export const META_PIXEL_ID = '391165622297911';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function MetaPixelRouteTracker() {
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

/** Meta Pixel — chỉ production, layout `(public)/`. */
export function MetaPixel() {
  if (process.env.NODE_ENV !== 'production') return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* Facebook noscript fallback — not next/image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height={1}
          width={1}
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <MetaPixelRouteTracker />
    </>
  );
}
