import { UserRole, type AuthUser } from '@crmanhung/shared';

/** ADMIN vào dashboard đăng web; STAFF vào CRM khách. */
export function crmHomePath(user: Pick<AuthUser, 'role'>): string {
  return user.role === UserRole.ADMIN ? '/dashboard' : '/khach-hang';
}
