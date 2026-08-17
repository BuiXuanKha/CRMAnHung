'use client';

import { useState } from 'react';

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

  if (!open) return null;

  return (
    <div className="kh-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="kh-modal"
        role="dialog"
        aria-labelledby="kh-add-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kh-add-title">Thêm khách hàng bằng số điện thoại</h2>
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
          {error ? <p className="kh-form-error">{error}</p> : null}
          <div className="kh-modal-actions">
            <button type="button" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? 'Đang lưu…' : 'Thêm khách'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
