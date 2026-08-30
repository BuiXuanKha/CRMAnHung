'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageOff } from 'lucide-react';
import type { CustomerLodatBrief, LodatDetail, LodatImage } from '@crmanhung/shared';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { formatPriceVnd } from '@/features/lodats/display';
import { getLodat, updateLodatImageRotation } from '@/features/lodats/api';
import { LodatImageGallery } from '@/features/lodats/components/lodat-image-gallery';
import './customer-lodat-cards.css';

type Props = {
  lots: CustomerLodatBrief[];
  loading?: boolean;
  emptyClassName?: string;
};

function galleryImagesFromDetail(detail: LodatDetail): LodatImage[] {
  if (detail.images?.length) return detail.images;
  if (detail.imageUrls?.length) {
    return detail.imageUrls.map((url) => ({
      id: null,
      url,
      rotationDeg: 0,
      source: 'lodat' as const,
    }));
  }
  if (detail.coverImageUrl) {
    return [
      {
        id: null,
        url: detail.coverImageUrl,
        rotationDeg: 0,
        source: 'lodat' as const,
      },
    ];
  }
  return [];
}

function specLine(lot: CustomerLodatBrief): string {
  return [
    lot.areaM2 != null ? `${lot.areaM2.toLocaleString('vi-VN')} m²` : null,
    lot.frontageM != null ? `MT ${lot.frontageM.toLocaleString('vi-VN')} m` : null,
    lot.direction?.trim() || null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function CustomerLodatCards({
  lots,
  loading,
  emptyClassName = 'kh-rail-empty',
}: Props) {
  const qc = useQueryClient();
  const [galleryLodatId, setGalleryLodatId] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const galleryQ = useQuery({
    queryKey: ['lodat', galleryLodatId],
    queryFn: () => getLodat(galleryLodatId!),
    enabled: Boolean(galleryLodatId),
  });

  const galleryImages = useMemo(
    () => (galleryQ.data ? galleryImagesFromDetail(galleryQ.data) : []),
    [galleryQ.data],
  );

  useEffect(() => {
    if (!galleryLodatId || !galleryQ.isError) return;
    setAlertMessage(
      (galleryQ.error as Error).message || 'Không tải được ảnh lô đất.',
    );
    setGalleryLodatId(null);
  }, [galleryLodatId, galleryQ.isError, galleryQ.error]);

  useEffect(() => {
    if (!galleryLodatId || galleryQ.isLoading || galleryQ.isError) return;
    if (galleryImages.length === 0) {
      setAlertMessage('Lô đất này chưa có hình ảnh để xem.');
      setGalleryLodatId(null);
    }
  }, [galleryLodatId, galleryQ.isLoading, galleryQ.isError, galleryImages.length]);

  const rotateMut = useMutation({
    mutationFn: async ({
      image,
      nextDeg,
    }: {
      image: LodatImage;
      nextDeg: number;
    }) => {
      if (!galleryLodatId || !image.id || image.source !== 'lodat') {
        throw new Error('Ảnh dự án chung không lưu xoay tại đây.');
      }
      return updateLodatImageRotation(galleryLodatId, image.id, {
        rotationDeg: nextDeg,
      });
    },
    onSuccess: (updated) => {
      if (!galleryLodatId) return;
      qc.setQueryData(['lodat', galleryLodatId], updated);
      void qc.invalidateQueries({ queryKey: ['lodats'] });
    },
  });

  if (loading) {
    return <p className={emptyClassName}>Đang tải lô đất…</p>;
  }

  if (lots.length === 0) {
    return <p className={emptyClassName}>Chưa gắn lô đất.</p>;
  }

  return (
    <>
      <ul className="kh-lot-cards">
        {lots.map((lot) => {
          const spec = specLine(lot);
          const extra = lot.extraPhotoCount ?? 0;
          const hasPhoto = Boolean(lot.coverImageUrl);
          return (
            <li key={lot.id} className="kh-lot-card">
              <button
                type="button"
                className={['kh-lot-thumb', hasPhoto ? 'is-clickable' : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-label={
                  hasPhoto ? `Xem ảnh «${lot.title}»` : `«${lot.title}» chưa có ảnh`
                }
                disabled={!hasPhoto}
                onClick={() => {
                  if (!hasPhoto) return;
                  setGalleryIndex(0);
                  setGalleryLodatId(lot.id);
                }}
              >
                {lot.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lot.coverImageUrl} alt="" />
                ) : (
                  <span className="kh-lot-thumb-empty" aria-hidden>
                    <Icon icon={ImageOff} size={16} />
                  </span>
                )}
                {extra > 0 ? (
                  <span className="kh-lot-thumb-more">+{extra}</span>
                ) : null}
              </button>
              <Link href={`/lo-dat/${lot.id}`} className="kh-lot-text">
                <strong>{lot.title}</strong>
                {lot.address?.trim() ? (
                  <span className="kh-lot-addr">{lot.address}</span>
                ) : null}
                {spec ? <span className="kh-lot-spec">{spec}</span> : null}
                <span className="crm-money">{formatPriceVnd(lot.priceVnd)}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {galleryLodatId && galleryImages.length ? (
        <LodatImageGallery
          title={galleryQ.data?.title?.trim() || 'Ảnh lô đất'}
          images={galleryImages}
          startIndex={galleryIndex}
          onClose={() => setGalleryLodatId(null)}
          onIndexChange={setGalleryIndex}
          onRotate={async (image, nextDeg) => {
            const updated = await rotateMut.mutateAsync({ image, nextDeg });
            const saved = updated.images.find((i) => i.id === image.id);
            return saved?.rotationDeg ?? nextDeg;
          }}
          onToast={setToast}
          onError={(msg) => setAlertMessage(msg)}
        />
      ) : null}

      <CrmAlertDialog
        open={Boolean(alertMessage)}
        title="Không mở được ảnh"
        message={alertMessage ?? ''}
        onClose={() => setAlertMessage(null)}
      />
      <CrmToast message={toast} />
    </>
  );
}
