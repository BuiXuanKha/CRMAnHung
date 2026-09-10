'use client';

import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import {
  LODAT_BROKER_FEE_CHIPS,
  LODAT_PRICE_NOTE_CHIPS,
  LodatSaleStatus,
  type ChangeLodatOwnerInput,
  type CustomerListItem,
  type LodatOwner,
} from '@crmanhung/shared';
import { listCustomers } from '@/features/customers/api';
import { CrmDialog } from '@/shared/ui/dialog';
import { formatPriceInput, parsePriceInput } from '../api';
import '../lodat-edit.css';
import './change-owner-modal.css';

export type ChangeOwnerMapDraft = {
  status: typeof LodatSaleStatus.DANG_BAN | typeof LodatSaleStatus.TAM_DUNG | typeof LodatSaleStatus.KHONG_BAN;
  priceVnd: string;
  priceNote: string;
  brokerFeeNote: string;
  mapNote: string;
};

type Props = {
  open: boolean;
  currentOwner: LodatOwner | null;
  initialMap: ChangeOwnerMapDraft;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: ChangeLodatOwnerInput) => Promise<void>;
};

const EMPTY_MAP: ChangeOwnerMapDraft = {
  status: LodatSaleStatus.DANG_BAN,
  priceVnd: '',
  priceNote: '',
  brokerFeeNote: '',
  mapNote: '',
};

