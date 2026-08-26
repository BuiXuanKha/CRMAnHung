'use client';

import { useState } from 'react';

export function ProductShareButton({
  title,
  text,
  className = 'ph-btn ph-btn-ghost',
}: {
  title: string;
  text: string;
  className?: string;
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
      {copied ? 'Đã copy link' : 'Chia sẻ'}
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
  const current = images[active] ?? images[0];

  return (
    <div className="pd-gallery">
      <div className="pd-gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={`${title} — ảnh ${active + 1}`} />
      </div>
      {images.length > 1 ? (
        <div className="pd-gallery-thumbs" role="list">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              role="listitem"
              className={i === active ? 'pd-thumb is-active' : 'pd-thumb'}
              onClick={() => setActive(i)}
              aria-label={`Xem ảnh ${i + 1}`}
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
