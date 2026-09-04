import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = {
  title: 'Đăng nhập CRM',
  description: 'Đăng nhập hệ thống CRM nội bộ An Hưng Land.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-page">Đang tải…</div>}>
      <LoginForm />
    </Suspense>
  );
}