export function ChangeOwnerModal({
  open,
  currentOwner,
  initialMap,
  busy,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [picked, setPicked] = useState<CustomerListItem | null>(null);
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapDraft, setMapDraft] = useState<ChangeOwnerMapDraft>(EMPTY_MAP);

  useEffect(() => {
    if (!open) return;
    setKeyword('');
    setDebounced('');
    setPicked(null);
    setItems([]);
    setLoadError(null);
    setMapDraft({
      status: initialMap.status,
      priceVnd: initialMap.priceVnd,
      priceNote: initialMap.priceNote,
      brokerFeeNote: initialMap.brokerFeeNote,
      mapNote: initialMap.mapNote,
    });
    // Snapshot when the dialog opens — ignore later parent form edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => setDebounced(keyword.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [keyword, open]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void listCustomers({ keyword: debounced || undefined, limit: 20, offset: 0 })
      .then((res) => {
        if (cancelled) return;
        const currentId = currentOwner?.customerId;
        setItems(res.items.filter((c) => !c.isHidden && c.id !== currentId));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLoadError(err.message || 'Không tải được danh sách khách.');
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debounced, currentOwner?.customerId]);

  function patchMap<K extends keyof ChangeOwnerMapDraft>(
    key: K,
    value: ChangeOwnerMapDraft[K],
  ) {
    setMapDraft((cur) => ({ ...cur, [key]: value }));
  }

  return (
    <CrmDialog
      open={open}
      title="Đổi chủ đất"
      icon={UserRound}
      onClose={onClose}
      busy={busy}
      className="crm-dialog--wide ld-change-owner-modal"
    >
      <p className="ld-change-owner-lead">
        Chủ hiện tại:{' '}
        <strong>{currentOwner?.fullName?.trim() || 'Chưa có chủ'}</strong>
        . Chọn khách mới và chỉnh giá / trạng thái cho map mới nếu cần.
      </p>

      <label className="ld-change-owner-search">
        <span>Tìm khách</span>
        <input
          placeholder="Tên hoặc SĐT…"
          value={keyword}
          disabled={busy}
          autoFocus
          onChange={(e) => setKeyword(e.target.value)}
        />
      </label>

      <div className="ld-change-owner-list-head">
        Danh sách khách <span>({items.length})</span>
      </div>

      {loading ? (
        <p className="ld-change-owner-state">Đang tìm khách…</p>
      ) : loadError ? (
        <p className="ld-change-owner-state error">{loadError}</p>
      ) : items.length === 0 ? (
        <p className="ld-change-owner-state">
          {debounced
            ? 'Không có khách khớp từ khoá.'
            : 'Không có khách trong hồ sơ.'}
        </p>
      ) : (
        <ul className="ld-change-owner-list">
          {items.map((c) => {
            const phone = c.primaryPhone || c.phones[0]?.phone || '—';
            const selected = picked?.id === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={
                    selected
                      ? 'ld-change-owner-item is-selected'
                      : 'ld-change-owner-item'
                  }
                  disabled={busy}
                  onClick={() => setPicked(c)}
                >
                  <span className="ld-change-owner-text">
                    <strong>{c.fullName}</strong>
                    <span className="sub">{phone}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {picked ? (
        <p className="ld-change-owner-picked">
          Chủ mới: <strong>{picked.fullName}</strong>
        </p>
      ) : null}

      <div className="ld-change-owner-map">
        <p className="ld-change-owner-map-title">Thông tin map mới</p>
        <div className="ld-edit-row2">
          <label className="ld-edit-field">
            <span>Trạng thái</span>
            <select
              value={mapDraft.status}
              disabled={busy}
              onChange={(e) =>
                patchMap('status', e.target.value as ChangeOwnerMapDraft['status'])
              }
            >
              <option value={LodatSaleStatus.DANG_BAN}>Mở bán</option>
              <option value={LodatSaleStatus.TAM_DUNG}>Tạm dừng</option>
              <option value={LodatSaleStatus.KHONG_BAN}>Không bán</option>
            </select>
          </label>
          <label className="ld-edit-field">
            <span>Giá (VND)</span>
            <input
              value={mapDraft.priceVnd}
              placeholder="VD: 1.234.567"
              disabled={busy}
              onChange={(e) =>
                patchMap(
                  'priceVnd',
                  formatPriceInput(parsePriceInput(e.target.value)),
                )
              }
            />
          </label>
        </div>

        <label className="ld-edit-field">
          <span>Ghi chú giá</span>
          <input
            value={mapDraft.priceNote}
            disabled={busy}
            onChange={(e) => patchMap('priceNote', e.target.value)}
          />
          <div className="ld-edit-chips">
            {LODAT_PRICE_NOTE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className={
                  mapDraft.priceNote === chip ? 'ld-edit-chip active' : 'ld-edit-chip'
                }
                disabled={busy}
                onClick={() => patchMap('priceNote', chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </label>

        <label className="ld-edit-field">
          <span>Hoa hồng</span>
          <input
            value={mapDraft.brokerFeeNote}
            disabled={busy}
            onChange={(e) => patchMap('brokerFeeNote', e.target.value)}
          />
          <div className="ld-edit-chips">
            {LODAT_BROKER_FEE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className={
                  mapDraft.brokerFeeNote === chip
                    ? 'ld-edit-chip active'
                    : 'ld-edit-chip'
                }
                disabled={busy}
                onClick={() => patchMap('brokerFeeNote', chip)}
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
            value={mapDraft.mapNote}
            disabled={busy}
            onChange={(e) => patchMap('mapNote', e.target.value)}
          />
        </label>
      </div>

      {error ? <p className="crm-form-error">{error}</p> : null}

      <div className="crm-dialog-actions">
        <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
          Huỷ
        </button>
        <button
          type="button"
          className="crm-btn primary"
          disabled={busy || !picked}
          onClick={() => {
            if (!picked) return;
            void onSubmit({
              customerId: picked.id,
              status: mapDraft.status,
              priceVnd: parsePriceInput(mapDraft.priceVnd) || null,
              priceNote: mapDraft.priceNote.trim() || null,
              brokerFeeNote: mapDraft.brokerFeeNote.trim() || null,
              mapNote: mapDraft.mapNote.trim() || null,
            });
          }}
        >
          {busy ? 'Đang đổi…' : 'Đổi chủ'}
        </button>
      </div>
    </CrmDialog>
  );
}
