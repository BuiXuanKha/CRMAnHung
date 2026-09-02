'use client';

import { useEffect, useState } from 'react';
import { UserPlus, UserRoundCog } from 'lucide-react';
import { UserRole, type UserAdminListItem } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';

export type UserFormValues = {
  username: string;
  fullName: string;
  phone: string;
  password: string;
  role: UserRole;
  isActive: boolean;
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  user: UserAdminListItem | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
};

const emptyForm: UserFormValues = {
  username: '',
  fullName: '',
  phone: '',
  password: '',
  role: UserRole.STAFF,
  isActive: true,
};

export function UserFormDialog({
  open,
  mode,
  user,
  busy = false,
  error = null,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<UserFormValues>(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && user) {
      setForm({
        username: user.username,
        fullName: user.fullName,
        phone: user.phone ?? '',
        password: '',
        role: user.role as UserRole,
        isActive: user.isActive !== false,
      });
      return;
    }
    setForm(emptyForm);
  }, [open, mode, user]);

  return (
    <CrmDialog
      open={open}
      title={mode === 'create' ? 'Thêm người dùng' : 'Sửa người dùng'}
      icon={mode === 'create' ? UserPlus : UserRoundCog}
      onClose={onClose}
      busy={busy}
    >
      <form
        className="nv-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        {error ? <p className="crm-form-error">{error}</p> : null}
        <label>
          Tên đăng nhập
          <input
            value={form.username}
            autoComplete="username"
            disabled={busy}
            required
            maxLength={40}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />
        </label>
        <label>
          Họ tên
          <input
            value={form.fullName}
            disabled={busy}
            required
            maxLength={120}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
        </label>
        <label>
          Số điện thoại
          <input
            type="tel"
            inputMode="numeric"
            value={form.phone}
            disabled={busy}
            required
            maxLength={10}
            placeholder="0xxxxxxxxx"
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                phone: e.target.value.replace(/\D/g, '').slice(0, 10),
              }))
            }
          />
        </label>
        {mode === 'create' ? (
          <label>
            Mật khẩu
            <input
              type="password"
              value={form.password}
              autoComplete="new-password"
              disabled={busy}
              required
              minLength={6}
              maxLength={128}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </label>
        ) : null}
        <label>
          Vai trò
          <select
            value={form.role}
            disabled={busy}
            onChange={(e) =>
              setForm((f) => ({ ...f, role: e.target.value as UserRole }))
            }
          >
            <option value={UserRole.STAFF}>Nhân viên</option>
            <option value={UserRole.ADMIN}>Admin</option>
          </select>
        </label>
        {mode === 'edit' ? (
          <label className="nv-checkbox">
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Tài khoản đang hoạt động
          </label>
        ) : null}
        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="crm-btn primary" disabled={busy}>
            {busy ? 'Đang lưu…' : mode === 'create' ? 'Thêm mới' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
