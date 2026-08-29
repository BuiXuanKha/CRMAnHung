import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { publicSearchRobots } from '@/features/public/search-index';
import { PUBLIC_OG_DEFAULT, PUBLIC_SITE_ORIGIN } from '@/features/public/site';
import './public.css';

export const metadata: Metadata = {
  title: {
    default: 'An Hưng Land — Văn phòng giao dịch bất động sản',
    template: '%s | An Hưng Land',
  },
  description:
    'An Hưng Land — mua bán, ký gửi BĐS. Hotline 0977.656.280. Địa chỉ BT6.8 KĐT Tây Nam Sách.',
  alternates: {
    canonical: PUBLIC_SITE_ORIGIN,
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: PUBLIC_SITE_ORIGIN,
    siteName: 'An Hưng Land',
    title: 'An Hưng Land — Văn phòng giao dịch bất động sản',
    description:
      'An Hưng Land — mua bán, ký gửi BĐS. Hotline 0977.656.280. Địa chỉ BT6.8 KĐT Tây Nam Sách.',
    images: [{ url: PUBLIC_OG_DEFAULT, alt: 'An Hưng Land' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'An Hưng Land — Văn phòng giao dịch bất động sản',
    description:
      'An Hưng Land — mua bán, ký gửi BĐS. Hotline 0977.656.280. Địa chỉ BT6.8 KĐT Tây Nam Sách.',
    images: [PUBLIC_OG_DEFAULT],
  },
  robots: publicSearchRobots(),
};

/** Layout trang public (landing / marketing) — tách khỏi CRM shell. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="public-shell">{children}</div>;
}
