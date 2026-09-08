'use client';

import { FormEvent, useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { USER_PASSWORD_HINT, isValidUserPassword } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';

type Props = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => void;
};

export function ChangePasswordDialog({
  open,
  busy = false,
  error = null,
  onClose,
  onSubmit,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!open) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirm('');
  }, [open]);

  const mismatch = confirm.length > 0 && newPassword !== confirm;
  const sameAsCurrent =
    newPassword.length > 0 && currentPassword.length > 0 && newPassword === currentPassword;
  const passwordOk = isValidUserPassword(newPassword);
  const canSubmit =
    currentPassword.length > 0 && passwordOk && !mismatch && !sameAsCurrent && !busy;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(currentPassword, newPassword);
  }

  return (
    <CrmDialog open={open} title="Đổi mật khẩu" icon={KeyRound} onClose={onClose} busy={busy}>
      <form onSubmit={handleSubmit}>
        {error ? <p className="crm-form-error">{error}</p> : null}
        <label>
          Mật khẩu hiện tại
          <input
            type="password"
            value={currentPassword}
            autoComplete="current-password"
            disabled={busy}
            required
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label>
          Mật khẩu mới
          <input
            type="password"
            value={newPassword}
            autoComplete="new-password"
            disabled={busy}
            required
            minLength={6}
            maxLength={18}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <span className="crm-form-hint">{USER_PASSWORD_HINT}</span>
        </label>
        <label>
          Nhập lại mật khẩu mới
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
        {mismatch ? <p className="crm-form-error">Hai mật khẩu không khớp.</p> : null}
        {sameAsCurrent ? (
          <p className="crm-form-error">Mật khẩu mới phải khác mật khẩu hiện tại.</p>
        ) : null}
        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="crm-btn primary" disabled={!canSubmit}>
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
