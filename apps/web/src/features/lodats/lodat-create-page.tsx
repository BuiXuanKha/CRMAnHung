'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ImagePlus, X } from 'lucide-react';
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
  type AddressListItem,
  type CreateLodatInput,
  type LodatImage,
  type ProjectLotOption,
} from '@crmanhung/shared';
import { AddressPicker } from '@/features/addresses/components/address-picker';
import { useAuth } from '@/features/auth/auth-context';
import { getCustomer, listCustomerMessages } from '@/features/customers/api';
import { Icon } from '@/shared/ui/icon';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import {
  createLodat,
  formatPriceInput,
  listProjectLotOptions,
  parsePriceInput,
  uploadLodatImage,
} from './api';
import { LodatEditPreview } from './components/lodat-edit-preview';
import { ProjectLotModal } from './components/project-lot-modal';
import './lodat-edit.css';

/** Hàng ảnh chờ tạo: ảnh chat reuse hoặc file chọn từ máy. */
type QueueImage =
  | { kind: 'chat'; id: string; url: string; rotationDeg: number }
  | { kind: 'file'; file: File; url: string };

function filterImageFiles(list: FileList | File[] | null | undefined): File[] {
  return Array.from(list ?? []).filter((f) =>
    String(f.type || '').startsWith('image/'),
  );
}

