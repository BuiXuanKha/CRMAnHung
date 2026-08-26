import { UserRole, type AuthUser } from '@crmanhung/shared';

/** Sau login: ADMIN vào `/dashboard` trước; STAFF vào `/khach-hang`. */
export function crmHomePath(user: Pick<AuthUser, 'role'>): string {
  return String(user.role).toUpperCase() === UserRole.ADMIN ? '/dashboard' : '/khach-hang';
}
