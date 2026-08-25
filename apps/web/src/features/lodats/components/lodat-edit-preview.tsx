'use client';

import { RotateCcw, RotateCw } from 'lucide-react';
import type { LodatImage } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';

type Props = {
  images: LodatImage[];
  selectedIndex: number;
  busy: boolean;
  onOpenGallery: () => void;
  onRotate: (delta: number) => void;
};

export function LodatEditPreview({
  images,
  selectedIndex,
  busy,
  onOpenGallery,
  onRotate,
}: Props) {
  const current = images[selectedIndex] ?? null;
  const rotationDeg = current?.rotationDeg ?? 0;
  const canRotate = Boolean(current?.id && current.source === 'lodat');

  return (
    <div className="ld-edit-gallery ld-edit-area-gallery">
      <div className="ld-edit-gallery-head">
        <h2 className="ld-edit-gallery-title">Xem nhanh hình ảnh</h2>
        {images.length ? (
          <span className="ld-edit-gallery-counter">
            {selectedIndex + 1}/{images.length}
            {rotationDeg ? ` · ${rotationDeg}°` : ''}
          </span>
        ) : null}
        {current ? (
          <span className="ld-edit-gallery-rotate">
            <button
              type="button"
              className="ld-edit-gallery-rotate-btn"
              aria-label="Xoay trái 90°"
              disabled={busy || !canRotate}
              onClick={() => onRotate(-90)}
            >
              <Icon icon={RotateCcw} size={16} />
            </button>
            <button
              type="button"
              className="ld-edit-gallery-rotate-btn"
              aria-label="Xoay phải 90°"
              disabled={busy || !canRotate}
              onClick={() => onRotate(90)}
            >
              <Icon icon={RotateCw} size={16} />
            </button>
          </span>
        ) : null}
      </div>
      <div className="ld-edit-preview-box">
        {current ? (
          <button
            type="button"
            className="ld-edit-preview-open"
            aria-label="Mở xem ảnh phóng to"
            onClick={onOpenGallery}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt=""
              className="ld-edit-preview-img"
              style={
                rotationDeg
                  ? { transform: `rotate(${rotationDeg}deg)` }
                  : undefined
              }
            />
          </button>
        ) : (
          <div className="ld-edit-gallery-empty">Chưa có ảnh</div>
        )}
      </div>
    </div>
  );
}
