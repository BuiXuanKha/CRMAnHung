'use client';

import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import type { UserAdminListItem } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';

type Props = {
  open: boolean;
  user: UserAdminListItem | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
};

export function ResetPasswordDialog({
  open,
  user,
  busy = false,
  error = null,
  onClose,
  onSubmit,
}: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setConfirm('');
  }, [open, user?.id]);

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <CrmDialog
      open={open}
      title="Reset mật khẩu"
      icon={KeyRound}
      onClose={onClose}
      busy={busy}
    >
      <form
        className="nv-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (password !== confirm) return;
          onSubmit(password);
        }}
      >
        {user ? (
          <p className="crm-form-hint">
            Đặt mật khẩu mới cho <strong>{user.fullName}</strong> ({user.username}).
          </p>
        ) : null}
        {error ? <p className="crm-form-error">{error}</p> : null}
        <label>
          Mật khẩu mới
          <input
            type="password"
            value={password}
            autoComplete="new-password"
            disabled={busy}
            required
            minLength={6}
            maxLength={18}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          Nhập lại mật khẩu
          <input
            type="password"
            value={confirm}
            autoComplete="new-password"
            disabled={busy}
            required
            minLength={6}
            maxLength={18}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {mismatch ? (
          <p className="crm-form-error">Hai mật khẩu không khớp.</p>
        ) : null}
        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
            Huỷ
          </button>
          <button
            type="submit"
            className="crm-btn primary"
            disabled={busy || mismatch || password.length < 6 || password.length > 18}
          >
            {busy ? 'Đang lưu…' : 'Đặt mật khẩu'}
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
