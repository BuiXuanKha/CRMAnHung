import { isTasksPath } from './tasks.js';

/** HttpOnly role cookie for Next.js CRM route guards (BUG-012). Not an auth secret — API still authorizes. */
export const WEB_ROLE_COOKIE = 'crmanhung_web_role';

export type WebCrmRole = 'ADMIN' | 'STAFF';

export function normalizeWebCrmRole(raw: string | undefined | null): WebCrmRole | null {
  const role = raw?.trim().toUpperCase();
  if (role === 'ADMIN' || role === 'STAFF') return role;
  return null;
}

/** Paths under CRM shell that require a logged-in web role cookie. */
export function isCrmAppPath(pathname: string): boolean {
  return (
    pathname === '/dashbroad' ||
    pathname.startsWith('/khach-hang') ||
    pathname.startsWith('/lo-dat') ||
    pathname.startsWith('/giao-dich') ||
    pathname.startsWith('/dich-vu-so-do') ||
    isTasksPath(pathname) ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/quan-tri') ||
    pathname.startsWith('/cai-dat')
  );
}

/** STAFF-only: soạn / đăng lô trên web. Admin không vào (lô thuộc NV). */
export function isStaffLotWebPath(pathname: string): boolean {
  return pathname === '/dashboard/lo-dat' || pathname.startsWith('/dashboard/lo-dat/');
}

/** ADMIN-only CRM areas (STAFF blocked). `/dashboard/lo-dat` is STAFF-only. */
export function isAdminOnlyCrmPath(pathname: string): boolean {
  if (pathname.startsWith('/quan-tri') || pathname.startsWith('/cai-dat')) return true;
  if (!pathname.startsWith('/dashboard')) return false;
  if (isStaffLotWebPath(pathname)) return false;
  return true;
}

/** Where to send a user after login / wrong-role redirect. */
export function crmHomePathForRole(role: WebCrmRole): string {
  return role === 'ADMIN' ? '/dashboard' : '/khach-hang';
}

/** STAFF hitting a non-lot dashboard path → lot publish page. */
export function staffDashboardFallbackPath(): string {
  return '/dashboard/lo-dat';
}
