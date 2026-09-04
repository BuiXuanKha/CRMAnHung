import { UserRole, crmHomePathForRole, type AuthUser } from '@crmanhung/shared';

/** Sau login: ADMIN vào `/dashboard` trước; STAFF vào `/khach-hang`. */
export function crmHomePath(user: Pick<AuthUser, 'role'>): string {
  const role =
    String(user.role).toUpperCase() === UserRole.ADMIN ? 'ADMIN' : 'STAFF';
  return crmHomePathForRole(role);
}
