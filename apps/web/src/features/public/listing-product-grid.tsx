import Link from 'next/link';
import type { PublicListingCard } from '@crmanhung/shared';
import { PublicCardContact } from './listing-visitor-contact';
import { listingCoverAlt } from './listing-seo';
import { saleStatusLabel } from './sale-status-label';
import { listingHref } from './site';

type Props = {
  listings: PublicListingCard[];
  emptyText?: string;
};

/** Shared guest product grid — catalog list + hub pages. */
export function ListingProductGrid({ listings, emptyText }: Props) {
  if (listings.length === 0) {
    return <p>{emptyText ?? 'Hiện chưa có lô trên web.'}</p>;
  }
  return (
    <div className="ph-product-grid">
      {listings.map((p) => {
        const saleLabel = saleStatusLabel(p.saleStatus);
        return (
          <article key={p.slug} className="ph-product">
            <Link href={listingHref(p.slug)} className="ph-product-media">
              {p.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImageUrl} alt={listingCoverAlt(p)} loading="lazy" />
              ) : (
                <span className="ph-product-media-empty">Chưa có ảnh</span>
              )}
              {saleLabel ? <span className="ph-product-sale">{saleLabel}</span> : null}
            </Link>
            <div className="ph-product-body">
              <Link href={listingHref(p.slug)}>
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
              <PublicCardContact />
            </div>
          </article>
        );
      })}
    </div>
  );
}
