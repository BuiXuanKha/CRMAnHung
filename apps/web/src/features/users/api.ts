import { type UserDirectoryItem } from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';

/** ADMIN: danh sách NV để lọc hồ sơ sổ đỏ. */
export async function listUserDirectory(): Promise<UserDirectoryItem[]> {
  return apiFetch<UserDirectoryItem[]>('/users');
}
