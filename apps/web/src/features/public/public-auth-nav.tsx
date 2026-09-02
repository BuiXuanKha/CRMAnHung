'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { crmHomePath } from '@/features/auth/home-path';

type Props = {
  className?: string;
  loginLabel?: string;
  crmLabel?: string;
};

/** Trang công khai — giữ phiên CRM: đã login thì «Vào CRM», chưa thì «Đăng nhập». */
export function PublicAuthNavLink({
  className = 'ph-nav-login',
  loginLabel = 'Đăng nhập',
  crmLabel = 'Vào CRM',
}: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <span className={className} aria-hidden>
        …
      </span>
    );
  }

  if (user) {
    return (
      <Link href={crmHomePath(user)} className={className}>
        {crmLabel}
      </Link>
    );
  }

  return (
    <Link href="/login" className={className}>
      {loginLabel}
    </Link>
  );
}
