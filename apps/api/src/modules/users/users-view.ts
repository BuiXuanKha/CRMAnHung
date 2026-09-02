import type { StorageService } from '../../storage/storage.service';

export type UserAdminRow = {
  id: string;
  fullName: string;
  username: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  avatarObjectKey: string | null;
};

export function userAvatarUrl(
  storage: StorageService,
  objectKey: string | null | undefined,
): string | null {
  const key = objectKey?.trim();
  if (!key || !storage.isConfigured()) return null;
  return storage.publicUrl(key);
}

export function toAdminUser(row: UserAdminRow, storage: StorageService) {
  return {
    id: row.id,
    fullName: row.fullName,
    username: row.username,
    phone: row.phone,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    avatarUrl: userAvatarUrl(storage, row.avatarObjectKey),
  };
}
