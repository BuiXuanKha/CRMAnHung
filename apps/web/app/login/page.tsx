import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = {
  title: 'Đăng nhập CRM',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
