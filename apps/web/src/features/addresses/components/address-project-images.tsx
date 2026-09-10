'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, ImageOff, X } from 'lucide-react';
import type { AddressImageItem } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { deleteAddressImage, listAddressImages, uploadAddressImage } from '../api';

const MAX_PROJECT_IMAGES = 24;

type Props = {
  addressId: string;
  onFlash?: (msg: string) => void;
  onError?: (msg: string) => void;
};

function filterImageFiles(list: FileList | File[] | null | undefined): File[] {
  return Array.from(list ?? []).filter((f) =>
    String(f.type || '').startsWith('image/'),
  );
}

/** Gallery ảnh dự án — Admin trên sổ địa chỉ (sau khi đã lưu PROJECT). */
export function AddressProjectImages({ addressId, onFlash, onError }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const imagesQ = useQuery({
    queryKey: ['address-images', addressId],
    queryFn: () => listAddressImages(addressId),
  });

  const items: AddressImageItem[] = imagesQ.data?.items ?? [];
  const atLimit = items.length >= MAX_PROJECT_IMAGES;

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const room = MAX_PROJECT_IMAGES - items.length;
      const batch = files.slice(0, Math.max(0, room));
      for (const file of batch) {
        await uploadAddressImage(addressId, file);
      }
      return batch.length;
    },
    onSuccess: async (n) => {
      await qc.invalidateQueries({ queryKey: ['address-images', addressId] });
      await qc.invalidateQueries({ queryKey: ['addresses'] });
      if (n > 0) onFlash?.(n === 1 ? 'Đã thêm ảnh dự án.' : `Đã thêm ${n} ảnh dự án.`);
    },
    onError: (err: unknown) => {
      onError?.(err instanceof Error ? err.message : 'Không tải được ảnh.');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (imageId: string) => deleteAddressImage(addressId, imageId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['address-images', addressId] });
      await qc.invalidateQueries({ queryKey: ['addresses'] });
      onFlash?.('Đã gỡ ảnh dự án.');
    },
    onError: (err: unknown) => {
      onError?.(err instanceof Error ? err.message : 'Không gỡ được ảnh.');
    },
  });

  const busy = uploadMut.isPending || deleteMut.isPending;
  const pasteDisabled = busy || atLimit;

  function importFiles(list: FileList | File[] | null | undefined) {
    const files = filterImageFiles(list);
    if (!files.length || pasteDisabled) return;
    uploadMut.mutate(files);
  }

  return (
    <div className="addr-project-images">
      <div className="addr-project-images-head">
        <span className="addr-project-images-title">Ảnh dự án</span>
        <span className="addr-project-images-count">
          {items.length}/{MAX_PROJECT_IMAGES}
        </span>
      </div>

      {imagesQ.isLoading ? (
        <p className="crm-form-hint">Đang tải ảnh…</p>
      ) : null}
      {imagesQ.isError ? (
        <p className="crm-form-error">
          {(imagesQ.error as Error).message || 'Không tải được ảnh dự án.'}
        </p>
      ) : null}

      <div className="addr-project-thumbs" role="list">
        {items.map((img) => (
          <div key={img.id} className="addr-project-thumb" role="listitem">
            {img.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img.url} alt="" />
            ) : (
              <span className="addr-project-thumb-empty" aria-hidden>
                <Icon icon={ImageOff} size={16} />
              </span>
            )}
            <button
              type="button"
              className="addr-project-thumb-remove"
              aria-label="Gỡ ảnh"
              disabled={busy}
              onClick={() => deleteMut.mutate(img.id)}
            >
              <Icon icon={X} size={14} />
            </button>
          </div>
        ))}
      </div>

      <div
        ref={zoneRef}
        className={[
          'addr-project-drop',
          dragOver ? 'is-drag' : '',
          pasteDisabled ? 'is-disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onDragOver={(e) => {
          if (pasteDisabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!zoneRef.current?.contains(e.relatedTarget as Node)) {
            setDragOver(false);
          }
        }}
        onDrop={(e) => {
          if (pasteDisabled) return;
          e.preventDefault();
          setDragOver(false);
          importFiles(e.dataTransfer?.files);
        }}
        onPaste={(e) => {
          if (pasteDisabled) return;
          const files = filterImageFiles(e.clipboardData?.files);
          if (!files.length) return;
          e.preventDefault();
          uploadMut.mutate(files);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            importFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="crm-btn"
          disabled={pasteDisabled}
          onClick={() => fileRef.current?.click()}
        >
          <Icon icon={ImagePlus} size={16} />
          {uploadMut.isPending ? 'Đang tải…' : 'Thêm ảnh'}
        </button>
        <span className="crm-form-hint">
          {atLimit
            ? 'Đã đủ 24 ảnh.'
            : 'Kéo thả / dán / chọn file — tối đa 24 ảnh.'}
        </span>
      </div>
    </div>
  );
}
