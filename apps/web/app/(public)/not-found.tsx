import type { Metadata } from 'next';
import Link from 'next/link';
import { ANHUNG_BRAND } from '@/features/public/brand';
import { PUBLIC_LISTING_PATH, PUBLIC_SITE_ORIGIN } from '@/features/public/site';
import '@/features/public/public-home.css';

export const metadata: Metadata = {
  title: 'Không tìm thấy trang',
  description: 'Trang không tồn tại hoặc đã được gỡ khỏi web An Hưng Land.',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: {
    title: 'Không tìm thấy trang',
    description: 'Trang không tồn tại hoặc đã được gỡ khỏi web An Hưng Land.',
    url: PUBLIC_SITE_ORIGIN,
    type: 'website',
    locale: 'vi_VN',
    siteName: ANHUNG_BRAND.name,
  },
};

export default function PublicNotFound() {
  return (
    <div className="ph">
      <div className="ph-list-page">
        <Link href="/" className="ph-detail-back">
          ← Trang chủ
        </Link>
        <h1>Không tìm thấy trang</h1>
        <p>Liên kết có thể đã hết hạn hoặc nội dung đã được gỡ khỏi web.</p>
        <p>
          <Link href={PUBLIC_LISTING_PATH}>Xem nhà đất đang bán</Link>
        </p>
      </div>
    </div>
  );
}
