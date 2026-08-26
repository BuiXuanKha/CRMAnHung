'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import type { PublicWebLotRow } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { lotPriceDisplay } from '../display';

type Props = {
  open: boolean;
  pendingLots: PublicWebLotRow[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onPublish: (id: string) => Promise<void>;
};

export function PublishLotDialog({
  open,
  pendingLots,
  busy,
  error,
  onClose,
  onPublish,
}: Props) {
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedId(pendingLots[0]?.id ?? '');
  }, [open, pendingLots]);

  return (
    <CrmDialog open={open} title="Đăng lô lên web" icon={Globe} onClose={onClose} busy={busy}>
      {pendingLots.length === 0 ? (
        <>
          <p className="crm-dialog-message">
            Không còn lô chờ đăng. Mọi lô trong danh sách đang hiện trên web khách.
          </p>
          <div className="crm-dialog-actions">
            <button type="button" className="crm-btn primary" onClick={onClose}>
              Đã hiểu
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedId) return;
            void onPublish(selectedId);
          }}
        >
          <p className="crm-form-hint">
            Chọn lô đang mở bán CRM, chưa Đăng web. Copy public chi tiết làm slice sau.
          </p>
          <fieldset className="pw-pick-list" disabled={busy}>
            <legend>Lô chờ đăng</legend>
            {pendingLots.map((row) => {
              const price = lotPriceDisplay(row);
              return (
                <label key={row.id} className="pw-pick-item">
                  <input
                    type="radio"
                    name="pending-lot"
                    value={row.id}
                    checked={selectedId === row.id}
                    onChange={() => setSelectedId(row.id)}
                  />
                  <span>
                    <strong>{row.title}</strong>
                    <span className="pw-sub">
                      {row.location || '—'} · {price.text}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          {error ? <p className="crm-form-error">{error}</p> : null}
          <div className="crm-dialog-actions">
            <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="crm-btn primary" disabled={busy || !selectedId}>
              {busy ? 'Đang đăng…' : 'Đăng web'}
            </button>
          </div>
        </form>
      )}
    </CrmDialog>
  );
}
