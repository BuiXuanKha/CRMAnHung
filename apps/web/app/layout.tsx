import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Noto_Sans } from 'next/font/google';
import { Providers } from './providers';
import { MetaPixelRouteTracker } from '@/features/public/meta-pixel-tracker';
import {
  META_PIXEL_HEAD_SCRIPT,
  META_PIXEL_NOSCRIPT_IMG,
} from '@/features/public/meta-pixel-snippet';
import '@/styles/global.css';

/** Public marketing */
const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-public',
});

/** CRM workbench — cùng họ font với CRM cũ */
const notoSans = Noto_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-crm',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://anhungland.com'),
  title: {
    default: 'An Hưng Land',
    template: '%s | An Hưng Land',
  },
  description: 'An Hưng Land — bất động sản và CRM nội bộ.',
};

/** Keep pinch-zoom; do not set maximumScale (a11y). Font ≥16px stops focus-zoom. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${notoSans.variable}`}>
      <head>
        {process.env.NODE_ENV === 'production' ? (
          <>
            <script
              id="meta-pixel"
              dangerouslySetInnerHTML={{ __html: META_PIXEL_HEAD_SCRIPT }}
            />
            <noscript
              dangerouslySetInnerHTML={{
                __html: `<img height="1" width="1" style="display:none" src="${META_PIXEL_NOSCRIPT_IMG}" alt="" />`,
              }}
            />
          </>
        ) : null}
      </head>
      <body className={beVietnam.className}>
        {process.env.NODE_ENV === 'production' ? <MetaPixelRouteTracker /> : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
