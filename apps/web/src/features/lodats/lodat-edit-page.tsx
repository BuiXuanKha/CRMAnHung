'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AddressKind,
  LODAT_BROKER_FEE_CHIPS,
  LODAT_DIRECTION_OPTIONS,
  LODAT_KIND_LABELS,
  LODAT_MAX_UPLOAD_IMAGES,
  LODAT_PRICE_NOTE_CHIPS,
  LodatKind,
  LodatSaleStatus,
  type ChangeLodatOwnerInput,
  type LodatDetail,
  type UpdateLodatInput,
} from '@crmanhung/shared';
import { AddressPicker } from '@/features/addresses/components/address-picker';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import '@/shared/ui/money.css';
import {
  changeLodatOwner,
  deleteLodatImage,
  deleteLodatTempImage,
  formatPriceInput,
  getLodat,
  parsePriceInput,
  updateLodat,
  updateLodatImageRotation,
  uploadLodatTempImage,
} from './api';
import { getOpenTransaction } from '@/features/transactions/api';
import { ChangeOwnerModal } from './components/change-owner-modal';
import { LodatEditImages } from './components/lodat-edit-images';
import { LodatEditOwnerHistory } from './components/lodat-edit-owner-history';
import { LodatEditPreview } from './components/lodat-edit-preview';
import { LodatImageGallery } from './components/lodat-image-gallery';
import './lodat-edit.css';

type SpecForm = {
  title: string;
  addressId: string;
  areaM2: string;
  frontageM: string;
  direction: string;
  kind: LodatKind;
  note: string;
};

type MapForm = {
  status: typeof LodatSaleStatus.DANG_BAN | typeof LodatSaleStatus.TAM_DUNG | typeof LodatSaleStatus.KHONG_BAN;
  priceVnd: string;
  priceNote: string;
  brokerFeeNote: string;
  mapNote: string;
};

function toSpecForm(d: LodatDetail): SpecForm {
  return {
    title: d.title ?? '',
    addressId: d.addressId ?? '',
    areaM2: d.areaM2 != null ? String(d.areaM2) : '',
    frontageM: d.frontageM != null ? String(d.frontageM) : '',
    direction: d.direction ?? '',
    kind: d.kind,
    note: d.note ?? '',
  };
}

function toMapForm(d: LodatDetail): MapForm {
  return {
    status: d.status,
    priceVnd: formatPriceInput(d.priceVnd),
    priceNote: d.priceNote ?? '',
    brokerFeeNote: d.brokerFeeNote ?? '',
    mapNote: d.mapNote ?? '',
  };
}

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

type PendingUpload = {
  localId: string;
  file: File;
  url: string;
  tempId?: string;
  status: 'uploading' | 'ready' | 'error';
  error?: string;
};

