import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ANHUNG_BRAND } from './brand';
import { getProductBySlug, getRelatedProducts } from './mock-data';
import { ProductGallery, ProductShareButton } from './product-detail-client';
import './public-home.css';
import './product-detail.css';

export function ProductDetailView({ slug }: { slug: string }) {
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product.slug);

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
              <Link href="/san-pham">Sản phẩm</Link>
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
          <Link href="/san-pham">Sản phẩm</Link>
          <span aria-hidden>/</span>
          <span>{product.title}</span>
        </nav>

        <div className="pd-layout">
          <div className="pd-primary">
            <ProductGallery title={product.title} images={product.gallery} />

            <p className="pd-posted">{product.postedLabel}</p>
            <h1>{product.title}</h1>
            <p className="pd-price">
              {product.priceLabel}
              <span>
                · {product.areaLabel} · {product.location}
              </span>
            </p>

            <dl className="pd-specs">
              <div>
                <dt>Loại</dt>
                <dd>{product.typeLabel}</dd>
              </div>
              <div>
                <dt>Diện tích</dt>
                <dd>{product.areaLabel}</dd>
              </div>
              <div>
                <dt>Mặt tiền</dt>
                <dd>{product.frontageLabel}</dd>
              </div>
              <div>
                <dt>Hướng</dt>
                <dd>{product.directionLabel}</dd>
              </div>
              <div>
                <dt>Pháp lý</dt>
                <dd>{product.legalLabel}</dd>
              </div>
              <div>
                <dt>Vị trí</dt>
                <dd>{product.location}</dd>
              </div>
            </dl>

            <section className="pd-section" aria-labelledby="pd-desc-title">
              <h2 id="pd-desc-title">Mô tả</h2>
              <p>{product.description}</p>
            </section>

            <section className="pd-section" aria-labelledby="pd-hl-title">
              <h2 id="pd-hl-title">Điểm nổi bật</h2>
              <ul className="pd-highlights">
                {product.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
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
            <ProductShareButton product={product} className="ph-btn ph-btn-ghost pd-aside-cta" />
            <p className="pd-aside-addr">{ANHUNG_BRAND.address}</p>
            <p className="pd-aside-note">{ANHUNG_BRAND.services}</p>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="pd-related" aria-labelledby="pd-related-title">
            <div className="ph-section-head">
              <h2 id="pd-related-title">Sản phẩm khác</h2>
              <Link href="/san-pham" className="ph-more">
                Xem tất cả →
              </Link>
            </div>
            <div className="ph-product-grid pd-related-grid">
              {related.map((p) => (
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
          </section>
        ) : null}
      </main>

      <div className="pd-mobile-bar">
        <a className="ph-btn ph-btn-primary" href={`tel:${ANHUNG_BRAND.hotlineTel}`}>
          Gọi {ANHUNG_BRAND.hotlineDisplay}
        </a>
        <ProductShareButton product={product} className="ph-btn ph-btn-ghost" />
      </div>
    </div>
  );
}
