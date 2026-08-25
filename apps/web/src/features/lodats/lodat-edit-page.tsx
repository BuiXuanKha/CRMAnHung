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
  type LodatDetail,
  type UpdateLodatInput,
} from '@crmanhung/shared';
import { AddressPicker } from '@/features/addresses/components/address-picker';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import {
  deleteLodatImage,
  formatPriceInput,
  getLodat,
  parsePriceInput,
  updateLodat,
  uploadLodatImage,
} from './api';
import { LodatEditImages } from './components/lodat-edit-images';
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

  const isProject = Boolean(detail?.projectLotId);
  const canEditSpecs = detail?.canEditSpecs ?? false;
  const canEditMap = detail?.canEditMap ?? false;
  const canEditImages = detail?.canEditImages ?? false;
  const lodatImageCount = (detail?.images ?? []).filter((i) => i.source === 'lodat').length;

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

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadLodatImage(id, file),
    onSuccess: async (updated) => {
      qc.setQueryData(['lodat', id], updated);
      await qc.invalidateQueries({ queryKey: ['lodats'] });
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

  async function onPickFiles(files: FileList | null) {
    if (!files?.length || !canEditImages) return;
    const list = Array.from(files);
    for (const file of list) {
      if (lodatImageCount >= LODAT_MAX_UPLOAD_IMAGES) break;
      await uploadMut.mutateAsync(file);
    }
  }

  const busy =
    saveMut.isPending || uploadMut.isPending || deleteMut.isPending || q.isLoading;

  return (
    <div className="ld-edit-page">
      <div className="ld-edit-head">
        <Link href={`/lo-dat/${id}`} className="ld-edit-back">
          ← Chi tiết lô
        </Link>
        <div className="ld-edit-title-row">
          <h1>Sửa lô đất</h1>
          {detail ? (
            <span className="ld-edit-kind-badge">
              {isProject ? 'Lô dự án' : 'Lô thường'}
            </span>
          ) : null}
        </div>
      </div>

      {q.isLoading ? <p className="ld-edit-state">Đang tải…</p> : null}
      {q.error ? <p className="ld-edit-error">{(q.error as Error).message}</p> : null}
      {formError ? <p className="ld-edit-error">{formError}</p> : null}

      {detail && spec && mapForm ? (
        <form className="ld-edit-form" onSubmit={handleSubmit}>
          <section className="ld-edit-card">
            <h2>Thông số lô</h2>
            {isProject ? (
              <p className="ld-edit-hint">
                Lô thuộc dự án — thông số lô chỉ xem, không sửa tại đây.
              </p>
            ) : !canEditSpecs ? (
              <p className="ld-edit-hint">Bạn không có quyền sửa thông số lô này.</p>
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
                    patchSpec('frontageM', e.target.value.replace(/[^\d.]/g, ''))
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
                onChange={(e) => patchSpec('kind', e.target.value as LodatKind)}
                disabled={busy || !canEditSpecs}
              >
                <option value={LodatKind.DAT}>{LODAT_KIND_LABELS[LodatKind.DAT]}</option>
                <option value={LodatKind.NHA}>{LODAT_KIND_LABELS[LodatKind.NHA]}</option>
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
              <h2>Chủ đất & giá bán</h2>
              <button
                type="button"
                className="ld-edit-change-owner"
                onClick={() => flash('Đổi chủ — sẽ làm ở slice sau.')}
                disabled={busy}
              >
                Đổi chủ
              </button>
            </div>
            {detail.owner ? (
              <p className="ld-edit-owner">
                Chủ hiện tại: <strong>{detail.owner.fullName}</strong>
              </p>
            ) : (
              <p className="ld-edit-hint">Chưa có liên kết chủ active.</p>
            )}
            {!canEditMap ? (
              <p className="ld-edit-hint">Bạn không có quyền sửa giá/trạng thái trên lô này.</p>
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
                    patchMap('priceVnd', formatPriceInput(parsePriceInput(e.target.value)))
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
                      mapForm.priceNote === chip ? 'ld-edit-chip active' : 'ld-edit-chip'
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

          <LodatEditImages
            images={detail.images}
            canEditImages={canEditImages}
            isProject={isProject}
            busy={busy}
            uploading={uploadMut.isPending}
            onUpload={(files) => void onPickFiles(files)}
            onDelete={(imageId) => void deleteMut.mutateAsync(imageId)}
          />

          <footer className="ld-edit-actions">
            <button
              type="button"
              className="crm-btn"
              disabled={busy}
              onClick={() => router.push(`/lo-dat/${id}`)}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="crm-btn primary"
              disabled={busy || (!canEditSpecs && !canEditMap)}
            >
              {saveMut.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </footer>
        </form>
      ) : null}

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
