'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import './layout.css';

const navItems = [
  { href: '/khach-hang', label: 'Quản lý khách hàng' },
  { href: '/lo-dat', label: 'Quản lý lô đất' },
  { href: '/giao-dich', label: 'Quản lý giao dịch' },
  { href: '/dich-vu-so-do', label: 'Dịch vụ sổ đỏ' },
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
      <header className="shell-top">
        <div className="shell-top-inner">
          <Link href="/khach-hang" className="shell-brand">
            <strong>An Hưng Land CRM</strong>
          </Link>
          <div className="shell-user">
            <span>
              {user.fullName} | {user.role === 'ADMIN' ? 'Admin' : 'Nhân viên'}
            </span>
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
        <nav className="shell-nav" aria-label="Thanh điều hướng">
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
        </nav>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
