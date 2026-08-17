import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Noto_Sans } from 'next/font/google';
import { Providers } from './providers';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${notoSans.variable}`}>
      <body className={beVietnam.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