export function LodatEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();

  const [spec, setSpec] = useState<SpecForm | null>(null);
  const [mapForm, setMapForm] = useState<MapForm | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const uploadSessionIdRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `edit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );
  const pendingRef = useRef(pendingUploads);
  pendingRef.current = pendingUploads;
  const [galleryOpen, setGalleryOpen] = useState(false);

  const q = useQuery({
    queryKey: ['lodat', id],
    queryFn: () => getLodat(id),
    enabled: Boolean(id),
  });

  const detail = q.data ?? null;

  useEffect(() => {
    if (!detail) return;
    setSpec(toSpecForm(detail));
    setMapForm(toMapForm(detail));
  }, [detail]);

  useEffect(() => {
    if (!detail) return;
    const imgs = detail.images;
    if (!imgs.length) {
      setSelectedIndex(0);
      return;
    }
    const coverIdx = detail.coverImageId
      ? imgs.findIndex((i) => i.id === detail.coverImageId)
      : -1;
    if (coverIdx >= 0) {
      setSelectedIndex(coverIdx);
      return;
    }
    setSelectedIndex(0);
  }, [detail?.id, detail?.coverImageId]);

  useEffect(() => {
    const n = detail?.images.length ?? 0;
    const pendingN = pendingUploads.length;
    const total = n + pendingN;
    if (!total) {
      setSelectedIndex(0);
      return;
    }
    setSelectedIndex((cur) => Math.min(cur, total - 1));
  }, [detail?.images.length, pendingUploads.length]);

  const isProject = Boolean(detail?.projectLotId);
  const canEditSpecs = detail?.canEditSpecs ?? false;
  const canEditMap = detail?.canEditMap ?? false;
  const canChangeOwner = detail?.canChangeOwner ?? false;

  async function tryOpenChangeOwner() {
    if (!id || busy) return;
    setOwnerError(null);
    try {
      const open = await getOpenTransaction(id);
      if (open.id) {
        setAlertMsg(
          'Lô này đang trong trạng thái giao dịch nên không đổi được chủ.',
        );
        return;
      }
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : 'Không kiểm tra được giao dịch mở.');
      return;
    }
    setOwnerOpen(true);
  }

  const canEditImages = detail?.canEditImages ?? false;
  const serverImages = detail?.images ?? [];
  const lodatImageCount = serverImages.filter((i) => i.source === 'lodat').length;
  const displayImages = useMemo(() => {
    const pendingAsImages = pendingUploads.map((p) => ({
      id: `pending:${p.localId}`,
      url: p.url,
      rotationDeg: 0,
      source: 'lodat' as const,
    }));
    return [...serverImages, ...pendingAsImages];
  }, [serverImages, pendingUploads]);
  const images = displayImages;
  const pendingMeta = useMemo(() => {
    const map: Record<string, { status: PendingUpload['status']; error?: string }> = {};
    for (const p of pendingUploads) {
      map[`pending:${p.localId}`] = { status: p.status, error: p.error };
    }
    return map;
  }, [pendingUploads]);
  const pendingUploading = pendingUploads.some((p) => p.status === 'uploading');
  const pendingHasError = pendingUploads.some((p) => p.status === 'error');
  const readyTempIds = pendingUploads
    .filter((p) => p.status === 'ready' && p.tempId)
    .map((p) => p.tempId!);

  useEffect(() => {
    return () => {
      for (const p of pendingRef.current) {
        URL.revokeObjectURL(p.url);
        if (p.tempId) {
          void deleteLodatTempImage(p.tempId).catch(() => undefined);
        }
      }
    };
  }, []);

  const saveMut = useMutation({
    mutationFn: (input: UpdateLodatInput) => updateLodat(id, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['lodat', id] });
      await qc.invalidateQueries({ queryKey: ['lodats'] });
      for (const p of pendingRef.current) {
        URL.revokeObjectURL(p.url);
      }
      setPendingUploads([]);
      flash('Đã lưu thay đổi.');
      router.push(`/lo-dat/${id}`);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const ownerMut = useMutation({
    mutationFn: (input: ChangeLodatOwnerInput) => changeLodatOwner(id, input),
    onSuccess: async (updated) => {
      qc.setQueryData(['lodat', id], updated);
      await qc.invalidateQueries({ queryKey: ['lodats'] });
      await qc.invalidateQueries({ queryKey: ['customer-lodats'] });
      setOwnerOpen(false);
      setOwnerError(null);
      flash(`Đã đổi chủ sang ${updated.owner?.fullName ?? 'khách mới'}.`);
    },
    onError: (err: Error) => setOwnerError(err.message),
  });


  const deleteMut = useMutation({
    mutationFn: (imageId: string) => deleteLodatImage(id, imageId),
    onSuccess: async (updated) => {
      qc.setQueryData(['lodat', id], updated);
      await qc.invalidateQueries({ queryKey: ['lodats'] });
      flash('Đã gỡ ảnh.');
    },
    onError: (err: Error) => setAlertMsg(err.message),
  });

  const rotateMut = useMutation({
    mutationFn: ({
      imageId,
      rotationDeg,
    }: {
      imageId: string;
      rotationDeg: number;
    }) => updateLodatImageRotation(id, imageId, { rotationDeg }),
    onSuccess: (updated) => {
      qc.setQueryData(['lodat', id], updated);
    },
    onError: (err: Error) => setAlertMsg(err.message),
  });

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  function patchSpec<K extends keyof SpecForm>(key: K, value: SpecForm[K]) {
    setSpec((cur) => (cur ? { ...cur, [key]: value } : cur));
  }

  function patchMap<K extends keyof MapForm>(key: K, value: MapForm[K]) {
    setMapForm((cur) => (cur ? { ...cur, [key]: value } : cur));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !spec || !mapForm) return;
    setFormError(null);

    const input: UpdateLodatInput = {};
    if (canEditSpecs) {
      if (!spec.title.trim()) {
        setFormError('Cần nhập tiêu đề lô đất.');
        return;
      }
      if (!spec.addressId) {
        setFormError('Cần chọn địa chỉ đất dân.');
        return;
      }
      input.title = spec.title.trim();
      input.addressId = spec.addressId;
      input.areaM2 = spec.areaM2 ? Number(spec.areaM2) : null;
      input.frontageM = spec.frontageM ? Number(spec.frontageM) : null;
      input.direction = spec.direction.trim() || null;
      input.kind = spec.kind;
      input.note = spec.note.trim() || null;
    }
    if (canEditMap) {
      input.status = mapForm.status;
      input.priceVnd = parsePriceInput(mapForm.priceVnd) || null;
      input.priceNote = mapForm.priceNote.trim() || null;
      input.brokerFeeNote = mapForm.brokerFeeNote.trim() || null;
      input.mapNote = mapForm.mapNote.trim() || null;
    }
    if (pendingUploading) {
      setFormError('Đang tải ảnh lên server — chờ xong rồi bấm Lưu.');
      return;
    }
    if (pendingHasError) {
      setFormError('Có ảnh tải lên lỗi. Gỡ ảnh lỗi hoặc chọn lại trước khi lưu.');
      return;
    }
    if (readyTempIds.length) {
      input.tempImageIds = readyTempIds;
    }

    // Ảnh bìa = thumb đang chọn ở Xem nhanh.
    const selectedImg = images[selectedIndex];
    if (selectedImg?.source === 'address') {
      input.coverImageId = null;
    } else if (selectedImg?.id?.startsWith('pending:')) {
      const localId = selectedImg.id.slice('pending:'.length);
      const pending = pendingUploads.find((p) => p.localId === localId);
      if (pending?.tempId && pending.status === 'ready') {
        input.coverTempImageId = pending.tempId;
      }
    } else if (selectedImg?.source === 'lodat' && selectedImg.id) {
      input.coverImageId = selectedImg.id;
    }

    if (!canEditSpecs && !canEditMap && !readyTempIds.length) {
      setFormError('Bạn không có quyền sửa lô này.');
      return;
    }
    if (!canEditSpecs && !canEditMap && readyTempIds.length && !canEditImages) {
      setFormError('Bạn không có quyền thêm ảnh trên lô này.');
      return;
    }
    void saveMut.mutateAsync(input);
  }

  async function startPendingUpload(localId: string, file: File) {
    try {
      const uploaded = await uploadLodatTempImage(uploadSessionIdRef.current, file);
      setPendingUploads((cur) =>
        cur.map((p) =>
          p.localId === localId
            ? { ...p, tempId: uploaded.id, status: 'ready' as const, error: undefined }
            : p,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được ảnh.';
      setPendingUploads((cur) =>
        cur.map((p) =>
          p.localId === localId
            ? { ...p, status: 'error' as const, error: message }
            : p,
        ),
      );
    }
  }

  function onPickFiles(files: FileList | File[] | null) {
    if (!files || !canEditImages) return;
    const list = Array.from(files).filter((f) =>
      String(f.type || '').startsWith('image/'),
    );
    const room = LODAT_MAX_UPLOAD_IMAGES - lodatImageCount - pendingUploads.length;
    const accepted = list.slice(0, Math.max(0, room)).map((file) => ({
      localId:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      url: URL.createObjectURL(file),
      status: 'uploading' as const,
    }));
    if (!accepted.length) return;
    setPendingUploads((cur) => {
      const merged = [...cur, ...accepted];
      setSelectedIndex(serverImages.length + Math.max(0, merged.length - 1));
      return merged;
    });
    for (const item of accepted) {
      void startPendingUpload(item.localId, item.file);
    }
  }

  async function onDeleteImage(imageId: string) {
    if (imageId.startsWith('pending:')) {
      const localId = imageId.slice('pending:'.length);
      setPendingUploads((cur) => {
        const target = cur.find((p) => p.localId === localId);
        if (target) {
          URL.revokeObjectURL(target.url);
          if (target.tempId) {
            void deleteLodatTempImage(target.tempId).catch(() => undefined);
          }
        }
        return cur.filter((p) => p.localId !== localId);
      });
      return;
    }
    await deleteMut.mutateAsync(imageId);
  }

  async function onRotate(delta: number) {
    const img = images[selectedIndex];
    if (!img?.id || img.source !== 'lodat' || img.id.startsWith('pending:')) return;
    const nextDeg = normalizeDeg((img.rotationDeg ?? 0) + delta);
    await rotateMut.mutateAsync({ imageId: img.id, rotationDeg: nextDeg });
  }

  const busy =
    saveMut.isPending ||
    pendingUploading ||
    deleteMut.isPending ||
    rotateMut.isPending ||
    ownerMut.isPending ||
    q.isLoading;

  return (
    <div className="ld-edit-page">
      <div className="ld-edit-head">
        <Link href={`/lo-dat/${id}`} className="ld-edit-back">
          ← Chi tiết lô
        </Link>
        <h1>Sửa lô đất</h1>
        {detail ? (
          <span className="ld-edit-kind-badge">
            {isProject ? 'Lô dự án' : 'Lô thường'}
          </span>
        ) : null}
      </div>

      {q.isLoading ? <p className="ld-edit-state">Đang tải…</p> : null}
      {q.error ? <p className="ld-edit-error">{(q.error as Error).message}</p> : null}
      {formError ? <p className="ld-edit-error">{formError}</p> : null}

      {detail && spec && mapForm ? (
        <form className="ld-edit-form" onSubmit={handleSubmit}>
          <div className="ld-edit-body">
            <div className="ld-edit-area-info">
              <section className="ld-edit-card">
                <h2 className="ld-edit-section-title">Thông số lô</h2>
                {isProject ? (
                  <p className="ld-edit-hint">
                    Lô thuộc dự án — thông số lô chỉ xem, không sửa tại đây.
                  </p>
                ) : !canEditSpecs ? (
                  <p className="ld-edit-hint muted">
                    Bạn không có quyền sửa thông số lô này.
                  </p>
                ) : null}

                {isProject && detail.address ? (
                  <p className="ld-edit-address-line">{detail.address}</p>
                ) : null}

                {canEditSpecs ? (
                  <label className="ld-edit-field">
                    <span>Địa chỉ tổng quát *</span>
                    <AddressPicker
                      value={spec.addressId || null}
                      labelHint={detail.address}
                      kindFilter={AddressKind.REGULAR}
                      disabled={busy}
                      onChange={(item) => patchSpec('addressId', item?.id ?? '')}
                    />
                  </label>
                ) : null}

                <label className="ld-edit-field">
                  <span>Tiêu đề *</span>
                  <input
                    value={spec.title}
                    onChange={(e) => patchSpec('title', e.target.value)}
                    disabled={busy || !canEditSpecs}
                  />
                </label>

                <div className="ld-edit-row2">
                  <label className="ld-edit-field">
                    <span>Diện tích (m²)</span>
                    <input
                      value={spec.areaM2}
                      onChange={(e) =>
                        patchSpec('areaM2', e.target.value.replace(/[^\d.]/g, ''))
                      }
                      disabled={busy || !canEditSpecs}
                    />
                  </label>
                  <label className="ld-edit-field">
                    <span>Mặt tiền (m)</span>
                    <input
                      value={spec.frontageM}
                      onChange={(e) =>
                        patchSpec(
                          'frontageM',
                          e.target.value.replace(/[^\d.]/g, ''),
                        )
                      }
                      disabled={busy || !canEditSpecs}
                    />
                  </label>
                </div>

                <label className="ld-edit-field">
                  <span>Hướng lô đất</span>
                  <select
                    value={spec.direction}
                    onChange={(e) => patchSpec('direction', e.target.value)}
                    disabled={busy || !canEditSpecs}
                  >
                    <option value="">—</option>
                    {LODAT_DIRECTION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="ld-edit-field">
                  <span>Phân loại</span>
                  <select
                    value={spec.kind}
                    onChange={(e) =>
                      patchSpec('kind', e.target.value as LodatKind)
                    }
                    disabled={busy || !canEditSpecs}
                  >
                    <option value={LodatKind.DAT}>
                      {LODAT_KIND_LABELS[LodatKind.DAT]}
                    </option>
                    <option value={LodatKind.NHA}>
                      {LODAT_KIND_LABELS[LodatKind.NHA]}
                    </option>
                  </select>
                </label>

                <label className="ld-edit-field">
                  <span>Ghi chú chung (lô đất)</span>
                  <textarea
                    rows={3}
                    value={spec.note}
                    onChange={(e) => patchSpec('note', e.target.value)}
                    disabled={busy || !canEditSpecs}
                  />
                </label>
              </section>

              <section className="ld-edit-card">
                <div className="ld-edit-section-head">
                  <h2 className="ld-edit-section-title">Chủ đất & giá bán</h2>
                  {canChangeOwner ? (
                    <button
                      type="button"
                      className="ld-edit-change-owner"
                      onClick={() => {
                        void tryOpenChangeOwner();
                      }}
                      disabled={busy}
                    >
                      Đổi chủ
                    </button>
                  ) : null}
                </div>
                {detail.owner ? (
                  <p className="ld-edit-owner">
                    Chủ hiện tại: <strong>{detail.owner.fullName}</strong>
                  </p>
                ) : (
                  <p className="ld-edit-hint muted">
                    Chưa có liên kết chủ active.
                  </p>
                )}
                {!canEditMap ? (
                  <p className="ld-edit-hint muted">
                    Bạn không có quyền sửa giá/trạng thái trên lô này.
                  </p>
                ) : null}

                <div className="ld-edit-row2">
                  <label className="ld-edit-field">
                    <span>Trạng thái</span>
                    <select
                      value={mapForm.status}
                      onChange={(e) =>
                        patchMap(
                          'status',
                          e.target.value as MapForm['status'],
                        )
                      }
                      disabled={busy || !canEditMap}
                    >
                      <option value={LodatSaleStatus.DANG_BAN}>Mở bán</option>
                      <option value={LodatSaleStatus.TAM_DUNG}>Tạm dừng</option>
                      <option value={LodatSaleStatus.KHONG_BAN}>Không bán</option>
                    </select>
                  </label>
                  <label className="ld-edit-field">
                    <span>Giá (VND)</span>
                    <input
                      value={mapForm.priceVnd}
                      placeholder="VD: 1.234.567"
                      onChange={(e) =>
                        patchMap(
                          'priceVnd',
                          formatPriceInput(parsePriceInput(e.target.value)),
                        )
                      }
                      disabled={busy || !canEditMap}
                    />
                  </label>
                </div>

                <label className="ld-edit-field">
                  <span>Ghi chú giá</span>
                  <input
                    value={mapForm.priceNote}
                    onChange={(e) => patchMap('priceNote', e.target.value)}
                    disabled={busy || !canEditMap}
                  />
                  <div className="ld-edit-chips">
                    {LODAT_PRICE_NOTE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className={
                          mapForm.priceNote === chip
                            ? 'ld-edit-chip active'
                            : 'ld-edit-chip'
                        }
                        onClick={() => patchMap('priceNote', chip)}
                        disabled={busy || !canEditMap}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="ld-edit-field">
                  <span>Hoa hồng</span>
                  <input
                    value={mapForm.brokerFeeNote}
                    onChange={(e) => patchMap('brokerFeeNote', e.target.value)}
                    disabled={busy || !canEditMap}
                  />
                  <div className="ld-edit-chips">
                    {LODAT_BROKER_FEE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className={
                          mapForm.brokerFeeNote === chip
                            ? 'ld-edit-chip active'
                            : 'ld-edit-chip'
                        }
                        onClick={() => patchMap('brokerFeeNote', chip)}
                        disabled={busy || !canEditMap}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="ld-edit-field">
                  <span>Ghi chú liên kết chủ</span>
                  <textarea
                    rows={2}
                    value={mapForm.mapNote}
                    onChange={(e) => patchMap('mapNote', e.target.value)}
                    disabled={busy || !canEditMap}
                  />
                </label>
              </section>

              <LodatEditOwnerHistory detail={detail} />
            </div>

            <div className="ld-edit-area-side">
              <LodatEditImages
                images={images}
                selectedIndex={selectedIndex}
                coverImageId={detail.coverImageId ?? null}
                canEditImages={canEditImages}
                isProject={isProject}
                busy={busy}
                uploading={pendingUploading}
                pendingMeta={pendingMeta}
                onSelect={setSelectedIndex}
                onUpload={(files) => onPickFiles(files)}
                onDelete={(imageId) => void onDeleteImage(imageId)}
              />

              <LodatEditPreview
                images={images}
                selectedIndex={selectedIndex}
                busy={busy}
                onOpenGallery={() => setGalleryOpen(true)}
                onRotate={(delta) => void onRotate(delta)}
              />
            </div>

            <footer className="ld-edit-actions">
              <button
                type="button"
                className="ld-edit-cancel"
                disabled={busy}
                onClick={() => router.push(`/lo-dat/${id}`)}
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="ld-edit-save"
                disabled={
                  busy ||
                  pendingUploading ||
                  pendingHasError ||
                  (!canEditSpecs && !canEditMap && !readyTempIds.length)
                }
              >
                {pendingUploading
                  ? 'Đang tải ảnh…'
                  : saveMut.isPending
                    ? 'Đang lưu…'
                    : 'Lưu thay đổi'}
              </button>
            </footer>
          </div>
        </form>
      ) : null}

      {galleryOpen && images.length ? (
        <LodatImageGallery
          title={detail?.title?.trim() || 'Ảnh lô đất'}
          images={images}
          startIndex={selectedIndex}
          onClose={() => setGalleryOpen(false)}
          onIndexChange={setSelectedIndex}
          onRotate={async (image, nextDeg) => {
            if (!image.id || image.source !== 'lodat') return nextDeg;
            const updated = await updateLodatImageRotation(id, image.id, {
              rotationDeg: nextDeg,
            });
            qc.setQueryData(['lodat', id], updated);
            const saved = updated.images.find((i) => i.id === image.id);
            return saved?.rotationDeg ?? nextDeg;
          }}
          onToast={flash}
          onError={(msg) => setAlertMsg(msg)}
        />
      ) : null}

      <ChangeOwnerModal
        open={ownerOpen}
        currentOwner={detail?.owner ?? null}
        initialMap={
          mapForm ?? {
            status: LodatSaleStatus.DANG_BAN,
            priceVnd: '',
            priceNote: '',
            brokerFeeNote: '',
            mapNote: '',
          }
        }
        busy={ownerMut.isPending}
        error={ownerError}
        onClose={() => {
          setOwnerOpen(false);
          setOwnerError(null);
        }}
        onSubmit={(input) => ownerMut.mutateAsync(input).then(() => undefined)}
      />
      <CrmAlertDialog
        open={Boolean(alertMsg)}
        title="Không thực hiện được"
        message={alertMsg ?? ''}
        onClose={() => setAlertMsg(null)}
      />
      <CrmToast message={toast} />
    </div>
  );
}
