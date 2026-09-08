'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserRole,
  crmHomePathForRole,
  isAdminOnlyCrmPath,
  isCrmAppPath,
  normalizeWebCrmRole,
  staffDashboardFallbackPath,
} from '@crmanhung/shared';
import { useAuth } from './auth-context';
import { ApiError } from '@/shared/api/client';
import { ANHUNG_BRAND } from '@/features/public/brand';
import './login.css';

const PASSWORD_CHANGED_FLASH_KEY = 'crmanhung_flash_password_changed';

function safeCrmNext(next: string | null, role: string): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  let path = next.split('?')[0] ?? next;
  // BUG-082: typo alias must not survive as post-login destination.
  if (path === '/dashbroad') path = '/dashboard';
  if (!isCrmAppPath(path)) return null;
  const webRole = normalizeWebCrmRole(role);
  if (!webRole) return null;
  // `/dang-bai` = CRM page like `/khach-hang` (STAFF menu); no Admin rewrite.
  if (webRole === 'STAFF' && isAdminOnlyCrmPath(path)) {
    return path.startsWith('/dashboard')
      ? staffDashboardFallbackPath()
      : crmHomePathForRole('STAFF');
  }
  return path;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const goAfterAuth = (role: string) => {
    const next = safeCrmNext(searchParams.get('next'), role);
    router.replace(next ?? crmHomePathForRole(normalizeWebCrmRole(role) ?? 'STAFF'));
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem(PASSWORD_CHANGED_FLASH_KEY) === '1') {
        sessionStorage.removeItem(PASSWORD_CHANGED_FLASH_KEY);
        setInfo('Đã đổi mật khẩu. Đăng nhập lại bằng mật khẩu mới.');
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      goAfterAuth(user.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when auth settles
  }, [loading, user]);

  if (!loading && user) {
    return (
      <div className="login-page">
        <p className="login-redirect">
          {user.role === UserRole.ADMIN ? 'Đang vào Dashboard…' : 'Đang vào CRM…'}
        </p>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const logged = await login(username, password);
      goAfterAuth(logged.role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-backdrop" aria-hidden />
      <div className="login-shell">
        <Link href="/" className="login-back">
          ← Về trang khách
        </Link>

        <form className="login-card" onSubmit={(e) => void onSubmit(e)}>
          <Link href="/" className="login-logo" aria-label={ANHUNG_BRAND.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ANHUNG_BRAND.logoOnLightSrc}
              alt={ANHUNG_BRAND.name}
              width={200}
              height={45}
            />
          </Link>

          <h1>Đăng nhập CRM</h1>
          <p className="login-sub">Dành cho nhân viên An Hưng Land — quản lý khách hàng và lô đất.</p>

          <label>
            Tên đăng nhập
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              maxLength={18}
            />
          </label>

          {info ? <p className="login-info">{info}</p> : null}
          {error ? <p className="login-error">{error}</p> : null}

          <button type="submit" disabled={submitting || loading}>
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
