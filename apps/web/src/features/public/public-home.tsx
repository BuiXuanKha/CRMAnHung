'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ARTICLE_CATEGORY_LABEL,
  PROJECT_STATUS_LABEL,
  PUBLIC_ARTICLES,
  PUBLIC_PRODUCTS,
  PUBLIC_PROJECTS,
  type PublicProduct,
} from './mock-data';
import './public-home.css';

function ShareButton({ product }: { product: PublicProduct }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/san-pham/${product.slug}`;
    const payload = {
      title: product.title,
      text: `${product.title} — ${product.priceLabel} · ${product.areaLabel}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      // fall through to clipboard
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button type="button" className="ph-share" onClick={() => void share()} title="Chia sẻ">
      {copied ? 'Đã copy' : 'Chia sẻ'}
    </button>
  );
}

export function PublicHome() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="ph">
      <header className={scrolled ? 'ph-header is-solid' : 'ph-header'}>
        <div className="ph-header-inner">
          <Link href="/" className="ph-logo">
            An Hưng Land
          </Link>
          <nav className="ph-nav" aria-label="Menu chính">
            <a href="#san-pham">Sản phẩm</a>
            <a href="#du-an">Dự án</a>
            <a href="#bai-viet">Kiến thức</a>
            <Link href="/login">Đăng nhập</Link>
          </nav>
        </div>
      </header>

      <section className="ph-hero" aria-label="Thương hiệu An Hưng Land">
        <div
          className="ph-hero-media"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80)',
          }}
        />
        <div className="ph-hero-veil" />
        <div className="ph-hero-content">
          <p className="ph-hero-brand">An Hưng Land</p>
          <h1>Đất nền &amp; nhà phố Đồng Nai — rõ pháp lý, đồng hành lâu dài</h1>
          <p className="ph-hero-lead">
            Khám phá sản phẩm đang mở bán. Không cần đăng nhập để xem và chia sẻ.
          </p>
          <div className="ph-hero-cta">
            <a className="ph-btn ph-btn-primary" href="#san-pham">
              Xem sản phẩm
            </a>
            <a className="ph-btn ph-btn-ghost" href="#du-an">
              Dự án nổi bật
            </a>
          </div>
        </div>
      </section>

      <section id="san-pham" className="ph-section">
        <div className="ph-section-head">
          <h2>Sản phẩm dành cho bạn</h2>
          <Link href="/san-pham" className="ph-more">
            Xem tất cả →
          </Link>
        </div>
        <div className="ph-product-grid">
          {PUBLIC_PRODUCTS.map((p, i) => (
            <article
              key={p.id}
              className="ph-product"
              style={{ animationDelay: `${Math.min(i, 7) * 40}ms` }}
            >
              <Link href={`/san-pham/${p.slug}`} className="ph-product-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.title} loading={i < 4 ? 'eager' : 'lazy'} />
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
                <div className="ph-product-foot">
                  <span>{p.postedLabel}</span>
                  <ShareButton product={p} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="du-an" className="ph-section ph-section-muted">
        <div className="ph-section-head">
          <h2>Dự án nổi bật</h2>
          <Link href="/du-an" className="ph-more">
            Xem thêm →
          </Link>
        </div>
        <div className="ph-project-row">
          {PUBLIC_PROJECTS.map((pj) => (
            <Link key={pj.id} href={`/du-an/${pj.slug}`} className="ph-project">
              <div className="ph-project-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pj.imageUrl} alt={pj.title} loading="lazy" />
                <span className="ph-photo-count">{pj.photoCount} ảnh</span>
              </div>
              <div className="ph-project-body">
                <span
                  className={
                    pj.status === 'DANG_MO_BAN'
                      ? 'ph-badge ph-badge-open'
                      : 'ph-badge ph-badge-soon'
                  }
                >
                  {PROJECT_STATUS_LABEL[pj.status]}
                </span>
                <h3>{pj.title}</h3>
                <p>
                  {pj.areaLabel} · {pj.location}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="bai-viet" className="ph-section">
        <div className="ph-section-head">
          <h2>Tin dự án · Kiến thức · Kinh nghiệm</h2>
          <Link href="/kien-thuc" className="ph-more">
            Xem thêm →
          </Link>
        </div>
        <div className="ph-article-row">
          {PUBLIC_ARTICLES.map((a, idx) => (
            <Link
              key={a.id}
              href={
                a.category === 'du-an'
                  ? `/du-an/${a.slug}`
                  : a.category === 'kinh-nghiem'
                    ? `/kinh-nghiem/${a.slug}`
                    : `/kien-thuc/${a.slug}`
              }
              className="ph-article"
            >
              <div className="ph-article-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imageUrl} alt={a.title} loading="lazy" />
              </div>
              <div className="ph-article-body">
                <span className="ph-article-idx">{String(idx + 1).padStart(2, '0')}</span>
                <div>
                  <p className="ph-article-cat">{ARTICLE_CATEGORY_LABEL[a.category]}</p>
                  <h3>{a.title}</h3>
                  <p className="ph-article-excerpt">{a.excerpt}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="ph-footer">
        <div className="ph-footer-inner">
          <div>
            <p className="ph-footer-brand">An Hưng Land</p>
            <p>Đồng hành pháp lý rõ ràng — sản phẩm Đồng Nai &amp; vùng phụ cận.</p>
          </div>
          <div className="ph-footer-links">
            <Link href="/san-pham">Sản phẩm</Link>
            <Link href="/du-an">Dự án</Link>
            <Link href="/kien-thuc">Kiến thức</Link>
            <Link href="/kinh-nghiem">Kinh nghiệm</Link>
            <Link href="/login">Đăng nhập CRM</Link>
          </div>
        </div>
        <p className="ph-copy">© {new Date().getFullYear()} An Hưng Land. Mock FE — chưa nối CMS.</p>
      </footer>
    </div>
  );
}
