import Link from 'next/link';
import { JsonLd } from '@/features/public/json-ld';
import {
  listingCatalogBreadcrumbJsonLd,
  listingItemListJsonLd,
  sanPhamListMetadata,
} from '@/features/public/listing-seo';
import { ListingProductGrid } from '@/features/public/listing-product-grid';
import { PublicListingSearchForm } from '@/features/public/listing-search';
import { listPublicCatalog } from '@/features/public/published-listings';
import { matchPublicListingSearch } from '@crmanhung/shared';
import '@/features/public/public-home.css';

/** On-demand ISR — Nest revalidate khi đăng / gỡ lô. `?q=` đọc lúc request, canonical không đổi. */
export const revalidate = false;

export const metadata = sanPhamListMetadata();

export default async function MuaBanNhaDatListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const listings = await listPublicCatalog();
  const q = (await searchParams).q ?? '';
  const keyword = q.trim();
  const shown = keyword
    ? listings.filter((row) => matchPublicListingSearch(row, keyword))
    : listings;
  const emptyText = keyword
    ? `Không tìm thấy bài đăng phù hợp với «${keyword}».`
    : undefined;
  return (
    <div className="ph">
      <JsonLd data={listingCatalogBreadcrumbJsonLd()} />
      <JsonLd data={listingItemListJsonLd(shown)} />
      <div className="ph-list-page">
        <Link href="/" className="ph-detail-back">
          ← Trang chủ
        </Link>
        <h1>Nhà đất đang bán</h1>
        <div className="ph-list-search">
          <PublicListingSearchForm defaultQuery={keyword} inputId="ph-catalog-q" />
        </div>
        {keyword && shown.length > 0 ? (
          <p>
            {shown.length} bài đăng phù hợp với «{keyword}».
          </p>
        ) : null}
        {!keyword ? (
          <p>Xem và chia sẻ không cần đăng nhập. Chỉ lô admin đã đăng trên web.</p>
        ) : null}
        <ListingProductGrid listings={shown} emptyText={emptyText} />
      </div>
    </div>
  );
}