/** Form tạo lô từ khách — UI theo CRM cũ (lodats.md §12.5). */
export function LodatCreatePage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const router = useRouter();
  const { user } = useAuth();

  const [address, setAddress] = useState<AddressListItem | null>(null);
  const [projectLotId, setProjectLotId] = useState('');
  const [selectedLot, setSelectedLot] = useState<ProjectLotOption | null>(null);
  const [lotModalOpen, setLotModalOpen] = useState(false);
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
  const [queue, setQueue] = useState<QueueImage[]>([]);
  const [chatSeeded, setChatSeeded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  const isProject = address?.kind === AddressKind.PROJECT;

  const customerQ = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomer(customerId),
    enabled: Boolean(customerId),
  });
  const customerName = customerQ.data?.fullName ?? '';

  const messagesQ = useQuery({
    queryKey: ['customer-messages', customerId],
    queryFn: () => listCustomerMessages(customerId),
    enabled: Boolean(customerId) && Boolean(customerQ.data?.facebook),
  });

  // CRM cũ: lấy sẵn ảnh từ hội thoại Messenger (mới nhất, tối đa 5)
  useEffect(() => {
    if (chatSeeded || !messagesQ.data) return;
    const all = messagesQ.data.messages.flatMap((m) => m.images);
    const latest = all.slice(-LODAT_MAX_UPLOAD_IMAGES);
    if (latest.length) {
      setQueue(
        latest.map((img) => ({
          kind: 'chat' as const,
          id: img.id,
          url: img.url,
          rotationDeg: img.rotationDeg ?? 0,
        })),
      );
    }
    setChatSeeded(true);
  }, [chatSeeded, messagesQ.data]);

  const lotsQ = useQuery({
    queryKey: ['project-lots', address?.id],
    queryFn: () => listProjectLotOptions(address!.id),
    enabled: isProject && Boolean(address?.id),
  });
  const lotOptions = lotsQ.data?.items ?? [];

  useEffect(() => {
    return () => {
      queue.forEach((img) => {
        if (img.kind === 'file') URL.revokeObjectURL(img.url);
      });
    };
    // Dọn objectURL khi rời trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewImages: LodatImage[] = useMemo(
    () =>
      queue.map((img, i) => ({
        id: `q-${i}`,
        url: img.url,
        rotationDeg: img.kind === 'chat' ? img.rotationDeg : 0,
        source: 'lodat' as const,
      })),
    [queue],
  );
  const chatCount = queue.filter((q) => q.kind === 'chat').length;
  const atLimit = queue.length >= LODAT_MAX_UPLOAD_IMAGES;
  const pasteDisabled = saving || atLimit;

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  function addFiles(list: FileList | File[] | null | undefined) {
    const files = filterImageFiles(list);
    if (!files.length || pasteDisabled) return;
    setQueue((cur) => {
      const room = LODAT_MAX_UPLOAD_IMAGES - cur.length;
      const next = files.slice(0, Math.max(0, room)).map((file) => ({
        kind: 'file' as const,
        file,
        url: URL.createObjectURL(file),
      }));
      const merged = [...cur, ...next];
      setSelectedIndex(Math.max(0, merged.length - 1));
      return merged;
    });
  }

  function removeAt(idx: number) {
    setQueue((cur) => {
      const target = cur[idx];
      if (target?.kind === 'file') URL.revokeObjectURL(target.url);
      const next = cur.filter((_, i) => i !== idx);
      setSelectedIndex((s) => Math.min(s, Math.max(0, next.length - 1)));
      return next;
    });
  }

  function clearChatImages() {
    setQueue((cur) => {
      const next = cur.filter((img) => img.kind !== 'chat');
      setSelectedIndex((s) => Math.min(s, Math.max(0, next.length - 1)));
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setFormError(null);

    if (!address) {
      setFormError('Cần chọn địa chỉ tổng quát.');
      return;
    }

    const input: CreateLodatInput = {
      customerId,
      status,
      kind,
      priceVnd: parsePriceInput(priceVnd) || null,
      priceNote: priceNote.trim() || null,
      brokerFeeNote: brokerFeeNote.trim() || null,
    };
    if (isProject) {
      if (!projectLotId) {
        setFormError('Cần chọn một lô trong kho dự án.');
        return;
      }
      input.projectLotId = projectLotId;
      input.mapNote = note.trim() || null;
    } else {
      if (!title.trim()) {
        setFormError('Cần nhập tiêu đề lô đất.');
        return;
      }
      input.addressId = address.id;
      input.title = title.trim();
      input.areaM2 = areaM2 ? Number(areaM2) : null;
      input.frontageM = frontageM ? Number(frontageM) : null;
      input.direction = direction.trim() || null;
      input.note = note.trim() || null;
    }
    const chatIds = queue
      .filter((img): img is Extract<QueueImage, { kind: 'chat' }> => img.kind === 'chat')
      .map((img) => img.id);
    if (chatIds.length) input.chatImageIds = chatIds;

    setSaving(true);
    try {
      const created = await createLodat(input);
      const files = queue.filter(
        (img): img is Extract<QueueImage, { kind: 'file' }> => img.kind === 'file',
      );
      for (const img of files) {
        try {
          await uploadLodatImage(created.id, img.file);
        } catch {
          setAlertMsg(
            'Tạo lô thành công nhưng một số ảnh chưa tải lên được. Thêm lại ảnh trong trang Sửa.',
          );
          break;
        }
      }
      flash('Đã tạo lô đất.');
      router.push(`/lo-dat/${created.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không tạo được lô đất.');
      setSaving(false);
    }
  }

  if (user?.role === UserRole.ADMIN) {
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

  const zoneClass = [
    'ld-edit-paste-zone',
    dragOver ? 'drag-over' : '',
    pasteDisabled ? 'disabled' : '',
    atLimit ? 'at-limit' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
                <h2 className="ld-edit-section-title">Thông tin</h2>

                <label className="ld-edit-field">
                  <span>Địa chỉ tổng quát *</span>
                  <AddressPicker
                    value={address?.id ?? null}
                    disabled={saving}
                    onChange={(item) => {
                      setAddress(item);
                      setProjectLotId('');
                      setSelectedLot(null);
                      // CRM cũ: chọn dự án → mở luôn modal chọn lô kho
                      if (item?.kind === AddressKind.PROJECT) setLotModalOpen(true);
                    }}
                  />
                </label>

                {isProject ? (
                  <div className="ld-edit-field">
                    <span>Lô trong kho *</span>
                    {selectedLot ? (
                      <p className="ld-edit-hint">
                        Đã chọn: <strong>{selectedLot.title}</strong>
                        {[
                          selectedLot.areaM2 != null
                            ? `${selectedLot.areaM2.toLocaleString('vi-VN')} m²`
                            : null,
                          selectedLot.frontageM != null
                            ? `MT ${selectedLot.frontageM.toLocaleString('vi-VN')} m`
                            : null,
                          selectedLot.direction || null,
                        ]
                          .filter(Boolean)
                          .map((s) => ` · ${s}`)
                          .join('')}
                      </p>
                    ) : (
                      <p className="ld-edit-hint muted">Chưa chọn lô trong kho.</p>
                    )}
                    <div className="ld-edit-chips">
                      <button
                        type="button"
                        className="ld-edit-chip"
                        disabled={saving}
                        onClick={() => setLotModalOpen(true)}
                      >
                        {selectedLot ? 'Đổi lô khác' : 'Chọn lô trong kho'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="ld-edit-field">
                      <span>Tiêu đề *</span>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={saving}
                      />
                    </label>
                    <div className="ld-edit-row2">
                      <label className="ld-edit-field">
                        <span>Diện tích (m²)</span>
                        <input
                          value={areaM2}
                          onChange={(e) =>
                            setAreaM2(e.target.value.replace(/[^\d.]/g, ''))
                          }
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
                  </>
                )}

                <div className="ld-edit-row2">
                  {!isProject ? (
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
                  ) : null}
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
                          brokerFeeNote === chip ? 'ld-edit-chip active' : 'ld-edit-chip'
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
                  <span>Ghi chú lô đất</span>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={saving}
                  />
                </label>

                <div className="ld-edit-row2">
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
                </div>
              </section>

              <section className="ld-edit-card">
                <h2 className="ld-edit-section-title">Hình ảnh</h2>
                {isProject ? (
                  <p className="ld-edit-hint">
                    Ảnh dự án (chung KĐT) do Admin quản lý trên sổ địa chỉ — hiện trên
                    chi tiết sau khi tạo. Ảnh bạn thêm ở đây là ảnh riêng của thửa.
                  </p>
                ) : null}
                {chatCount > 0 ? (
                  <p className="ld-edit-hint">
                    Đã lấy {chatCount} ảnh từ cuộc hội thoại Messenger. Bỏ chọn bằng
                    nút × trên ảnh hoặc «Không dùng ảnh chat» nếu không dùng cho lô
                    này.
                  </p>
                ) : null}
                <p className="ld-edit-limit-hint">
                  Ảnh bạn thêm: tối đa {LODAT_MAX_UPLOAD_IMAGES} (dán, kéo thả hoặc
                  chọn file).
                </p>

                    <div className="ld-edit-paste">
                      <div className="ld-edit-paste-head">
                        <p className="ld-edit-paste-title">Thêm ảnh — dán hoặc kéo thả</p>
                        <span className="ld-edit-paste-counter" aria-live="polite">
                          {queue.length}/{LODAT_MAX_UPLOAD_IMAGES}
                        </span>
                      </div>
                      <div
                        ref={zoneRef}
                        className={zoneClass}
                        tabIndex={pasteDisabled ? -1 : 0}
                        role="region"
                        aria-label="Vùng thêm ảnh bằng dán hoặc kéo thả"
                        aria-disabled={pasteDisabled}
                        onPaste={(e) => {
                          if (pasteDisabled) return;
                          const files = filterImageFiles(e.clipboardData?.files);
                          if (!files.length) return;
                          e.preventDefault();
                          addFiles(files);
                        }}
                        onDragOver={(e) => {
                          if (pasteDisabled) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
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
                          addFiles(e.dataTransfer?.files);
                        }}
                        onClick={() => {
                          if (!pasteDisabled) zoneRef.current?.focus();
                        }}
                      >
                        {atLimit ? (
                          <p className="ld-edit-paste-text">
                            Đã đủ {LODAT_MAX_UPLOAD_IMAGES} ảnh.
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
                    </div>

                    <div className="ld-edit-upload-row">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="ld-edit-file-input"
                        disabled={pasteDisabled}
                        onChange={(e) => {
                          addFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        className="ld-edit-upload-btn"
                        disabled={pasteDisabled}
                        onClick={() => fileRef.current?.click()}
                      >
                        <Icon icon={ImagePlus} size={16} /> Thêm ảnh
                      </button>
                      {chatCount > 0 ? (
                        <button
                          type="button"
                          className="ld-edit-cancel"
                          disabled={saving}
                          onClick={clearChatImages}
                        >
                          Không dùng ảnh chat
                        </button>
                      ) : null}
                    </div>
              </section>
            </div>

            <div className="ld-edit-area-side">
              <LodatEditPreview
                images={previewImages}
                selectedIndex={selectedIndex}
                busy={saving}
                onOpenGallery={() => undefined}
                onRotate={() => undefined}
              />
              {previewImages.length ? (
                <div className="ld-edit-thumbs" role="list" aria-label="Ảnh sẽ gắn vào lô">
                  {previewImages.map((img, idx) => (
                    <div
                      key={img.id ?? idx}
                      className={
                        idx === selectedIndex ? 'ld-edit-thumb active' : 'ld-edit-thumb'
                      }
                    >
                      <button
                        type="button"
                        className="ld-edit-thumb-btn"
                        aria-label={`Xem ảnh ${idx + 1}`}
                        onClick={() => setSelectedIndex(idx)}
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
                      <button
                        type="button"
                        className="ld-edit-thumb-del"
                        aria-label="Bỏ ảnh"
                        disabled={saving}
                        onClick={() => removeAt(idx)}
                      >
                        <Icon icon={X} size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <footer className="ld-edit-actions">
              <button
                type="button"
                className="ld-edit-cancel"
                disabled={saving}
                onClick={() => router.push('/khach-hang')}
              >
                Hủy
              </button>
              <button type="submit" className="ld-edit-save" disabled={saving}>
                {saving ? 'Đang lưu…' : 'Lưu'}
              </button>
            </footer>
          </div>
        </form>
      ) : null}

      <ProjectLotModal
        open={lotModalOpen && Boolean(address) && isProject}
        address={address}
        lots={lotOptions}
        loading={lotsQ.isLoading}
        onPick={(lot) => {
          setProjectLotId(lot.id);
          setSelectedLot(lot);
          setLotModalOpen(false);
        }}
        onCancelProject={() => {
          setAddress(null);
          setProjectLotId('');
          setSelectedLot(null);
          setLotModalOpen(false);
        }}
        onClose={() => setLotModalOpen(false)}
      />

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
