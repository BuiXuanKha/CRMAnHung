import Link from 'next/link';
import type { LotShareContact } from '@crmanhung/shared';
import { ANHUNG_BRAND } from './brand';
import { PublicAuthNavLink } from './public-auth-nav';
import { PublicHotlineLink } from './public-hotline-link';
import { ListingContactAside, ListingContactMobileBar, PublicCardContact } from './listing-visitor-contact';
import {
  ProductGallery,
  ProductShareButton,
} from './product-detail-client';
import { LotDetailMetaPixel } from './lot-detail-meta-pixel';
import type { PublicListingView, RelatedListingSection } from './published-listings';
import { listingCommuneHubCrumb, listingCoverAlt, listingImageAltText, listingPageH1 } from './listing-seo';
import { sanitizeListingHtml } from './sanitize-listing-html';
import { saleStatusLabel } from './sale-status-label';
import { listingShareText } from './share';
import {
  PUBLIC_LISTING_PATH,
  listingCanonicalUrl,
  listingCommuneHubPath,
  listingHref,
} from './site';
import './public-home.css';
import './product-detail.css';

/** Gallery from API listing only — no mock Unsplash (BUG-079). */
function listingImages(listing: PublicListingView): string[] {
  if (listing.imageUrls?.length) return listing.imageUrls;
  if (listing.coverImageUrl) return [listing.coverImageUrl];
  return [];
}

function RelatedListingBlock({
  section,
  headingId,
}: {
  section: RelatedListingSection;
  headingId: string;
}) {
  return (
    <section className="pd-related" aria-labelledby={headingId}>
      <div className="ph-section-head">
        <h2 id={headingId}>{section.title}</h2>
        <Link href={section.hubHref || PUBLIC_LISTING_PATH} className="ph-more">
          Xem tất cả →
        </Link>
      </div>
      <div className="ph-product-grid pd-related-grid">
        {section.items.map((p) => (
          <article key={p.slug} className="ph-product">
            <Link href={listingHref(p.slug)} className="ph-product-media">
              {p.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImageUrl} alt={listingCoverAlt(p)} loading="lazy" />
              ) : (
                <span className="ph-product-media-empty">Chưa có ảnh</span>
              )}
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
        ))}
      </div>
    </section>
  );
}

export function ProductDetailView({
  listing,
  relatedSections,
  shareContact = null,
}: {
  listing: PublicListingView;
  relatedSections: RelatedListingSection[];
  shareContact?: LotShareContact | null;
}) {
  const images = listingImages(listing);
  const price = listing.priceLabel ?? 'Liên hệ';
  const area = listing.areaLabel;
  const h1 = listingPageH1(listing);
  const communeCrumb = listingCommuneHubCrumb(listing);
  const bodyHtml = sanitizeListingHtml(listing.bodyHtml ?? '');
  const showHtmlBody = Boolean(bodyHtml);
  const shareUrl = listingCanonicalUrl(listing.slug);
  const shareText = listingShareText(listing);
  const saleLabel = saleStatusLabel(listing.saleStatus);
  const hasSummaryStats = Boolean(
    area || listing.frontageLabel || listing.directionLabel,
  );

  return (
    <div className="ph pd">
      <LotDetailMetaPixel slug={listing.slug} title={h1} kindLabel={listing.kindLabel} />
      <header className="ph-header is-solid">
        <div className="ph-header-inner">
          <Link href="/" className="ph-logo" aria-label={ANHUNG_BRAND.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ANHUNG_BRAND.logoOnLightSrc}
              alt={ANHUNG_BRAND.name}
              width={200}
              height={45}
            />
          </Link>
          <div className="ph-header-right">
            <PublicHotlineLink shareContact={shareContact} />
            <nav className="ph-nav" aria-label="Menu">
              <Link href={PUBLIC_LISTING_PATH}>Sản phẩm</Link>
              <PublicAuthNavLink />
            </nav>
          </div>
        </div>
      </header>

      <main className="pd-main">
        <nav className="pd-breadcrumb" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden>/</span>
          <Link href={PUBLIC_LISTING_PATH}>Nhà đất đang bán</Link>
          <span aria-hidden>/</span>
          {communeCrumb ? (
            <>
              <Link href={communeCrumb.href}>{communeCrumb.name}</Link>
              <span aria-hidden>/</span>
            </>
          ) : null}
          <span>{h1}</span>
        </nav>

        <div className="pd-layout">
          <div className="pd-primary">
            {images.length > 0 ? (
              <ProductGallery
                images={images}
                alts={images.map((url, i) =>
                  listingImageAltText(listing, i, images.length, url),
                )}
              />
            ) : null}

            <h1>{h1}</h1>
            {saleLabel ? <p className="pd-sale-badge">{saleLabel}</p> : null}
            {listing.location ? (
              <p className="pd-location">
                <span className="pd-location-pin" aria-hidden />
                {listing.communeSlug ? (
                  <Link href={listingCommuneHubPath(listing.communeSlug)}>
                    {listing.location}
                  </Link>
                ) : (
                  <span>{listing.location}</span>
                )}
              </p>
            ) : null}

            <div className="pd-summary" role="group" aria-label="Thông tin chính">
              <div className="pd-summary-price">
                <span className="pd-summary-label">Khoảng giá</span>
                <div className="pd-summary-price-line">
                  <strong className="pd-summary-value pd-summary-value--price">{price}</strong>
                  {listing.kindLabel ? (
                    <span className="pd-summary-kind">{listing.kindLabel}</span>
                  ) : null}
                </div>
              </div>
              {hasSummaryStats ? (
                <ul className="pd-summary-specs">
                  {area ? (
                    <li className="pd-summary-spec">
                      <span className="pd-summary-label">Diện tích</span>
                      <strong className="pd-summary-value">{area}</strong>
                    </li>
                  ) : null}
                  {listing.frontageLabel ? (
                    <li className="pd-summary-spec">
                      <span className="pd-summary-label">Mặt tiền</span>
                      <strong className="pd-summary-value">{listing.frontageLabel}</strong>
                    </li>
                  ) : null}
                  {listing.directionLabel ? (
                    <li className="pd-summary-spec">
                      <span className="pd-summary-label">Hướng</span>
                      <strong className="pd-summary-value">{listing.directionLabel}</strong>
                    </li>
                  ) : null}
                </ul>
              ) : null}
              <div className="pd-summary-share">
                <ProductShareButton
                  url={shareUrl}
                  text={shareText}
                  slug={listing.slug}
                  label="Chia sẻ"
                />
              </div>
            </div>

            {!showHtmlBody && listing.excerpt.trim() ? (
              <p className="pd-lead">{listing.excerpt}</p>
            ) : null}

            {showHtmlBody ? (
              <section className="pd-section" aria-labelledby="pd-desc-title">
                <h2 id="pd-desc-title">Mô tả</h2>
                <div
                  className="pd-body"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              </section>
            ) : null}
          </div>

          <ListingContactAside shareContact={shareContact} />
        </div>

        {relatedSections
          .filter((section) => section.items.length > 0)
          .map((section, index) => (
            <RelatedListingBlock
              key={section.title}
              section={section}
              headingId={index === 0 ? 'pd-related-title' : `pd-related-title-${index}`}
            />
          ))}
      </main>

      <ListingContactMobileBar shareContact={shareContact} />
    </div>
  );
}
