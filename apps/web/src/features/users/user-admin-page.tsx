'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { UserRole, type UserAdminListItem } from '@crmanhung/shared';
import { useAuth } from '@/features/auth/auth-context';
import { CrmToast } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import {
  createUser,
  deleteUserAvatar,
  listUsers,
  resetUserPassword,
  updateUser,
  uploadUserAvatar,
} from './api';
import { ResetPasswordDialog } from './components/reset-password-dialog';
import { UserFormDialog, type UserFormValues } from './components/user-form-dialog';
import { UserTable } from './components/user-table';
import './users.css';
import './users-table.css';

export function UserAdminPage() {
  const { user, loading: authLoading, reloadMe } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<UserAdminListItem | null>(null);
  const [resetTarget, setResetTarget] = useState<UserAdminListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== UserRole.ADMIN) {
      router.replace('/khach-hang');
    }
  }, [authLoading, user, router]);

  const usersQuery = useQuery({
    queryKey: ['users-admin'],
    queryFn: listUsers,
    enabled: !authLoading && user?.role === UserRole.ADMIN,
  });

  const saveMut = useMutation({
    mutationFn: async ({
      mode,
      editingId,
      values,
    }: {
      mode: 'create' | 'edit';
      editingId: string | null;
      values: UserFormValues;
    }) => {
      if (mode === 'create') {
        const created = await createUser({
          username: values.username.trim(),
          fullName: values.fullName.trim(),
          phone: values.phone,
          password: values.password,
          role: values.role,
          isActive: true,
        });
        if (values.avatarFile) {
          await uploadUserAvatar(created.id, values.avatarFile);
        }
        return { kind: 'create' as const, userId: created.id };
      }
      if (!editingId) throw new Error('Thiếu người dùng cần sửa.');
      await updateUser(editingId, {
        username: values.username.trim(),
        fullName: values.fullName.trim(),
        phone: values.phone,
        role: values.role,
        isActive: values.isActive,
      });
      if (values.avatarFile) {
        await uploadUserAvatar(editingId, values.avatarFile);
      } else if (values.removeAvatar) {
        await deleteUserAvatar(editingId);
      }
      return { kind: 'edit' as const, userId: editingId };
    },
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ['users-admin'] });
      await qc.invalidateQueries({ queryKey: ['user-directory'] });
      if (res.userId === user?.id) {
        await reloadMe();
      }
      setFormOpen(false);
      setEditing(null);
      setToast(res.kind === 'create' ? 'Đã thêm người dùng.' : 'Đã cập nhật người dùng.');
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const resetMut = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetUserPassword(id, { password }),
    onSuccess: async () => {
      setResetTarget(null);
      setToast('Đã đặt lại mật khẩu.');
    },
    onError: (err: Error) => setResetError(err.message),
  });

  if (authLoading || !user || user.role !== UserRole.ADMIN) {
    return <div className="boot-screen">Đang tải…</div>;
  }

  const items = usersQuery.data ?? [];
  const formBusy = saveMut.isPending;

  function openCreate() {
    setFormMode('create');
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(target: UserAdminListItem) {
    setFormMode('edit');
    setEditing(target);
    setFormError(null);
    setFormOpen(true);
  }

  function handleFormSubmit(values: UserFormValues) {
    setFormError(null);
    saveMut.mutate({
      mode: formMode,
      editingId: editing?.id ?? null,
      values,
    });
  }

  return (
    <div className="nv-page">
      <header className="nv-page-head">
        <div>
          <h1>
            <Icon icon={Users} size="sm" /> Quản lý người dùng
          </h1>
          <p>Tài khoản nhân viên và admin — user, mật khẩu, họ tên, SĐT, avatar.</p>
        </div>
        <button type="button" className="crm-btn primary nv-add-btn" onClick={openCreate}>
          <Icon icon={Plus} size="sm" />
          Thêm mới
        </button>
      </header>

      {usersQuery.isLoading ? (
        <div className="boot-screen">Đang tải danh sách…</div>
      ) : usersQuery.isError ? (
        <p className="crm-form-error">
          {usersQuery.error instanceof Error
            ? usersQuery.error.message
            : 'Không tải được danh sách.'}
        </p>
      ) : (
        <UserTable
          items={items}
          onEdit={openEdit}
          onResetPassword={(target) => {
            setResetError(null);
            setResetTarget(target);
          }}
        />
      )}

      <UserFormDialog
        open={formOpen}
        mode={formMode}
        user={editing}
        busy={formBusy}
        error={formError}
        onClose={() => {
          if (formBusy) return;
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <ResetPasswordDialog
        open={Boolean(resetTarget)}
        user={resetTarget}
        busy={resetMut.isPending}
        error={resetError}
        onClose={() => {
          if (resetMut.isPending) return;
          setResetTarget(null);
          setResetError(null);
        }}
        onSubmit={(password) => {
          if (!resetTarget) return;
          setResetError(null);
          resetMut.mutate({ id: resetTarget.id, password });
        }}
      />

      <CrmToast message={toast} />
    </div>
  );
}
