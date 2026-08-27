import Link from 'next/link';
import { ANHUNG_BRAND } from './brand';
import { ProductGallery, ProductShareButton } from './product-detail-client';
import type { PublicListingView } from './published-listings';
import { getProductBySlug } from './mock-data';
import { listingHeadline } from './listing-seo';
import { sanitizeListingHtml } from './sanitize-listing-html';
import { PUBLIC_LISTING_PATH, listingHref } from './site';
import './public-home.css';
import './product-detail.css';

export function ProductDetailView({
  listing,
  related,
}: {
  listing: PublicListingView;
  related: PublicListingView[];
}) {
  const product = getProductBySlug(listing.slug);
  const images = product?.gallery?.length
    ? product.gallery
    : listing.coverImageUrl
      ? [listing.coverImageUrl]
      : [];
  const price = listing.priceLabel ?? 'Liên hệ';
  const area = listing.areaLabel;
  const bodyHtml = sanitizeListingHtml(listing.bodyHtml ?? '');
  const fallbackBody = product?.description?.trim() || '';
  const showHtmlBody = Boolean(bodyHtml);
  const showPlainBody =
    !showHtmlBody && Boolean(fallbackBody) && fallbackBody !== listing.excerpt.trim();
  const highlights = product?.highlights ?? [];

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
          <span>{listingHeadline(listing)}</span>
        </nav>

        <div className="pd-layout">
          <div className="pd-primary">
            {images.length > 0 ? (
              <ProductGallery title={listingHeadline(listing)} images={images} />
            ) : null}

            {product?.postedLabel ? <p className="pd-posted">{product.postedLabel}</p> : null}
            <h1>{listingHeadline(listing)}</h1>
            <p className="pd-price">
              {price}
              <span>
                {area ? ` · ${area}` : ''}
                {listing.location ? ` · ${listing.location}` : ''}
              </span>
            </p>
            {!showHtmlBody && listing.excerpt.trim() ? (
              <p className="pd-lead">{listing.excerpt}</p>
            ) : null}

            <dl className="pd-specs">
              <div>
                <dt>Loại</dt>
                <dd>{listing.kindLabel}</dd>
              </div>
              {area ? (
                <div>
                  <dt>Diện tích</dt>
                  <dd>{area}</dd>
                </div>
              ) : null}
              {listing.frontageLabel ? (
                <div>
                  <dt>Mặt tiền</dt>
                  <dd>{listing.frontageLabel}</dd>
                </div>
              ) : null}
              {listing.directionLabel ? (
                <div>
                  <dt>Hướng</dt>
                  <dd>{listing.directionLabel}</dd>
                </div>
              ) : null}
              {product?.legalLabel ? (
                <div>
                  <dt>Pháp lý</dt>
                  <dd>{product.legalLabel}</dd>
                </div>
              ) : null}
              {listing.location ? (
                <div>
                  <dt>Vị trí</dt>
                  <dd>{listing.location}</dd>
                </div>
              ) : null}
            </dl>

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
            <p className="pd-aside-kicker">{ANHUNG_BRAND.name}</p>
            <p className="pd-aside-lead">Xem đất thực tế · tư vấn miễn phí</p>
            <a className="ph-btn ph-btn-primary pd-aside-cta" href={`tel:${ANHUNG_BRAND.hotlineTel}`}>
              Gọi {ANHUNG_BRAND.hotlineDisplay}
            </a>
            <a
              className="ph-btn ph-btn-ghost pd-aside-cta"
              href={`tel:${ANHUNG_BRAND.hotlineAltTel}`}
            >
              Zalo / máy phụ {ANHUNG_BRAND.hotlineAltDisplay}
            </a>
            <ProductShareButton
              title={listing.title}
              text={`${listing.title} — ${price}${area ? ` · ${area}` : ''}`}
              className="ph-btn ph-btn-ghost pd-aside-cta"
            />
            <p className="pd-aside-addr">{ANHUNG_BRAND.address}</p>
            <p className="pd-aside-note">{ANHUNG_BRAND.services}</p>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="pd-related" aria-labelledby="pd-related-title">
            <div className="ph-section-head">
              <h2 id="pd-related-title">Sản phẩm khác</h2>
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
        <a className="ph-btn ph-btn-primary" href={`tel:${ANHUNG_BRAND.hotlineTel}`}>
          Gọi {ANHUNG_BRAND.hotlineDisplay}
        </a>
        <ProductShareButton
          title={listing.title}
          text={`${listing.title} — ${price}${area ? ` · ${area}` : ''}`}
          className="ph-btn ph-btn-ghost"
        />
      </div>
    </div>
  );
}
