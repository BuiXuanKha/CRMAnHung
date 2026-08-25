'use client';

import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { LODAT_MAX_UPLOAD_IMAGES, type LodatImage } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';

type Props = {
  images: LodatImage[];
  canEditImages: boolean;
  isProject: boolean;
  busy: boolean;
  uploading: boolean;
  onUpload: (files: FileList | null) => void;
  onDelete: (imageId: string) => void;
};

export function LodatEditImages({
  images,
  canEditImages,
  isProject,
  busy,
  uploading,
  onUpload,
  onDelete,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const lodatCount = images.filter((i) => i.source === 'lodat').length;

  return (
    <section className="ld-edit-card">
      <h2>Hình ảnh</h2>
      {canEditImages ? (
        <p className="ld-edit-hint">
          Ảnh bạn thêm: tối đa {LODAT_MAX_UPLOAD_IMAGES} (chọn file). Ảnh dự án chung
          chỉ xem trên lô dự án.
        </p>
      ) : (
        <p className="ld-edit-hint">
          {isProject
            ? 'Ảnh dự án chỉ xem. Admin sửa ảnh trên sổ địa chỉ.'
            : 'Bạn không có quyền thêm hoặc gỡ ảnh trên lô này.'}
        </p>
      )}

      {canEditImages ? (
        <div className="ld-edit-upload-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="ld-edit-file-input"
            disabled={busy || lodatCount >= LODAT_MAX_UPLOAD_IMAGES}
            onChange={(e) => {
              onUpload(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="ld-edit-upload-btn"
            disabled={busy || lodatCount >= LODAT_MAX_UPLOAD_IMAGES}
            onClick={() => fileRef.current?.click()}
          >
            <Icon icon={ImagePlus} size={16} />
            {uploading ? 'Đang tải…' : 'Thêm ảnh'}
          </button>
        </div>
      ) : null}

      {images.length ? (
        <div className="ld-edit-thumbs">
          {images.map((img, idx) => (
            <div key={img.id ?? `${img.url}-${idx}`} className="ld-edit-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                style={
                  img.rotationDeg
                    ? { transform: `rotate(${img.rotationDeg}deg)` }
                    : undefined
                }
              />
              {img.source === 'address' ? (
                <span className="ld-edit-thumb-badge">Dự án</span>
              ) : null}
              {canEditImages && img.source === 'lodat' && img.id ? (
                <button
                  type="button"
                  className="ld-edit-thumb-del"
                  aria-label="Gỡ ảnh"
                  disabled={busy}
                  onClick={() => onDelete(img.id!)}
                >
                  <Icon icon={X} size={14} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="ld-edit-hint">Chưa có ảnh</p>
      )}
    </section>
  );
}
