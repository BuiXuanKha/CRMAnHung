import Link from 'next/link';
import { JsonLd } from '@/features/public/json-ld';
import { listingItemListJsonLd, sanPhamListMetadata } from '@/features/public/listing-seo';
import { listPublicCatalog } from '@/features/public/published-listings';
import '@/features/public/public-home.css';

export const metadata = sanPhamListMetadata();

export default async function SanPhamListPage() {
  const listings = await listPublicCatalog();
  return (
    <div className="ph">
      <JsonLd data={listingItemListJsonLd(listings)} />
      <div className="ph-list-page">
        <Link href="/" className="ph-detail-back">
          ← Trang chủ
        </Link>
        <h1>Nhà đất đang bán</h1>
        <p>Xem và chia sẻ không cần đăng nhập. Chỉ lô admin đã đăng trên web.</p>
        {listings.length === 0 ? (
          <p>Hiện chưa có lô đăng bán trên web.</p>
        ) : (
          <div className="ph-product-grid">
            {listings.map((p) => (
              <article key={p.slug} className="ph-product">
                <Link href={`/san-pham/${p.slug}`} className="ph-product-media">
                  {p.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImageUrl} alt={p.title} loading="lazy" />
                  ) : (
                    <span className="ph-product-media-empty">Chưa có ảnh</span>
                  )}
                </Link>
                <div className="ph-product-body">
                  <Link href={`/san-pham/${p.slug}`}>
                    <h3>{p.title}</h3>
                  </Link>
                  <p className="ph-product-meta">
                    <span>{p.priceLabel ?? 'Liên hệ'}</span>
                    {p.areaLabel ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>{p.areaLabel}</span>
                      </>
                    ) : null}
                  </p>
                  {p.location ? <p className="ph-product-loc">{p.location}</p> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
