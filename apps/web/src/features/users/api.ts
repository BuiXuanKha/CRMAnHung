import {
  type ChangeOwnPasswordInput,
  type CreateUserInput,
  type ResetUserPasswordInput,
  type UpdateUserInput,
  type UserAdminListItem,
  type UserDirectoryItem,
  changeOwnPasswordSchema,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';

/** ADMIN: danh sách NV (quản lý + lọc sổ đỏ). */
export async function listUsers(): Promise<UserAdminListItem[]> {
  return apiFetch<UserAdminListItem[]>('/users');
}

/** @deprecated dùng listUsers */
export async function listUserDirectory(): Promise<UserDirectoryItem[]> {
  return listUsers();
}

export async function createUser(input: CreateUserInput): Promise<UserAdminListItem> {
  return apiFetch<UserAdminListItem>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<UserAdminListItem> {
  return apiFetch<UserAdminListItem>(`/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function resetUserPassword(
  id: string,
  input: ResetUserPasswordInput,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/users/${encodeURIComponent(id)}/reset-password`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

/** STAFF/ADMIN đổi mật khẩu chính mình (avatar menu). */
export async function changeOwnPassword(
  input: ChangeOwnPasswordInput,
): Promise<{ ok: boolean }> {
  const parsed = changeOwnPasswordSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Không đổi được mật khẩu.');
  }
  return apiFetch<{ ok: boolean }>('/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
}

export async function uploadUserAvatar(
  id: string,
  file: File,
): Promise<UserAdminListItem> {
  const body = new FormData();
  body.append('file', file);
  return apiFetch<UserAdminListItem>(`/users/${encodeURIComponent(id)}/avatar`, {
    method: 'POST',
    body,
  });
}

export async function deleteUserAvatar(id: string): Promise<UserAdminListItem> {
  return apiFetch<UserAdminListItem>(`/users/${encodeURIComponent(id)}/avatar`, {
    method: 'DELETE',
  });
}
