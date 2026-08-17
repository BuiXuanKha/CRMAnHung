import type { Metadata } from 'next';
import Link from 'next/link';
import { PUBLIC_PRODUCTS } from '@/features/public/mock-data';
import '@/features/public/public-home.css';

export const metadata: Metadata = {
  title: 'Sản phẩm',
  description: 'Danh sách sản phẩm đang giới thiệu tại An Hưng Land.',
  alternates: { canonical: 'https://anhungland.com/san-pham' },
};

export default function SanPhamListPage() {
  return (
    <div className="ph">
      <div className="ph-list-page">
        <Link href="/" className="ph-detail-back">
          ← Trang chủ
        </Link>
        <h1>Sản phẩm</h1>
        <p>Xem và chia sẻ không cần đăng nhập.</p>
        <div className="ph-product-grid">
          {PUBLIC_PRODUCTS.map((p) => (
            <article key={p.id} className="ph-product">
              <Link href={`/san-pham/${p.slug}`} className="ph-product-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.title} loading="lazy" />
              </Link>
              <div className="ph-product-body">
                <Link href={`/san-pham/${p.slug}`}>
                  <h3>{p.title}</h3>
                </Link>
                <p className="ph-product-meta">
                  <span>{p.priceLabel}</span>
                  <span aria-hidden>·</span>
                  <span>{p.areaLabel}</span>
                </p>
                <p className="ph-product-loc">{p.location}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
