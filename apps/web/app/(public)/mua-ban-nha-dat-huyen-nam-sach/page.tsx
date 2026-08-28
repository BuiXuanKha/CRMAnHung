import Link from 'next/link';
import { JsonLd } from '@/features/public/json-ld';
import { listingItemListJsonLd, sanPhamListMetadata } from '@/features/public/listing-seo';
import { ListingProductGrid } from '@/features/public/listing-product-grid';
import { listPublicCatalog } from '@/features/public/published-listings';
import '@/features/public/public-home.css';

/** On-demand ISR — Nest revalidate khi đăng / gỡ lô. */
export const revalidate = false;

export const metadata = sanPhamListMetadata();

export default async function MuaBanNhaDatListPage() {
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
        <ListingProductGrid listings={listings} />
      </div>
    </div>
  );
}
