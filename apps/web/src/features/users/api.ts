import { UserRole, type UserDirectoryItem } from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';
import { isMockAuth } from '@/shared/api/mode';
import { MOCK_ADMIN, MOCK_STAFF } from '@/features/customers/mock-data';

const MOCK_OTHER: UserDirectoryItem = {
  id: 'user_staff_other',
  username: 'buinam',
  fullName: 'Bùi Nam',
  role: UserRole.STAFF,
  isActive: true,
};

/** ADMIN: danh sách NV để lọc hồ sơ sổ đỏ. */
export async function listUserDirectory(): Promise<UserDirectoryItem[]> {
  if (isMockAuth()) {
    return [
      { ...MOCK_STAFF, isActive: true },
      MOCK_OTHER,
      { ...MOCK_ADMIN, isActive: true },
    ];
  }
  return apiFetch<UserDirectoryItem[]>('/users');
}
