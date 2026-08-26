'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listPublishedPublicLots } from '@/features/public-content/api';
import type { PublicGuestLot } from '@/features/public-content/guest-listing';
import { publicWebKeys } from '@/features/public-content/query';
import { ANHUNG_BRAND } from './brand';

function ShareButton({ lot }: { lot: PublicGuestLot }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/san-pham/${lot.slug}`;
    const meta = lot.areaLabel
      ? `${lot.title} — ${lot.priceLabel} · ${lot.areaLabel}`
      : `${lot.title} — ${lot.priceLabel}`;
    const payload = { title: lot.title, text: meta, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      // clipboard fallback
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

export function HomeProductSection({ initialLots }: { initialLots: PublicGuestLot[] }) {
  const query = useQuery({
    queryKey: publicWebKeys.publishedLots,
    queryFn: listPublishedPublicLots,
    initialData: initialLots,
  });
  const lots = query.data ?? initialLots;

  return (
    <section id="san-pham" className="ph-section">
      <div className="ph-section-head">
        <h2>Sản phẩm dành cho bạn</h2>
        {lots.length > 0 ? (
          <Link href="/san-pham" className="ph-more">
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
              <Link href={`/san-pham/${lot.slug}`} className="ph-product-media">
                {lot.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lot.coverImageUrl}
                    alt={lot.title}
                    loading={i < 4 ? 'eager' : 'lazy'}
                  />
                ) : (
                  <span className="ph-product-media-empty">Chưa có ảnh</span>
                )}
              </Link>
              <div className="ph-product-body">
                <Link href={`/san-pham/${lot.slug}`}>
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
                  <ShareButton lot={lot} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
