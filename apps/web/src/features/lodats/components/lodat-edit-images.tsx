'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { LODAT_MAX_UPLOAD_IMAGES, type LodatImage } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';

type Props = {
  images: LodatImage[];
  selectedIndex: number;
  canEditImages: boolean;
  isProject: boolean;
  busy: boolean;
  uploading: boolean;
  onSelect: (index: number) => void;
  onUpload: (files: FileList | File[]) => void;
  onDelete: (imageId: string) => void;
};

function filterImageFiles(list: FileList | File[] | null | undefined): File[] {
  return Array.from(list ?? []).filter((f) =>
    String(f.type || '').startsWith('image/'),
  );
}

export function LodatEditImages({
  images,
  selectedIndex,
  canEditImages,
  isProject,
  busy,
  uploading,
  onSelect,
  onUpload,
  onDelete,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const lodatCount = images.filter((i) => i.source === 'lodat').length;
  const atLimit = lodatCount >= LODAT_MAX_UPLOAD_IMAGES;
  const pasteDisabled = busy || !canEditImages || atLimit;

  function importFiles(list: FileList | File[] | null | undefined) {
    const files = filterImageFiles(list);
    if (!files.length || pasteDisabled) return;
    onUpload(files);
  }

  function onPaste(e: React.ClipboardEvent) {
    if (pasteDisabled) return;
    const items = e.clipboardData?.files;
    const files = filterImageFiles(items);
    if (!files.length) return;
    e.preventDefault();
    onUpload(files);
  }

  function onDragOver(e: React.DragEvent) {
    if (pasteDisabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent) {
    if (!zoneRef.current?.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    if (pasteDisabled) return;
    e.preventDefault();
    setDragOver(false);
    importFiles(e.dataTransfer?.files);
  }

  const zoneClass = [
    'ld-edit-paste-zone',
    dragOver ? 'drag-over' : '',
    pasteDisabled ? 'disabled' : '',
    atLimit ? 'at-limit' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="ld-edit-card ld-edit-area-images">
      <h2 className="ld-edit-section-title">Hình ảnh</h2>
      {canEditImages ? (
        <p className="ld-edit-hint">
          Ảnh dự án chỉ xem. Ảnh chat và ảnh tự thêm có thể gỡ bằng nút ×.
        </p>
      ) : (
        <p className="ld-edit-hint muted">
          {isProject
            ? 'Ảnh dự án chỉ xem. Admin sửa ảnh trên sổ địa chỉ.'
            : 'Bạn không có quyền thêm hoặc gỡ ảnh trên lô này.'}
        </p>
      )}

      {canEditImages ? (
        <>
          {atLimit ? (
            <p className="ld-edit-limit-hint">
              Đã đủ {LODAT_MAX_UPLOAD_IMAGES} ảnh bạn thêm. Vẫn có thể xem ảnh
              dự án bên dưới.
            </p>
          ) : (
            <p className="ld-edit-limit-hint">
              Ảnh bạn thêm: tối đa {LODAT_MAX_UPLOAD_IMAGES} (dán, kéo thả hoặc
              chọn file).
            </p>
          )}

          <div className="ld-edit-paste">
            <div className="ld-edit-paste-head">
              <p className="ld-edit-paste-title">Thêm ảnh — dán hoặc kéo thả</p>
              <span className="ld-edit-paste-counter" aria-live="polite">
                {lodatCount}/{LODAT_MAX_UPLOAD_IMAGES}
              </span>
            </div>
            <p className="ld-edit-paste-hint">
              Click vào khung bên dưới, rồi dán (Ctrl+V) hoặc kéo thả ảnh từ máy
              / trang web. Không tính ảnh chat hay ảnh dự án.
            </p>
            <div
              ref={zoneRef}
              className={zoneClass}
              tabIndex={pasteDisabled ? -1 : 0}
              role="region"
              aria-label="Vùng thêm ảnh bằng dán hoặc kéo thả"
              aria-disabled={pasteDisabled}
              onPaste={onPaste}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => {
                if (!pasteDisabled) zoneRef.current?.focus();
              }}
            >
              {uploading ? (
                <p className="ld-edit-paste-text">Đang tải ảnh…</p>
              ) : atLimit ? (
                <p className="ld-edit-paste-text">
                  Đã đủ {LODAT_MAX_UPLOAD_IMAGES} ảnh bạn thêm.
                </p>
              ) : (
                <>
                  <p className="ld-edit-paste-lead">
                    Click vào đây rồi dán hoặc thả ảnh
                  </p>
                  <p className="ld-edit-paste-sub">
                    Có thể thêm nhiều ảnh cùng lúc
                  </p>
                </>
              )}
            </div>
            <div className="ld-edit-paste-footer">
              <button
                type="button"
                className="ld-edit-pick-link"
                disabled={pasteDisabled}
                onClick={() => fileRef.current?.click()}
              >
                Hoặc chọn từ máy tính
              </button>
            </div>
          </div>

          <div className="ld-edit-upload-row">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="ld-edit-file-input"
              disabled={busy || atLimit}
              onChange={(e) => {
                importFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="ld-edit-upload-btn ld-edit-upload-btn-mobile"
              disabled={busy || atLimit}
              onClick={() => fileRef.current?.click()}
            >
              <Icon icon={ImagePlus} size={16} />
              {uploading ? 'Đang tải…' : 'Thêm ảnh'}
            </button>
          </div>
        </>
      ) : null}

      {images.length ? (
        <div className="ld-edit-thumbs" role="list" aria-label="Ảnh lô đất">
          {images.map((img, idx) => (
            <div
              key={img.id ?? `${img.url}-${idx}`}
              className={
                idx === selectedIndex
                  ? 'ld-edit-thumb active'
                  : 'ld-edit-thumb'
              }
            >
              <button
                type="button"
                className="ld-edit-thumb-btn"
                aria-label={`Xem ảnh ${idx + 1}`}
                onClick={() => onSelect(idx)}
              >
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
              </button>
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
      ) : null}
    </section>
  );
}
