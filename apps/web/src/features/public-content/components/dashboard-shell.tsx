'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, LayoutDashboard, Map, BarChart3 } from 'lucide-react';
import { UserRole, isStaffLotWebPath } from '@crmanhung/shared';
import { useAuth } from '@/features/auth/auth-context';
import { Icon } from '@/shared/ui/icon';
import './dashboard-shell.css';

const ADMIN_MENU = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/bai-viet', label: 'Bài viết', icon: FileText, exact: false },
  { href: '/dashboard/thong-ke', label: 'Thống kê', icon: BarChart3, exact: false },
] as const;

const STAFF_MENU = [
  { href: '/dashboard/lo-dat', label: 'Lô đất', icon: Map, exact: false },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isStaff = user?.role === UserRole.STAFF;
  const onStaffLots = isStaffLotWebPath(pathname);
  const staffOnLots = Boolean(isStaff && onStaffLots);
  const adminOnLots = Boolean(isAdmin && onStaffLots);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === UserRole.ADMIN) {
      if (isStaffLotWebPath(pathname)) {
        router.replace('/dashboard');
      }
      return;
    }
    if (user.role === UserRole.STAFF) {
      if (!isStaffLotWebPath(pathname)) {
        router.replace('/dashboard/lo-dat');
      }
      return;
    }
    router.replace('/khach-hang');
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return <div className="boot-screen">Đang tải…</div>;
  }
  if (adminOnLots || (!isAdmin && !staffOnLots)) {
    return <div className="boot-screen">Đang tải…</div>;
  }

  const menu = isAdmin ? ADMIN_MENU : STAFF_MENU;

  return (
    <div className="pw-shell">
      <nav className="pw-side" aria-label="Menu dashboard">
        {menu.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'active' : undefined}
            >
              <Icon icon={item.icon} size="sm" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="pw-shell-main">{children}</div>
    </div>
  );
}
