'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PublicGuestLot } from '@/features/public-content/guest-listing';
import { ANHUNG_BRAND } from './brand';
import { HomeProductSection } from './home-product-section';
import { PUBLIC_LISTING_PATH } from './site';
import {
  ARTICLE_CATEGORY_LABEL,
  PROJECT_STATUS_LABEL,
  PUBLIC_ARTICLES,
  PUBLIC_PROJECTS,
} from './mock-data';
import './public-home.css';

function BrandLogo({
  className,
  onLight = false,
}: {
  className?: string;
  onLight?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={onLight ? ANHUNG_BRAND.logoOnLightSrc : ANHUNG_BRAND.logoSrc}
      alt={ANHUNG_BRAND.name}
      width={200}
      height={45}
    />
  );
}

export function PublicHome({ initialLots }: { initialLots: PublicGuestLot[] }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="ph">
      <header className={scrolled ? 'ph-header is-solid' : 'ph-header'}>
        <div className="ph-header-inner">
          <Link href="/" className="ph-logo" aria-label={ANHUNG_BRAND.name}>
            <BrandLogo onLight />
          </Link>
          <div className="ph-header-right">
            <a className="ph-hotline" href={`tel:${ANHUNG_BRAND.hotlineTel}`}>
              Hotline {ANHUNG_BRAND.hotlineDisplay}
            </a>
            <nav className="ph-nav" aria-label="Menu chính">
              <a href="#mua-ban-nha-dat">Sản phẩm</a>
              <a href="#du-an">Dự án</a>
              <a href="#bai-viet">Kiến thức</a>
              <Link href="/login" className="ph-nav-login">
                Đăng nhập
              </Link>
            </nav>
          </div>
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
          <p className="ph-hero-kicker">{ANHUNG_BRAND.legalLine}</p>
          <p className="ph-hero-brand">{ANHUNG_BRAND.name}</p>
          <h1>Mua bán · ký gửi BĐS — tư vấn đo đạc, thừa kế, sổ hồng</h1>
          <p className="ph-hero-lead">{ANHUNG_BRAND.services}</p>
          <div className="ph-hero-cta">
            <a className="ph-btn ph-btn-primary" href="#mua-ban-nha-dat">
              Xem sản phẩm
            </a>
            <a className="ph-btn ph-btn-ghost" href={`tel:${ANHUNG_BRAND.hotlineTel}`}>
              Gọi {ANHUNG_BRAND.hotlineDisplay}
            </a>
          </div>
          <p className="ph-hero-contact">
            {ANHUNG_BRAND.address} ·{' '}
            <a href={`tel:${ANHUNG_BRAND.hotlineTel}`}>{ANHUNG_BRAND.hotlineDisplay}</a>
          </p>
        </div>
      </section>

      <HomeProductSection initialLots={initialLots} />

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
            <Link href="/" className="ph-footer-logo" aria-label={ANHUNG_BRAND.name}>
              <BrandLogo />
            </Link>
            <p className="ph-footer-legal">{ANHUNG_BRAND.legalLine}</p>
            <p>{ANHUNG_BRAND.services}</p>
            <p className="ph-footer-contact">
              <a href={`tel:${ANHUNG_BRAND.hotlineTel}`}>
                Hotline: {ANHUNG_BRAND.hotlineDisplay}
              </a>
              <br />
              Địa chỉ: {ANHUNG_BRAND.address}
            </p>
          </div>
          <div className="ph-footer-links">
            <Link href={PUBLIC_LISTING_PATH}>Sản phẩm</Link>
            <Link href="/du-an">Dự án</Link>
            <Link href="/kien-thuc">Kiến thức</Link>
            <Link href="/kinh-nghiem">Kinh nghiệm</Link>
            <Link href="/login">Đăng nhập CRM</Link>
          </div>
        </div>
        <p className="ph-copy">
          © {new Date().getFullYear()} {ANHUNG_BRAND.name} · {ANHUNG_BRAND.website}
        </p>
      </footer>
    </div>
  );
}
