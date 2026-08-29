'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listPublishedPublicLots } from '@/features/public-content/api';
import type { PublicGuestLot } from '@/features/public-content/guest-listing';
import { publicWebKeys } from '@/features/public-content/query';
import { ANHUNG_BRAND } from './brand';
import { ProductShareButton } from './product-detail-client';
import { listingShareText } from './share';
import { listingCoverAlt } from './listing-seo';
import { listingCanonicalUrl, listingHref, PUBLIC_LISTING_PATH } from './site';

export function HomeProductSection({ initialLots }: { initialLots: PublicGuestLot[] }) {
  const query = useQuery({
    queryKey: publicWebKeys.publishedLots,
    queryFn: listPublishedPublicLots,
    initialData: initialLots,
  });
  const lots = query.data ?? initialLots;

  return (
    <section id="mua-ban-nha-dat" className="ph-section">
      <div className="ph-section-head">
        <h2>Sản phẩm dành cho bạn</h2>
        {lots.length > 0 ? (
          <Link href={PUBLIC_LISTING_PATH} className="ph-more">
            Xem tất cả →
          </Link>
        ) : null}
      </div>
      {lots.length === 0 ? (
        <p className="ph-product-empty">
          Hiện chưa có sản phẩm đăng bán trên web.{' '}
          <a href={`tel:${ANHUNG_BRAND.hotlineTel}`}>Liên hệ {ANHUNG_BRAND.hotlineDisplay}</a> để
          được tư vấn.
        </p>
      ) : (
        <div className="ph-product-grid">
          {lots.map((lot, i) => (
            <article
              key={lot.id}
              className="ph-product"
              style={{ animationDelay: `${Math.min(i, 7) * 40}ms` }}
            >
              <Link href={listingHref(lot.slug)} className="ph-product-media">
                {lot.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lot.coverImageUrl}
                    alt={listingCoverAlt(lot)}
                    loading={i < 4 ? 'eager' : 'lazy'}
                  />
                ) : (
                  <span className="ph-product-media-empty">Chưa có ảnh</span>
                )}
              </Link>
              <div className="ph-product-body">
                <Link href={listingHref(lot.slug)}>
                  <h3>{lot.title}</h3>
                </Link>
                <p className="ph-product-meta">
                  <span>{lot.priceLabel}</span>
                  {lot.areaLabel ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{lot.areaLabel}</span>
                    </>
                  ) : null}
                </p>
                {lot.location ? <p className="ph-product-loc">{lot.location}</p> : null}
                <div className="ph-product-foot">
                  <span>Xem chi tiết</span>
                  <ProductShareButton
                    url={listingCanonicalUrl(lot.slug)}
                    text={listingShareText(lot)}
                    label="Chia sẻ"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
