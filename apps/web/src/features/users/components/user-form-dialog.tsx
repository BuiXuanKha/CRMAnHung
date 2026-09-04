'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, UserPlus, UserRoundCog } from 'lucide-react';
import { UserRole, type UserAdminListItem } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { handlePhonePaste, phoneDigitsFromChange } from '@/shared/phone-input';
import { Icon } from '@/shared/ui/icon';
import { UserAvatar } from './user-avatar';

export type UserFormValues = {
  username: string;
  fullName: string;
  phone: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  avatarFile: File | null;
  removeAvatar: boolean;
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
  avatarFile: null,
  removeAvatar: false,
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
        avatarFile: null,
        removeAvatar: false,
      });
      setPreviewUrl(null);
      return;
    }
    setForm(emptyForm);
    setPreviewUrl(null);
  }, [open, mode, user]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const shownUrl = previewUrl ?? (form.removeAvatar ? null : user?.avatarUrl ?? null);

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
        <div className="nv-avatar-field">
          <UserAvatar name={form.fullName || user?.fullName || '?'} url={shownUrl} size="lg" />
          <div className="nv-avatar-actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                e.target.value = '';
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(file ? URL.createObjectURL(file) : null);
                setForm((f) => ({ ...f, avatarFile: file, removeAvatar: false }));
              }}
            />
            <button
              type="button"
              className="crm-btn"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Icon icon={ImagePlus} size="sm" />
              Chọn ảnh
            </button>
            {shownUrl ? (
              <button
                type="button"
                className="crm-btn"
                disabled={busy}
                onClick={() => {
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  setForm((f) => ({ ...f, avatarFile: null, removeAvatar: true }));
                }}
              >
                Gỡ ảnh
              </button>
            ) : null}
            <span className="nv-avatar-hint">JPG, PNG hoặc WebP — tối đa 2 MB.</span>
          </div>
        </div>
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
            placeholder="0xxxxxxxxx"
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                phone: phoneDigitsFromChange(e),
              }))
            }
            onPaste={(e) =>
              handlePhonePaste(e, (digits) => setForm((f) => ({ ...f, phone: digits })))
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
              maxLength={18}
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
