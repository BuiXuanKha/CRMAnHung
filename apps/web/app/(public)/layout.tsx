import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './public.css';

export const metadata: Metadata = {
  title: {
    default: 'An Hưng Land — Bất động sản',
    template: '%s | An Hưng Land',
  },
  description:
    'An Hưng Land — đất nền, nhà phố Đồng Nai. Xem sản phẩm và chia sẻ không cần đăng nhập.',
  alternates: {
    canonical: 'https://anhungland.com',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://anhungland.com',
    siteName: 'An Hưng Land',
    title: 'An Hưng Land — Bất động sản',
    description:
      'An Hưng Land — đất nền, nhà phố Đồng Nai. Xem sản phẩm và chia sẻ không cần đăng nhập.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'An Hưng Land — Bất động sản',
    description:
      'An Hưng Land — đất nền, nhà phố Đồng Nai. Xem sản phẩm và chia sẻ không cần đăng nhập.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** Layout trang public (landing / marketing) — tách khỏi CRM shell. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="public-shell">{children}</div>;
}
