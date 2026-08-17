'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import './layout.css';

const navItems = [
  { href: '/khach-hang', label: 'Quản lý khách hàng', icon: 'users' },
  { href: '/lo-dat', label: 'Quản lý lô đất', icon: 'map' },
  { href: '/giao-dich', label: 'Quản lý giao dịch', icon: 'deal' },
  { href: '/dich-vu-so-do', label: 'Dịch vụ sổ đỏ', icon: 'doc' },
] as const;

function NavIcon({ name }: { name: (typeof navItems)[number]['icon'] }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true,
  } as const;
  if (name === 'users') {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === 'map') {
    return (
      <svg {...common}>
        <polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21" />
        <line x1="8" y1="3" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="21" />
      </svg>
    );
  }
  if (name === 'deal') {
    return (
      <svg {...common}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 15h6" />
    </svg>
  );
}

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
            <span className="shell-logo-mark" aria-hidden>
              AH
            </span>
            <strong>An Hưng Land CRM</strong>
          </Link>
          <div className="shell-user">
            <span>
              {user.fullName} | {user.role === 'ADMIN' ? 'Admin' : 'Nhân viên'}
            </span>
            <button type="button" className="shell-settings" aria-label="Cài đặt" title="Cài đặt">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
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
        <nav className="shell-nav" aria-label="Thanh điều hướng">
          <span className="shell-nav-label">Thanh điều hướng</span>
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
              <NavIcon name={item.icon} />
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
