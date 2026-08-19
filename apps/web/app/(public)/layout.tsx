import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { MetaPixel } from '@/features/public/meta-pixel';
import './public.css';

export const metadata: Metadata = {
  title: {
    default: 'An Hưng Land — Văn phòng giao dịch bất động sản',
    template: '%s | An Hưng Land',
  },
  description:
    'An Hưng Land — mua bán, ký gửi BĐS. Hotline 0977.656.280. Địa chỉ BT6.8 KĐT Tây Nam Sách.',
  alternates: {
    canonical: 'https://anhungland.com',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://anhungland.com',
    siteName: 'An Hưng Land',
    title: 'An Hưng Land — Văn phòng giao dịch bất động sản',
    description:
      'An Hưng Land — mua bán, ký gửi BĐS. Hotline 0977.656.280. Địa chỉ BT6.8 KĐT Tây Nam Sách.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'An Hưng Land — Văn phòng giao dịch bất động sản',
    description:
      'An Hưng Land — mua bán, ký gửi BĐS. Hotline 0977.656.280. Địa chỉ BT6.8 KĐT Tây Nam Sách.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** Layout trang public (landing / marketing) — tách khỏi CRM shell. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-shell">
      <MetaPixel />
      {children}
    </div>
  );
}
