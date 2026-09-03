'use client';

import { Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EmployeeHotline } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { handlePhonePaste, phoneDigitsFromChange } from '@/shared/phone-input';
import { createHotline, listMyHotlines, updateHotline } from '../customers/api';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function HotlinesSettingsDialog({ open, onClose }: Props) {
  const [items, setItems] = useState<EmployeeHotline[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState('');

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const res = await listMyHotlines(false);
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được hotline.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setPhone('');
    setLabel('');
    void reload();
  }, [open]);

  return (
    <CrmDialog
      open={open}
      title="Quản lý SĐT (hotline)"
      icon={Phone}
      onClose={onClose}
      busy={busy}
    >
      {loading ? <p className="crm-form-hint">Đang tải…</p> : null}
      {error ? <p className="crm-form-error">{error}</p> : null}
      <ul className="crm-hotline-list">
        {items.map((h) => (
          <li key={h.id}>
            <div>
              <strong>
                {h.label} ({h.phone})
              </strong>
              <span>{h.isActive ? 'Đang bật' : 'Đã tắt'}</span>
            </div>
            <button
              type="button"
              className="crm-btn"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setError(null);
                void updateHotline(h.id, { isActive: !h.isActive })
                  .then(() => reload())
                  .catch((err: unknown) => {
                    setError(err instanceof Error ? err.message : 'Không cập nhật được.');
                  })
                  .finally(() => setBusy(false));
              }}
            >
              {h.isActive ? 'Tắt' : 'Bật'}
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          void createHotline({ phone, label })
            .then(() => {
              setPhone('');
              setLabel('');
              return reload();
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : 'Không thêm được hotline.');
            })
            .finally(() => setBusy(false));
        }}
      >
        <label>
          Số hotline mới
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            placeholder="0xxxxxxxxx"
            disabled={busy}
            required
            onChange={(e) => setPhone(phoneDigitsFromChange(e))}
            onPaste={(e) => handlePhonePaste(e, setPhone)}
          />
        </label>
        <label>
          Tên hiển thị
          <input
            value={label}
            maxLength={80}
            placeholder="VD: Zalo Khả"
            disabled={busy}
            required
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
            Đóng
          </button>
          <button type="submit" className="crm-btn primary" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Thêm hotline'}
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
