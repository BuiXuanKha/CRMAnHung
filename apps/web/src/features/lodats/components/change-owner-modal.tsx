'use client';

import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import type { CustomerListItem, LodatOwner } from '@crmanhung/shared';
import { listCustomers } from '@/features/customers/api';
import { CrmDialog } from '@/shared/ui/dialog';
import './change-owner-modal.css';

type Props = {
  open: boolean;
  currentOwner: LodatOwner | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (customerId: string) => Promise<void>;
};

export function ChangeOwnerModal({
  open,
  currentOwner,
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

  useEffect(() => {
    if (!open) return;
    setKeyword('');
    setDebounced('');
    setPicked(null);
    setItems([]);
    setLoadError(null);
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
        . Chọn khách mới trong hồ sơ của bạn — map cũ sẽ đóng, map mới giữ giá và
        trạng thái rao bán.
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
            void onSubmit(picked.id);
          }}
        >
          {busy ? 'Đang đổi…' : 'Đổi chủ'}
        </button>
      </div>
    </CrmDialog>
  );
}
