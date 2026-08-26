'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CreditCard, FileText, Globe, Map, Menu, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { crmHomePath } from '@/features/auth/home-path';
import { Icon } from './icon';
import { UserMenu } from './user-menu';
import { SettingsHubDialog } from '@/features/settings/settings-hub-dialog';
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!mobileNavRef.current?.contains(e.target as Node)) setMobileNavOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [mobileNavOpen]);

  if (loading || !user) {
    return <div className="boot-screen">Đang tải…</div>;
  }

  const links = [
    ...navItems,
    ...(user.role === 'ADMIN'
      ? [
          { href: '/dashboard', label: 'Dashboard', icon: Globe },
          { href: '/quan-tri/khach-hang', label: 'Quản trị khách', icon: null },
        ]
      : []),
  ];

  return (
    <div className="shell">
      <header className="shell-top">
        <div className="shell-top-inner">
          <div className="shell-left">
            <button
              type="button"
              className="shell-mobile-menu-btn"
              aria-label="Mở menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <Icon icon={Menu} size="sm" />
            </button>
            <Link href={crmHomePath(user)} className="shell-brand">
              <span className="shell-logo-mark" aria-hidden>
                AH
              </span>
              <strong className="shell-brand-desktop">An Hưng Land CRM</strong>
              <strong className="shell-brand-mobile">AH CRM</strong>
            </Link>
          </div>
          <div className="shell-top-end">
            <nav className="shell-header-nav" aria-label="Menu chính">
              {links.map((item, i) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <span key={item.href} className="shell-header-nav-item">
                    {i > 0 ? <span className="shell-nav-sep" aria-hidden /> : null}
                    <Link href={item.href} className={active ? 'active' : undefined}>
                      {item.icon ? <Icon icon={item.icon} size="sm" /> : null}
                      {item.label}
                    </Link>
                  </span>
                );
              })}
            </nav>
            <span className="shell-nav-sep" aria-hidden />
            <div className="shell-user-end">
              <span className="shell-mobile-user">{user.fullName}</span>
              <UserMenu
                fullName={user.fullName}
                roleLabel={user.role === 'ADMIN' ? 'Admin' : 'Nhân viên'}
                onOpenSettings={() => setSettingsOpen(true)}
                onLogout={() => {
                  void logout().then(() => router.replace('/login'));
                }}
              />
            </div>
          </div>
        </div>

        {mobileNavOpen ? (
          <div className="shell-mobile-nav" ref={mobileNavRef} role="menu" aria-label="Menu">
            {links.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={active ? 'active' : undefined}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {item.icon ? <Icon icon={item.icon} size="sm" /> : null}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </header>

      <main className="content">{children}</main>
      <SettingsHubDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
