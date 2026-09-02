'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Users } from 'lucide-react';
import { UserRole, type UserAdminListItem } from '@crmanhung/shared';
import { useAuth } from '@/features/auth/auth-context';
import { CrmConfirmDialog, CrmToast } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateUser,
} from './api';
import { ResetPasswordDialog } from './components/reset-password-dialog';
import { UserFormDialog, type UserFormValues } from './components/user-form-dialog';
import { UserTable } from './components/user-table';
import './users.css';
import './users-table.css';

export function UserAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<UserAdminListItem | null>(null);
  const [resetTarget, setResetTarget] = useState<UserAdminListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserAdminListItem | null>(null);
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

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['users-admin'] });
      await qc.invalidateQueries({ queryKey: ['user-directory'] });
      setFormOpen(false);
      setToast('Đã thêm người dùng.');
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['users-admin'] });
      await qc.invalidateQueries({ queryKey: ['user-directory'] });
      setFormOpen(false);
      setEditing(null);
      setToast('Đã cập nhật người dùng.');
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

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['users-admin'] });
      await qc.invalidateQueries({ queryKey: ['user-directory'] });
      setDeleteTarget(null);
      setToast('Đã xóa người dùng.');
    },
    onError: (err: Error) => {
      setDeleteTarget(null);
      setToast(err.message);
    },
  });

  if (authLoading || !user || user.role !== UserRole.ADMIN) {
    return <div className="boot-screen">Đang tải…</div>;
  }

  const items = usersQuery.data ?? [];
  const formBusy = createMut.isPending || updateMut.isPending;

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
    if (formMode === 'create') {
      createMut.mutate({
        username: values.username.trim(),
        fullName: values.fullName.trim(),
        phone: values.phone,
        password: values.password,
        role: values.role,
        isActive: true,
      });
      return;
    }
    if (!editing) return;
    updateMut.mutate({
      id: editing.id,
      input: {
        username: values.username.trim(),
        fullName: values.fullName.trim(),
        phone: values.phone,
        role: values.role,
        isActive: values.isActive,
      },
    });
  }

  return (
    <div className="nv-page">
      <header className="nv-page-head">
        <div>
          <h1>
            <Icon icon={Users} size="sm" /> Quản lý người dùng
          </h1>
          <p>Tài khoản nhân viên và admin — user, mật khẩu, họ tên, SĐT.</p>
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
          currentUserId={user.id}
          onEdit={openEdit}
          onResetPassword={(target) => {
            setResetError(null);
            setResetTarget(target);
          }}
          onDelete={setDeleteTarget}
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

      <CrmConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa người dùng"
        message={
          deleteTarget
            ? `Bạn có chắc muốn xóa «${deleteTarget.fullName}» (${deleteTarget.username})? Thao tác không hoàn tác.`
            : ''
        }
        icon={AlertTriangle}
        danger
        busy={deleteMut.isPending}
        confirmLabel="Xóa"
        onCancel={() => {
          if (deleteMut.isPending) return;
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMut.mutate(deleteTarget.id);
        }}
      />

      <CrmToast message={toast} />
    </div>
  );
}
