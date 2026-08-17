'use client';

import { Phone } from 'lucide-react';
import { useState } from 'react';
import { CrmDialog } from '@/shared/ui/dialog';

type Props = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (fullName: string, phone: string) => Promise<void>;
};

export function AddByPhoneModal({ open, busy, error, onClose, onSubmit }: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <CrmDialog open={open} title="Thêm khách hàng bằng số điện thoại" icon={Phone} onClose={onClose} busy={busy}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(fullName.trim(), phone.trim()).then(() => {
            setFullName('');
            setPhone('');
          });
        }}
      >
        <label>
          Tên khách
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Số điện thoại
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0xxxxxxxxx"
            required
          />
        </label>
        {error ? <p className="crm-form-error">{error}</p> : null}
        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="crm-btn primary" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Thêm khách'}
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
