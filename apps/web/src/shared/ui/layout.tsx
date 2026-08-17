'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import {
  CreditCard,
  FileText,
  Map,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { Icon } from './icon';
import './layout.css';

const navItems = [
  { href: '/khach-hang', label: 'Quản lý khách hàng', icon: Users },
  { href: '/lo-dat', label: 'Quản lý lô đất', icon: Map },
  { href: '/giao-dich', label: 'Quản lý giao dịch', icon: CreditCard },
  { href: '/dich-vu-so-do', label: 'Dịch vụ sổ đỏ', icon: FileText },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="boot-screen">Đang tải…</div>;
  }

  return (
    <div className="shell">
      {/* §1 Header */}
      <header className="shell-top">
        <div className="shell-top-inner">
          <Link href="/khach-hang" className="shell-brand">
            <span className="shell-logo-mark" aria-hidden>
              AH
            </span>
            <strong>An Hưng Land CRM</strong>
          </Link>
          <div className="shell-user">
            <span className="shell-user-meta">
              {user.fullName}
              <span className="shell-user-role">
                {' '}
                | {user.role === 'ADMIN' ? 'Admin' : 'Nhân viên'}
              </span>
            </span>
            <button type="button" className="shell-settings" aria-label="Cài đặt" title="Cài đặt">
              <Icon icon={Settings} size="md" />
            </button>
            <button
              type="button"
              className="shell-logout"
              onClick={() => {
                void logout().then(() => router.replace('/login'));
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* §2 Thanh điều hướng — menu căn phải */}
        <nav className="shell-nav" aria-label="Thanh điều hướng">
          <span className="shell-nav-label">Thanh điều hướng</span>
          <div className="shell-nav-items">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? 'active'
                    : undefined
                }
              >
                <Icon icon={item.icon} size="sm" />
                {item.label}
              </Link>
            ))}
            {user.role === 'ADMIN' ? (
              <Link
                href="/quan-tri/khach-hang"
                className={pathname === '/quan-tri/khach-hang' ? 'active' : undefined}
              >
                Quản trị khách
              </Link>
            ) : null}
          </div>
        </nav>
      </header>

      {/* §3 Nội dung trang */}
      <main className="content">{children}</main>
    </div>
  );
}
