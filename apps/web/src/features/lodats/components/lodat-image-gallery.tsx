'use client';

import { useCallback, useEffect, useState } from 'react';
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
import './lodat-image-gallery.css';

const SWIPE_PX = 48;

type Props = {
  title: string;
  urls: string[];
  startIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  onToast?: (message: string) => void;
  onError?: (message: string) => void;
};

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function fileNameFromUrl(url: string, index: number): string {
  try {
    const path = new URL(url, window.location.origin).pathname;
    const base = path.split('/').pop() || `anh-lo-${index + 1}.jpg`;
    return base.includes('.') ? base : `${base}.jpg`;
  } catch {
    return `anh-lo-${index + 1}.jpg`;
  }
}

async function downloadRotatedImage(url: string, rotationDeg: number, fileName: string) {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error('Không tải được ảnh');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Không đọc được ảnh'));
      el.src = objectUrl;
    });

    const deg = normalizeDeg(rotationDeg);
    const swap = deg === 90 || deg === 270;
    const canvas = document.createElement('canvas');
    canvas.width = swap ? img.naturalHeight : img.naturalWidth;
    canvas.height = swap ? img.naturalWidth : img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Không tạo được ảnh tải về');

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    const outType = blob.type.includes('png') ? 'image/png' : 'image/jpeg';
    const outBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Không tạo được file tải về'))),
        outType,
        0.92,
      );
    });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(outBlob);
    a.download = fileName.replace(/\.[^.]+$/, '') + (outType === 'image/png' ? '.png' : '.jpg');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function LodatImageGallery({
  title,
  urls,
  startIndex = 0,
  onClose,
  onIndexChange,
  onToast,
  onError,
}: Props) {
  const [index, setIndex] = useState(startIndex);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [busyDownload, setBusyDownload] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const count = urls.length;
  const safeIndex = count ? Math.min(Math.max(0, index), count - 1) : 0;
  const url = urls[safeIndex] ?? '';
  const rotationDeg = rotations[safeIndex] ?? 0;

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
    setRotations((cur) => ({
      ...cur,
      [safeIndex]: normalizeDeg((cur[safeIndex] ?? 0) + delta),
    }));
  }

  async function handleDownload() {
    if (!url || busyDownload) return;
    setBusyDownload(true);
    try {
      await downloadRotatedImage(url, rotationDeg, fileNameFromUrl(url, safeIndex));
      onToast?.('Đã tải ảnh về máy.');
    } catch {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
        onToast?.('Đã mở ảnh — giữ để lưu nếu trình duyệt chặn tải.');
      } catch {
        onError?.('Không tải được ảnh về máy.');
      }
    } finally {
      setBusyDownload(false);
    }
  }

  if (count < 1 || !url) return null;

  return (
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
        <button
          type="button"
          className="ld-img-gallery-download"
          disabled={busyDownload}
          onClick={() => void handleDownload()}
        >
          <Icon icon={Download} size={16} />
          {busyDownload ? 'Đang tải…' : 'Tải về'}
        </button>

        {count > 1 ? (
          <div className="ld-img-gallery-dots" role="tablist" aria-label="Chọn ảnh">
            {urls.map((_, i) => (
              <button
                key={`${urls[i]}-${i}`}
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
        <button type="button" className="ld-img-gallery-rotate" onClick={() => rotate(-90)}>
          <Icon icon={RotateCcw} size={18} />
          Xoay trái
        </button>
        <button type="button" className="ld-img-gallery-rotate" onClick={() => rotate(90)}>
          <Icon icon={RotateCw} size={18} />
          Xoay phải
        </button>
      </footer>
    </div>
  );
}
