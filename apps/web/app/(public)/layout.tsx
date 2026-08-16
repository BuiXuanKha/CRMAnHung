import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'An Hưng Land — Bất động sản',
    template: '%s | An Hưng Land',
  },
  description:
    'An Hưng Land — thông tin bất động sản và cổng đăng nhập CRM nội bộ.',
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
      'An Hưng Land — thông tin bất động sản và cổng đăng nhập CRM nội bộ.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'An Hưng Land — Bất động sản',
    description:
      'An Hưng Land — thông tin bất động sản và cổng đăng nhập CRM nội bộ.',
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
