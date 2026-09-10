'use client';

import { useEffect, useState } from 'react';
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
  formatPriceInput,
  getLodat,
  parsePriceInput,
  updateLodat,
  updateLodatImageRotation,
  uploadLodatImage,
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
  status: typeof LodatSaleStatus.DANG_BAN | typeof LodatSaleStatus.TAM_DUNG;
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
    const n = detail.images.length;
    if (!n) {
      setSelectedIndex(0);
      return;
    }
    setSelectedIndex((cur) => Math.min(cur, n - 1));
  }, [detail]);

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
  const images = detail?.images ?? [];
  const lodatImageCount = images.filter((i) => i.source === 'lodat').length;

  const saveMut = useMutation({
    mutationFn: (input: UpdateLodatInput) => updateLodat(id, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['lodat', id] });
      await qc.invalidateQueries({ queryKey: ['lodats'] });
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

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadLodatImage(id, file),
    onSuccess: async (updated) => {
      qc.setQueryData(['lodat', id], updated);
      await qc.invalidateQueries({ queryKey: ['lodats'] });
      const nextIdx = Math.max(0, updated.images.length - 1);
      setSelectedIndex(nextIdx);
      flash('Đã thêm ảnh.');
    },
    onError: (err: Error) => setAlertMsg(err.message),
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
    if (!canEditSpecs && !canEditMap) {
      setFormError('Bạn không có quyền sửa lô này.');
      return;
    }
    void saveMut.mutateAsync(input);
  }

  async function onPickFiles(files: FileList | File[] | null) {
    if (!files || !canEditImages) return;
    const list = Array.from(files);
    let remaining = LODAT_MAX_UPLOAD_IMAGES - lodatImageCount;
    for (const file of list) {
      if (remaining <= 0) break;
      await uploadMut.mutateAsync(file);
      remaining -= 1;
    }
  }

  async function onRotate(delta: number) {
    const img = images[selectedIndex];
    if (!img?.id || img.source !== 'lodat') return;
    const nextDeg = normalizeDeg((img.rotationDeg ?? 0) + delta);
    await rotateMut.mutateAsync({ imageId: img.id, rotationDeg: nextDeg });
  }

  const busy =
    saveMut.isPending ||
    uploadMut.isPending ||
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
                canEditImages={canEditImages}
                isProject={isProject}
                busy={busy}
                uploading={uploadMut.isPending}
                onSelect={setSelectedIndex}
                onUpload={(files) => void onPickFiles(files)}
                onDelete={(imageId) => void deleteMut.mutateAsync(imageId)}
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
                disabled={busy || (!canEditSpecs && !canEditMap)}
              >
                {saveMut.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
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
