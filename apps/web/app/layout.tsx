import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { Providers } from './providers';
import '@/styles/global.css';

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
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
    <html lang="vi">
      <body className={beVietnam.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
