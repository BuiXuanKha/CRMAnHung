'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { CreditCard, FileText, Map, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { Icon } from './icon';
import { UserMenu } from './user-menu';
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

  const links = [
    ...navItems,
    ...(user.role === 'ADMIN'
      ? [{ href: '/quan-tri/khach-hang', label: 'Quản trị khách', icon: null }]
      : []),
  ];

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
          <div className="shell-top-end">
            <nav className="shell-header-nav" aria-label="Menu chính">
              {links.map((item, i) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <span key={item.href} className="shell-header-nav-item">
                    {i > 0 ? (
                      <span className="shell-nav-sep" aria-hidden>
                        |
                      </span>
                    ) : null}
                    <Link href={item.href} className={active ? 'active' : undefined}>
                      {item.icon ? <Icon icon={item.icon} size="sm" /> : null}
                      {item.label}
                    </Link>
                  </span>
                );
              })}
            </nav>
            <span className="shell-nav-sep" aria-hidden>
              |
            </span>
            <UserMenu
              fullName={user.fullName}
              roleLabel={user.role === 'ADMIN' ? 'Admin' : 'Nhân viên'}
              onLogout={() => {
                void logout().then(() => router.replace('/login'));
              }}
            />
          </div>
        </div>
      </header>

      <main className="content">{children}</main>
    </div>
  );
}
