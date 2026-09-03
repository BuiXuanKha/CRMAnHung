'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  RotateCw,
  Scan,
  X,
} from 'lucide-react';
import { Icon } from '@/shared/ui/icon';
import type { LodatImage } from '@crmanhung/shared';
import {
  downloadGalleryImage,
  fileNameFromImageUrl,
  normalizeRotationDeg,
} from './lodat-image-download';
import './lodat-image-gallery.css';

const SWIPE_PX = 48;

type Props = {
  title: string;
  images: LodatImage[];
  startIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  /** Persist rotate for lodat-sourced images; return next deg or throw. */
  onRotate?: (image: LodatImage, nextDeg: number) => Promise<number>;
  onToast?: (message: string) => void;
  onError?: (message: string) => void;
};

export function LodatImageGallery({
  title,
  images,
  startIndex = 0,
  onClose,
  onIndexChange,
  onRotate,
  onToast,
  onError,
}: Props) {
  const [index, setIndex] = useState(startIndex);
  const [localRotations, setLocalRotations] = useState<Record<string, number>>({});
  const [busyDownload, setBusyDownload] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [busyRotate, setBusyRotate] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const img of images) {
      const key = img.id ?? img.url;
      next[key] = normalizeRotationDeg(img.rotationDeg ?? 0);
    }
    setLocalRotations(next);
  }, [images]);

  const count = images.length;
  const safeIndex = count ? Math.min(Math.max(0, index), count - 1) : 0;
  const current = images[safeIndex] ?? null;
  const url = current?.url ?? '';
  const rotationKey = current ? (current.id ?? current.url) : '';
  const rotationDeg = rotationKey ? (localRotations[rotationKey] ?? 0) : 0;

  const goTo = useCallback(
    (next: number) => {
      if (count < 1) return;
      const n = ((next % count) + count) % count;
      setIndex(n);
      onIndexChange?.(n);
    },
    [count, onIndexChange],
  );

  const goPrev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);
  const goNext = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    setDownloadDone(false);
  }, [safeIndex, url]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext]);

  function rotate(delta: number) {
    if (!current || busyRotate) return;
    const nextDeg = normalizeRotationDeg(rotationDeg + delta);

    if (current.source !== 'lodat' || !current.id || !onRotate) {
      setLocalRotations((cur) => ({ ...cur, [rotationKey]: nextDeg }));
      onToast?.('Ảnh dự án chung — xoay chỉ trong phiên, không lưu DB.');
      return;
    }

    setLocalRotations((cur) => ({ ...cur, [rotationKey]: nextDeg }));
    setBusyRotate(true);
    void onRotate(current, nextDeg)
      .then((saved) => {
        setLocalRotations((cur) => ({ ...cur, [rotationKey]: normalizeRotationDeg(saved) }));
        onToast?.('Đã lưu góc xoay ảnh.');
      })
      .catch((err: Error) => {
        setLocalRotations((cur) => ({ ...cur, [rotationKey]: rotationDeg }));
        onError?.(err.message || 'Không lưu được góc xoay.');
      })
      .finally(() => setBusyRotate(false));
  }

  async function handleDownload() {
    if (!url || busyDownload) return;
    setBusyDownload(true);
    try {
      const result = await downloadGalleryImage(
        url,
        rotationDeg,
        fileNameFromImageUrl(url, safeIndex),
      );
      if (result === 'cancelled') return;
      setDownloadDone(true);
      onToast?.('Đã tải ảnh về máy.');
    } catch (err) {
      setDownloadDone(false);
      onError?.((err as Error).message || 'Không tải được ảnh về máy.');
    } finally {
      setBusyDownload(false);
    }
  }

  function stopOverlayPointer(e: { stopPropagation: () => void }) {
    e.stopPropagation();
  }

  const downloadLabel = busyDownload ? 'Đang tải…' : downloadDone ? 'Đã tải' : 'Tải về';

  const downloadButton = (className: string) => (
    <button
      type="button"
      className={className}
      disabled={busyDownload}
      aria-label={
        busyDownload ? 'Đang tải ảnh' : downloadDone ? 'Đã tải ảnh' : 'Tải ảnh về'
      }
      onClick={(e) => {
        e.stopPropagation();
        void handleDownload();
      }}
      onTouchStart={stopOverlayPointer}
      onTouchEnd={stopOverlayPointer}
    >
      <Icon icon={Download} size={16} />
      {downloadLabel}
    </button>
  );

  if (!mounted || count < 1 || !url) return null;

  return createPortal(
    <div
      className="ld-img-gallery"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem ảnh ${title}`}
    >
      <header className="ld-img-gallery-top">
        <div className="ld-img-gallery-heading">
          <h2 className="ld-img-gallery-title">{title}</h2>
          <p className="ld-img-gallery-counter" aria-live="polite">
            {safeIndex + 1} / {count}
          </p>
        </div>
        <button
          type="button"
          className="ld-img-gallery-close"
          aria-label="Đóng"
          onClick={onClose}
        >
          <Icon icon={X} size={22} />
        </button>
      </header>

      <div
        className="ld-img-gallery-stage"
        onTouchStart={(e) => {
          const t = e.touches[0];
          setTouchStart({ x: t.clientX, y: t.clientY });
        }}
        onTouchEnd={(e) => {
          if (!touchStart || count < 2) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - touchStart.x;
          const dy = t.clientY - touchStart.y;
          setTouchStart(null);
          if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
          if (dx < 0) goNext();
          else goPrev();
        }}
      >
        {count > 1 ? (
          <button
            type="button"
            className="ld-img-gallery-nav prev"
            aria-label="Ảnh trước"
            onClick={goPrev}
          >
            <Icon icon={ChevronLeft} size={22} />
          </button>
        ) : null}

        <div className="ld-img-gallery-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="ld-img-gallery-img"
            style={{ transform: `rotate(${rotationDeg}deg)` }}
            draggable={false}
          />
          <a
            className="ld-img-gallery-scan"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Mở ảnh gốc trong tab mới"
            title="Mở ảnh gốc"
          >
            <Icon icon={Scan} size={16} />
          </a>
          {downloadButton('ld-img-gallery-download ld-img-gallery-download--overlay')}
        </div>

        {count > 1 ? (
          <button
            type="button"
            className="ld-img-gallery-nav next"
            aria-label="Ảnh sau"
            onClick={goNext}
          >
            <Icon icon={ChevronRight} size={22} />
          </button>
        ) : null}
      </div>

      <div className="ld-img-gallery-mid">
        {downloadButton('ld-img-gallery-download ld-img-gallery-download--mid')}

        {count > 1 ? (
          <div className="ld-img-gallery-dots" role="tablist" aria-label="Chọn ảnh">
            {images.map((img, i) => (
              <button
                key={img.id ?? `${img.url}-${i}`}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Ảnh ${i + 1}`}
                className={['ld-img-gallery-dot', i === safeIndex ? 'active' : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        ) : null}

        <p className="ld-img-gallery-hint">
          Vuốt trái/phải đổi ảnh • Tải về • Nút xoay ở dưới
        </p>
      </div>

      <footer className="ld-img-gallery-actions">
        <button
          type="button"
          className="ld-img-gallery-rotate"
          disabled={busyRotate}
          onClick={() => rotate(-90)}
        >
          <Icon icon={RotateCcw} size={18} />
          Xoay trái
        </button>
        <button
          type="button"
          className="ld-img-gallery-rotate"
          disabled={busyRotate}
          onClick={() => rotate(90)}
        >
          <Icon icon={RotateCw} size={18} />
          Xoay phải
        </button>
      </footer>
    </div>,
    document.body,
  );
}
