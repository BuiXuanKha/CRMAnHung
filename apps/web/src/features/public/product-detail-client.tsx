'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { copyPageUrl, openFacebookShare } from './share';
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
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onFacebook = () => {
    setOpen(false);
    openFacebookShare(url);
  };

  const onCopy = async () => {
    try {
      await copyPageUrl(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } finally {
      setOpen(false);
    }
  };

  return (
    <div className="pd-share" ref={rootRef}>
      <button
        type="button"
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {copied ? 'Đã copy link' : label}
      </button>
      {open ? (
        <div className="pd-share-menu" id={menuId} role="menu">
          <button type="button" role="menuitem" className="pd-share-item" onClick={onFacebook}>
            Facebook
          </button>
          <button type="button" role="menuitem" className="pd-share-item" onClick={() => void onCopy()}>
            Sao chép link
          </button>
        </div>
      ) : null}
    </div>
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
