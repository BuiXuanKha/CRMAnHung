'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import './layout.css';

const navItems = [
  { href: '/khach-hang', label: 'Khách hàng' },
  { href: '/lo-dat', label: 'Lô đất' },
  { href: '/giao-dich', label: 'Giao dịch' },
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
      <aside className="sidebar">
        <div className="sidebar-brand">
          <strong>An Hưng Land</strong>
          <span>CRM</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : undefined}
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
        <div className="sidebar-user">
          <div>
            <strong>{user.fullName}</strong>
            <span>{user.role}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              void logout().then(() => router.replace('/login'));
            }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
