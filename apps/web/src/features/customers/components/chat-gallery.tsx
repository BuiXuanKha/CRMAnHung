'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { CrmDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';

type Props = {
  title: string;
  urls: string[];
  rotations: number[];
  startIndex: number;
  onClose: () => void;
};

export function ChatImageGallery({
  title,
  urls,
  rotations,
  startIndex,
  onClose,
}: Props) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    if (urls.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setIndex((i) => (i - 1 + urls.length) % urls.length);
      }
      if (e.key === 'ArrowRight') {
        setIndex((i) => (i + 1) % urls.length);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [urls.length]);

  if (urls.length === 0) return null;

  const safeIndex = Math.min(Math.max(0, index), urls.length - 1);
  const deg = rotations[safeIndex] ?? 0;

  return (
    <CrmDialog
      open
      title={title}
      icon={Images}
      onClose={onClose}
      className="kh-chat-gallery-dialog"
    >
      <div className="kh-chat-gallery">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[safeIndex]}
          alt=""
          style={deg ? { transform: `rotate(${deg}deg)` } : undefined}
        />
        <div className="kh-chat-gallery-nav">
          <button
            type="button"
            className="crm-btn"
            disabled={urls.length < 2}
            onClick={() => setIndex((i) => (i - 1 + urls.length) % urls.length)}
          >
            <Icon icon={ChevronLeft} size={16} /> Trước
          </button>
          <span>
            {safeIndex + 1} / {urls.length}
          </span>
          <button
            type="button"
            className="crm-btn"
            disabled={urls.length < 2}
            onClick={() => setIndex((i) => (i + 1) % urls.length)}
          >
            Sau <Icon icon={ChevronRight} size={16} />
          </button>
        </div>
      </div>
    </CrmDialog>
  );
}
