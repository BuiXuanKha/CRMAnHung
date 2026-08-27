import Link from 'next/link';
import { ANHUNG_BRAND } from './brand';
import {
  ProductGallery,
  ProductShareButton,
} from './product-detail-client';
import type { PublicListingView } from './published-listings';
import { getProductBySlug } from './mock-data';
import { listingHeadline } from './listing-seo';
import { sanitizeListingHtml } from './sanitize-listing-html';
import { PUBLIC_LISTING_PATH, listingHref } from './site';
import './public-home.css';
import './product-detail.css';

function listingImages(listing: PublicListingView): string[] {
  const product = getProductBySlug(listing.slug);
  if (product?.gallery?.length) return product.gallery;
  if (listing.imageUrls?.length) return listing.imageUrls;
  if (listing.coverImageUrl) return [listing.coverImageUrl];
  return [];
}

function zaloLink(telDigits: string): string {
  return `https://zalo.me/${telDigits}`;
}

export function ProductDetailView({
  listing,
  related,
}: {
  listing: PublicListingView;
  related: PublicListingView[];
}) {
  const product = getProductBySlug(listing.slug);
  const images = listingImages(listing);
  const price = listing.priceLabel ?? 'Liên hệ';
  const area = listing.areaLabel;
  const headline = listingHeadline(listing);
  const bodyHtml = sanitizeListingHtml(listing.bodyHtml ?? '');
  const fallbackBody = product?.description?.trim() || '';
  const showHtmlBody = Boolean(bodyHtml);
  const showPlainBody =
    !showHtmlBody && Boolean(fallbackBody) && fallbackBody !== listing.excerpt.trim();
  const highlights = product?.highlights ?? [];
  const shareText = `${listing.title} — ${price}${area ? ` · ${area}` : ''}`;
  const brandInitial = ANHUNG_BRAND.shortName.slice(0, 1).toUpperCase();

  return (
    <div className="ph pd">
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
            <a className="ph-hotline" href={`tel:${ANHUNG_BRAND.hotlineTel}`}>
              Hotline {ANHUNG_BRAND.hotlineDisplay}
            </a>
            <nav className="ph-nav" aria-label="Menu">
              <Link href={PUBLIC_LISTING_PATH}>Sản phẩm</Link>
              <Link href="/login" className="ph-nav-login">
                Đăng nhập
              </Link>
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
          {listing.location ? (
            <>
              <span className="pd-breadcrumb-loc">{listing.location}</span>
              <span aria-hidden>/</span>
            </>
          ) : null}
          <span>{listing.title}</span>
        </nav>

        <div className="pd-layout">
          <div className="pd-primary">
            {images.length > 0 ? <ProductGallery title={headline} images={images} /> : null}

            {product?.postedLabel ? <p className="pd-posted">{product.postedLabel}</p> : null}
            <h1>{headline}</h1>
            {listing.location ? (
              <p className="pd-location">
                <span className="pd-location-pin" aria-hidden />
                <span>{listing.location}</span>
              </p>
            ) : null}

            <div className="pd-summary" role="group" aria-label="Thông tin chính">
              <div className="pd-summary-item">
                <span className="pd-summary-label">Khoảng giá</span>
                <strong className="pd-summary-value pd-summary-price">{price}</strong>
                {listing.kindLabel ? (
                  <span className="pd-summary-sub">{listing.kindLabel}</span>
                ) : null}
              </div>
              {area ? (
                <div className="pd-summary-item">
                  <span className="pd-summary-label">Diện tích</span>
                  <strong className="pd-summary-value">{area}</strong>
                  {listing.frontageLabel ? (
                    <span className="pd-summary-sub">Mặt tiền {listing.frontageLabel}</span>
                  ) : null}
                </div>
              ) : listing.frontageLabel ? (
                <div className="pd-summary-item">
                  <span className="pd-summary-label">Mặt tiền</span>
                  <strong className="pd-summary-value">{listing.frontageLabel}</strong>
                </div>
              ) : null}
              {listing.directionLabel ? (
                <div className="pd-summary-item">
                  <span className="pd-summary-label">Hướng</span>
                  <strong className="pd-summary-value">{listing.directionLabel}</strong>
                  {product?.legalLabel ? (
                    <span className="pd-summary-sub">{product.legalLabel}</span>
                  ) : null}
                </div>
              ) : product?.legalLabel ? (
                <div className="pd-summary-item">
                  <span className="pd-summary-label">Pháp lý</span>
                  <strong className="pd-summary-value">{product.legalLabel}</strong>
                </div>
              ) : null}
              <div className="pd-summary-actions">
                <ProductShareButton
                  title={listing.title}
                  text={shareText}
                  className="pd-icon-btn"
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
            ) : showPlainBody ? (
              <section className="pd-section" aria-labelledby="pd-desc-title">
                <h2 id="pd-desc-title">Mô tả</h2>
                <p>{fallbackBody}</p>
              </section>
            ) : null}

            {highlights.length > 0 ? (
              <section className="pd-section" aria-labelledby="pd-hl-title">
                <h2 id="pd-hl-title">Điểm nổi bật</h2>
                <ul className="pd-highlights">
                  {highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="pd-aside" aria-label="Liên hệ tư vấn">
            <div className="pd-agent">
              <span className="pd-agent-avatar" aria-hidden>
                {brandInitial}
              </span>
              <div className="pd-agent-meta">
                <p className="pd-agent-name">{ANHUNG_BRAND.name}</p>
                <p className="pd-agent-role">{ANHUNG_BRAND.legalLine}</p>
              </div>
            </div>
            <p className="pd-aside-lead">Xem đất thực tế · tư vấn miễn phí</p>
            <a
              className="pd-zalo-btn"
              href={zaloLink(ANHUNG_BRAND.hotlineTel)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat qua Zalo
            </a>
            <a className="pd-phone-btn" href={`tel:${ANHUNG_BRAND.hotlineTel}`}>
              Gọi {ANHUNG_BRAND.hotlineDisplay}
            </a>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="pd-related" aria-labelledby="pd-related-title">
            <div className="ph-section-head">
              <h2 id="pd-related-title">Bất động sản nổi bật</h2>
              <Link href={PUBLIC_LISTING_PATH} className="ph-more">
                Xem tất cả →
              </Link>
            </div>
            <div className="ph-product-grid pd-related-grid">
              {related.map((p) => (
                <article key={p.slug} className="ph-product">
                  <Link href={listingHref(p.slug)} className="ph-product-media">
                    {p.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImageUrl} alt={p.title} loading="lazy" />
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
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <div className="pd-mobile-bar">
        <a
          className="pd-zalo-btn"
          href={zaloLink(ANHUNG_BRAND.hotlineTel)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Zalo
        </a>
        <a className="pd-phone-btn" href={`tel:${ANHUNG_BRAND.hotlineTel}`}>
          Gọi {ANHUNG_BRAND.hotlineDisplay}
        </a>
      </div>
    </div>
  );
}
