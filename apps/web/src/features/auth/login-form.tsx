'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { ApiError } from '@/shared/api/client';
import { isMockMode } from '@/shared/api/mode';
import { ANHUNG_BRAND } from '@/features/public/brand';
import './login.css';

const MOCK_ACCOUNTS = [
  { username: 'staff', password: 'staff123', label: 'Nhân viên' },
  { username: 'admin', password: 'admin123', label: 'Admin' },
] as const;

export function LoginForm() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mock = isMockMode();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/khach-hang');
    }
  }, [loading, user, router]);

  if (!loading && user) {
    return (
      <div className="login-page">
        <p className="login-redirect">Đang vào CRM…</p>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      router.replace('/khach-hang');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const fillMock = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
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

          {mock ? (
            <div className="login-mock">
              <p className="login-mock-title">Demo (mock — chưa nối API)</p>
              <div className="login-mock-actions">
                {MOCK_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    className="login-mock-btn"
                    onClick={() => fillMock(acc.username, acc.password)}
                  >
                    {acc.label}: <code>{acc.username}</code> / <code>{acc.password}</code>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label>
            Tên đăng nhập
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder={mock ? 'staff hoặc admin' : undefined}
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
              placeholder={mock ? 'staff123 hoặc admin123' : undefined}
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
