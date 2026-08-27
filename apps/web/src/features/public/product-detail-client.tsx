'use client';

import { useState } from 'react';
import { copyPageUrl, shareToFacebook } from './share';
import './share.css';

export function ProductShareButton({
  url,
  className = 'ph-btn ph-btn-ghost',
  label = 'Chia sẻ',
}: {
  /** Absolute canonical listing URL (no query/hash). */
  url: string;
  className?: string;
  label?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'shared' | 'copied'>('idle');

  const flash = (next: 'shared' | 'copied') => {
    setStatus(next);
    window.setTimeout(() => setStatus('idle'), 3200);
  };

  const onShareFacebook = async () => {
    try {
      await shareToFacebook(url);
      flash('shared');
    } catch {
      try {
        await copyPageUrl(url);
        flash('copied');
      } catch {
        // clipboard may be blocked
      }
    }
  };

  const buttonLabel =
    status === 'shared'
      ? 'Đã copy — dán vào Facebook'
      : status === 'copied'
        ? 'Đã copy link'
        : label;

  return (
    <button
      type="button"
      className={className}
      title="Copy link và mở Facebook để dán"
      onClick={() => void onShareFacebook()}
    >
      {buttonLabel}
    </button>
  );
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
