'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRole } from '@crmanhung/shared';
import { useAuth } from './auth-context';
import { crmHomePath } from './home-path';
import { ApiError } from '@/shared/api/client';
import { ANHUNG_BRAND } from '@/features/public/brand';
import './login.css';

export function LoginForm() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(crmHomePath(user));
    }
  }, [loading, user, router]);

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
      router.replace(crmHomePath(logged));
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
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}

          <button type="submit" disabled={submitting || loading}>
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
