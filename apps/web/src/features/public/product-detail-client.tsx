'use client';

import { useState } from 'react';

export function ProductShareButton({
  title,
  text,
  className = 'ph-btn ph-btn-ghost',
  label = 'Chia sẻ',
}: {
  title: string;
  text: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const payload = { title, text, url };
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
    <button type="button" className={className} onClick={() => void share()}>
      {copied ? 'Đã copy link' : label}
    </button>
  );
}

/** Masked hotline until the guest taps «Hiện số» (Batdongsan-style). */
export function RevealPhoneButton({
  display,
  tel,
  className = 'pd-phone-btn',
}: {
  display: string;
  tel: string;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const masked = maskPhoneDisplay(display);

  if (revealed) {
    return (
      <a className={className} href={`tel:${tel}`}>
        {display}
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={() => setRevealed(true)}>
      <span className="pd-phone-btn-num">{masked}</span>
      <span className="pd-phone-btn-action">· Hiện số</span>
    </button>
  );
}

function maskPhoneDisplay(display: string): string {
  const digits = display.replace(/\D/g, '');
  if (digits.length < 7) return display;
  const head = digits.slice(0, 4);
  const mid = digits.slice(4, 7);
  return `${head} ${mid} ***`;
}

export function ProductGallery({
  title,
  images,
}: {
  title: string;
  images: string[];
}) {
  const [active, setActive] = useState(0);
  const total = images.length;
  const current = images[active] ?? images[0];

  if (!current) return null;

  const go = (delta: number) => {
    if (total < 2) return;
    setActive((i) => (i + delta + total) % total);
  };

  return (
    <div className="pd-gallery">
      <div className="pd-gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={`${title} — ảnh ${active + 1}`} />
        {total > 1 ? (
          <>
            <button
              type="button"
              className="pd-gallery-nav pd-gallery-prev"
              aria-label="Ảnh trước"
              onClick={() => go(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="pd-gallery-nav pd-gallery-next"
              aria-label="Ảnh sau"
              onClick={() => go(1)}
            >
              ›
            </button>
            <span className="pd-gallery-count" aria-live="polite">
              {active + 1}/{total}
            </span>
          </>
        ) : null}
      </div>
      {total > 1 ? (
        <div className="pd-gallery-thumbs" role="list">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              role="listitem"
              className={i === active ? 'pd-thumb is-active' : 'pd-thumb'}
              onClick={() => setActive(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              aria-current={i === active ? 'true' : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
