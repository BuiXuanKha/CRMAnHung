'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, LayoutDashboard, BarChart3 } from 'lucide-react';
import { UserRole } from '@crmanhung/shared';
import { useAuth } from '@/features/auth/auth-context';
import { Icon } from '@/shared/ui/icon';
import './dashboard-shell.css';

const ADMIN_MENU = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/bai-viet', label: 'Bài viết', icon: FileText, exact: false },
  { href: '/dashboard/thong-ke', label: 'Thống kê', icon: BarChart3, exact: false },
] as const;

/** Dashboard shell — ADMIN only. STAFF soạn bài lô ở `/dang-bai` (peer CRM route). */
export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === UserRole.STAFF) {
      router.replace('/dang-bai');
      return;
    }
    if (user.role !== UserRole.ADMIN) {
      router.replace('/khach-hang');
    }
  }, [loading, user, router]);

  if (loading || !user || !isAdmin) {
    return <div className="boot-screen">Đang tải…</div>;
  }

  return (
    <div className="pw-shell">
      <nav className="pw-side" aria-label="Menu dashboard">
        {ADMIN_MENU.map((item) => {
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
