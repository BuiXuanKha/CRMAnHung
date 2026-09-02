'use client';

import { useState } from 'react';
import { guestLotShareUrl } from '@crmanhung/shared';
import { useAuth } from '@/features/auth/auth-context';
import { createListingShareLinkBySlug } from '@/features/lot-shares/api';
import { copySharePayload, shareToFacebook } from './share';
import './share.css';

export function ProductShareButton({
  url,
  text,
  slug,
  className = 'product-share-btn',
  label = 'Chia sẻ',
}: {
  /** Fallback URL khi khách (chưa login) hoặc không tạo được mã share. */
  url: string;
  /** Plain-text mô tả lô (không gồm URL — helper tự nối URL). */
  text?: string;
  /** Slug listing — NV đăng nhập dùng tạo link ?share= */
  slug: string;
  className?: string;
  label?: string;
}) {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<'idle' | 'shared' | 'copied' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const flash = (next: 'shared' | 'copied') => {
    setStatus(next);
    setErrorMsg(null);
    window.setTimeout(() => setStatus('idle'), 3200);
  };

  const onShareFacebook = async () => {
    setErrorMsg(null);
    let shareUrl = url;
    if (!loading && user) {
      try {
        const res = await createListingShareLinkBySlug(slug);
        shareUrl = guestLotShareUrl(res.slug, res.shareCode);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Không tạo được link share có mã nhân viên.';
        setErrorMsg(msg);
        setStatus('error');
        window.setTimeout(() => {
          setStatus('idle');
          setErrorMsg(null);
        }, 5000);
        return;
      }
    }
    try {
      await shareToFacebook(shareUrl, text);
      flash('shared');
    } catch {
      try {
        await copySharePayload(shareUrl, text);
        flash('copied');
      } catch {
        // clipboard may be blocked
      }
    }
  };

  const buttonLabel =
    status === 'shared'
      ? user
        ? 'Đã copy link share — dán Facebook'
        : 'Đã copy — dán vào Facebook'
      : status === 'copied'
        ? 'Đã copy nội dung'
        : status === 'error'
          ? 'Không tạo link share'
          : label;

  return (
    <span className="product-share-wrap">
      <button
        type="button"
        className={className}
        title={
          user
            ? 'Copy mô tả + link share (?share=mã NV) và mở Facebook'
            : 'Copy mô tả + link và mở Facebook để dán'
        }
        onClick={() => void onShareFacebook()}
      >
        {buttonLabel}
      </button>
      {errorMsg ? <span className="product-share-error">{errorMsg}</span> : null}
    </span>
  );
}

export function ProductGallery({
  images,
  alts,
}: {
  images: string[];
  alts: string[];
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
        <div className="pd-gallery-slides">
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src + i}
              src={src}
              alt={alts[i] ?? ''}
              className={i === active ? 'is-active' : undefined}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'low'}
              decoding="async"
              width={1600}
              height={1000}
            />
          ))}
        </div>
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
