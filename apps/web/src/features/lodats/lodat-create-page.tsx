'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AddressKind,
  LODAT_BROKER_FEE_CHIPS,
  LODAT_DIRECTION_OPTIONS,
  LODAT_KIND_LABELS,
  LODAT_MAX_UPLOAD_IMAGES,
  LODAT_PRICE_NOTE_CHIPS,
  LodatKind,
  LodatSaleStatus,
  UserRole,
  type CreateLodatInput,
  type LodatImage,
} from '@crmanhung/shared';
import { AddressPicker } from '@/features/addresses/components/address-picker';
import { useAuth } from '@/features/auth/auth-context';
import { getCustomer } from '@/features/customers/api';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import {
  createLodat,
  formatPriceInput,
  listProjectLotOptions,
  parsePriceInput,
  uploadLodatImage,
} from './api';
import { LodatEditImages } from './components/lodat-edit-images';
import { LodatEditPreview } from './components/lodat-edit-preview';
import './lodat-edit.css';

type LotMode = 'regular' | 'project';

type LocalImage = {
  file: File;
  url: string;
};

/** Form tạo lô từ khách — lodats.md §12.5 (học CRM cũ, cùng chrome trang sửa). */
export function LodatCreatePage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const router = useRouter();
  const { user } = useAuth();

  const [mode, setMode] = useState<LotMode>('regular');
  const [addressId, setAddressId] = useState('');
  const [projectAddressId, setProjectAddressId] = useState('');
  const [projectLotId, setProjectLotId] = useState('');
  const [title, setTitle] = useState('');
  const [areaM2, setAreaM2] = useState('');
  const [frontageM, setFrontageM] = useState('');
  const [direction, setDirection] = useState('');
  const [kind, setKind] = useState<LodatKind>(LodatKind.DAT);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<CreateLodatInput['status']>(
    LodatSaleStatus.DANG_BAN,
  );
  const [priceVnd, setPriceVnd] = useState('');
  const [priceNote, setPriceNote] = useState('');
  const [brokerFeeNote, setBrokerFeeNote] = useState('');
  const [mapNote, setMapNote] = useState('');
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const customerQ = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomer(customerId),
    enabled: Boolean(customerId),
  });
  const customerName = customerQ.data?.fullName ?? '';

  const lotsQ = useQuery({
    queryKey: ['project-lots', projectAddressId],
    queryFn: () => listProjectLotOptions(projectAddressId),
    enabled: mode === 'project' && Boolean(projectAddressId),
  });
  const lotOptions = lotsQ.data?.items ?? [];

  useEffect(() => {
    return () => {
      localImages.forEach((img) => URL.revokeObjectURL(img.url));
    };
    // Chỉ dọn khi rời trang — không revoke mỗi lần thêm ảnh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewImages: LodatImage[] = useMemo(
    () =>
      localImages.map((img, i) => ({
        id: `local-${i}`,
        url: img.url,
        rotationDeg: 0,
        source: 'lodat' as const,
      })),
    [localImages],
  );

  const isAdmin = user?.role === UserRole.ADMIN;

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) =>
      String(f.type || '').startsWith('image/'),
    );
    if (!list.length) return;
    setLocalImages((cur) => {
      const room = LODAT_MAX_UPLOAD_IMAGES - cur.length;
      const next = list.slice(0, Math.max(0, room)).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      const merged = [...cur, ...next];
      setSelectedIndex(Math.max(0, merged.length - 1));
      return merged;
    });
  }

  function removeLocalImage(imageId: string) {
    const idx = Number(imageId.replace('local-', ''));
    setLocalImages((cur) => {
      const target = cur[idx];
      if (target) URL.revokeObjectURL(target.url);
      const next = cur.filter((_, i) => i !== idx);
      setSelectedIndex((s) => Math.min(s, Math.max(0, next.length - 1)));
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setFormError(null);

    const input: CreateLodatInput = {
      customerId,
      status,
      priceVnd: parsePriceInput(priceVnd) || null,
      priceNote: priceNote.trim() || null,
      brokerFeeNote: brokerFeeNote.trim() || null,
      mapNote: mapNote.trim() || null,
      kind,
    };
    if (mode === 'project') {
      if (!projectLotId) {
        setFormError('Cần chọn một lô trong kho dự án.');
        return;
      }
      input.projectLotId = projectLotId;
    } else {
      if (!addressId) {
        setFormError('Cần chọn địa chỉ đất dân.');
        return;
      }
      if (!title.trim()) {
        setFormError('Cần nhập tiêu đề lô đất.');
        return;
      }
      input.addressId = addressId;
      input.title = title.trim();
      input.areaM2 = areaM2 ? Number(areaM2) : null;
      input.frontageM = frontageM ? Number(frontageM) : null;
      input.direction = direction.trim() || null;
      input.note = note.trim() || null;
    }

    setSaving(true);
    try {
      const created = await createLodat(input);
      if (mode === 'regular' && localImages.length) {
        for (const img of localImages) {
          try {
            await uploadLodatImage(created.id, img.file);
          } catch {
            setAlertMsg('Tạo lô thành công nhưng một số ảnh chưa tải lên được. Thêm lại ảnh trong trang Sửa.');
            break;
          }
        }
      }
      flash('Đã tạo lô đất.');
      router.push(`/lo-dat/${created.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không tạo được lô đất.');
      setSaving(false);
    }
  }

  if (isAdmin) {
    return (
      <div className="ld-edit-page">
        <div className="ld-edit-head">
          <Link href="/khach-hang" className="ld-edit-back">
            ← Khách hàng
          </Link>
          <h1>Tạo lô đất</h1>
        </div>
        <p className="ld-edit-error">
          Admin không tạo lô đất từ menu khách. Nhân viên tạo lô từ hồ sơ khách của mình.
        </p>
      </div>
    );
  }

  return (
    <div className="ld-edit-page">
      <div className="ld-edit-head">
        <Link href="/khach-hang" className="ld-edit-back">
          ← Khách hàng
        </Link>
        <h1>Tạo lô đất</h1>
        {customerName ? (
          <span className="ld-edit-kind-badge">Chủ: {customerName}</span>
        ) : null}
      </div>

      {customerQ.isLoading ? <p className="ld-edit-state">Đang tải…</p> : null}
      {customerQ.error ? (
        <p className="ld-edit-error">{(customerQ.error as Error).message}</p>
      ) : null}
      {formError ? <p className="ld-edit-error">{formError}</p> : null}

      {customerQ.data ? (
        <form className="ld-edit-form" onSubmit={handleSubmit}>
          <div className="ld-edit-body">
            <div className="ld-edit-area-info">
              <section className="ld-edit-card">
                <h2 className="ld-edit-section-title">Loại thửa</h2>
                <div className="ld-edit-chips">
                  <button
                    type="button"
                    className={mode === 'regular' ? 'ld-edit-chip active' : 'ld-edit-chip'}
                    disabled={saving}
                    onClick={() => setMode('regular')}
                  >
                    Đất dân
                  </button>
                  <button
                    type="button"
                    className={mode === 'project' ? 'ld-edit-chip active' : 'ld-edit-chip'}
                    disabled={saving}
                    onClick={() => setMode('project')}
                  >
                    Lô dự án (kho)
                  </button>
                </div>
                {mode === 'project' ? (
                  <p className="ld-edit-hint">
                    Chọn dự án rồi chọn lô trong kho — thông số lô đọc từ kho, không nhập tay.
                  </p>
                ) : (
                  <p className="ld-edit-hint">
                    Lô đất dân — bạn tự nhập tiêu đề và thông số.
                  </p>
                )}
              </section>

              {mode === 'project' ? (
                <section className="ld-edit-card">
                  <h2 className="ld-edit-section-title">Thông số lô (kho dự án)</h2>
                  <label className="ld-edit-field">
                    <span>Dự án *</span>
                    <AddressPicker
                      value={projectAddressId || null}
                      kindFilter={AddressKind.PROJECT}
                      disabled={saving}
                      onChange={(item) => {
                        setProjectAddressId(item?.id ?? '');
                        setProjectLotId('');
                      }}
                    />
                  </label>
                  {projectAddressId ? (
                    <label className="ld-edit-field">
                      <span>Lô trong kho *</span>
                      {lotsQ.isLoading ? (
                        <p className="ld-edit-hint">Đang tải kho lô…</p>
                      ) : lotOptions.length === 0 ? (
                        <p className="ld-edit-hint muted">
                          Dự án này chưa có lô trong kho. Liên hệ Admin import kho.
                        </p>
                      ) : (
                        <select
                          value={projectLotId}
                          onChange={(e) => setProjectLotId(e.target.value)}
                          disabled={saving}
                        >
                          <option value="">— Chọn lô —</option>
                          {lotOptions.map((lot) => {
                            const specs = [
                              lot.areaM2 != null ? `${lot.areaM2} m²` : null,
                              lot.frontageM != null ? `MT ${lot.frontageM} m` : null,
                              lot.direction || null,
                            ]
                              .filter(Boolean)
                              .join(' · ');
                            return (
                              <option
                                key={lot.id}
                                value={lot.id}
                                disabled={lot.takenByMe}
                              >
                                {lot.title}
                                {specs ? ` — ${specs}` : ''}
                                {lot.takenByMe ? ' (bạn đang giữ)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </label>
                  ) : null}
                </section>
              ) : (
                <section className="ld-edit-card">
                  <h2 className="ld-edit-section-title">Thông số lô</h2>
                  <label className="ld-edit-field">
                    <span>Địa chỉ tổng quát *</span>
                    <AddressPicker
                      value={addressId || null}
                      kindFilter={AddressKind.REGULAR}
                      disabled={saving}
                      onChange={(item) => setAddressId(item?.id ?? '')}
                    />
                  </label>
                  <label className="ld-edit-field">
                    <span>Tiêu đề *</span>
                    <input
                      value={title}
                      placeholder="VD: Lô 38 Quán Táo Đông"
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={saving}
                    />
                  </label>
                  <div className="ld-edit-row2">
                    <label className="ld-edit-field">
                      <span>Diện tích (m²)</span>
                      <input
                        value={areaM2}
                        onChange={(e) => setAreaM2(e.target.value.replace(/[^\d.]/g, ''))}
                        disabled={saving}
                      />
                    </label>
                    <label className="ld-edit-field">
                      <span>Mặt tiền (m)</span>
                      <input
                        value={frontageM}
                        onChange={(e) =>
                          setFrontageM(e.target.value.replace(/[^\d.]/g, ''))
                        }
                        disabled={saving}
                      />
                    </label>
                  </div>
                  <label className="ld-edit-field">
                    <span>Hướng lô đất</span>
                    <select
                      value={direction}
                      onChange={(e) => setDirection(e.target.value)}
                      disabled={saving}
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
                      value={kind}
                      onChange={(e) => setKind(e.target.value as LodatKind)}
                      disabled={saving}
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
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={saving}
                    />
                  </label>
                </section>
              )}

              <section className="ld-edit-card">
                <h2 className="ld-edit-section-title">Chủ đất & giá bán</h2>
                <p className="ld-edit-owner">
                  Chủ lô: <strong>{customerName || '…'}</strong> — gắn ngay khi tạo.
                </p>
                <div className="ld-edit-row2">
                  <label className="ld-edit-field">
                    <span>Trạng thái</span>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as CreateLodatInput['status'])
                      }
                      disabled={saving}
                    >
                      <option value={LodatSaleStatus.DANG_BAN}>Mở bán</option>
                      <option value={LodatSaleStatus.TAM_DUNG}>Tạm dừng</option>
                    </select>
                  </label>
                  <label className="ld-edit-field">
                    <span>Giá (VND)</span>
                    <input
                      value={priceVnd}
                      placeholder="VD: 1.234.567"
                      onChange={(e) =>
                        setPriceVnd(formatPriceInput(parsePriceInput(e.target.value)))
                      }
                      disabled={saving}
                    />
                  </label>
                </div>
                <label className="ld-edit-field">
                  <span>Ghi chú giá</span>
                  <input
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    disabled={saving}
                  />
                  <div className="ld-edit-chips">
                    {LODAT_PRICE_NOTE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className={
                          priceNote === chip ? 'ld-edit-chip active' : 'ld-edit-chip'
                        }
                        onClick={() => setPriceNote(chip)}
                        disabled={saving}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </label>
                <label className="ld-edit-field">
                  <span>Hoa hồng</span>
                  <input
                    value={brokerFeeNote}
                    onChange={(e) => setBrokerFeeNote(e.target.value)}
                    disabled={saving}
                  />
                  <div className="ld-edit-chips">
                    {LODAT_BROKER_FEE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className={
                          brokerFeeNote === chip
                            ? 'ld-edit-chip active'
                            : 'ld-edit-chip'
                        }
                        onClick={() => setBrokerFeeNote(chip)}
                        disabled={saving}
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
                    value={mapNote}
                    onChange={(e) => setMapNote(e.target.value)}
                    disabled={saving}
                  />
                </label>
              </section>
            </div>

            <div className="ld-edit-area-side">
              {mode === 'regular' ? (
                <>
                  <LodatEditImages
                    images={previewImages}
                    selectedIndex={selectedIndex}
                    canEditImages={!saving}
                    isProject={false}
                    busy={saving}
                    uploading={false}
                    onSelect={setSelectedIndex}
                    onUpload={(files) => addFiles(files)}
                    onDelete={removeLocalImage}
                  />
                  <LodatEditPreview
                    images={previewImages}
                    selectedIndex={selectedIndex}
                    busy={saving}
                    onOpenGallery={() => undefined}
                    onRotate={() => undefined}
                  />
                </>
              ) : (
                <section className="ld-edit-card">
                  <h2 className="ld-edit-section-title">Hình ảnh</h2>
                  <p className="ld-edit-hint muted">
                    Lô dự án dùng ảnh chung của dự án (Admin quản lý trên sổ địa chỉ).
                  </p>
                </section>
              )}
            </div>

            <footer className="ld-edit-actions">
              <button
                type="button"
                className="ld-edit-cancel"
                disabled={saving}
                onClick={() => router.push('/khach-hang')}
              >
                Huỷ
              </button>
              <button type="submit" className="ld-edit-save" disabled={saving}>
                {saving ? 'Đang tạo…' : 'Tạo lô đất'}
              </button>
            </footer>
          </div>
        </form>
      ) : null}

      <CrmAlertDialog
        open={Boolean(alertMsg)}
        title="Lưu ý"
        message={alertMsg ?? ''}
        onClose={() => setAlertMsg(null)}
      />
      <CrmToast message={toast} />
    </div>
  );
}
