'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { peekSessionUser, useAuth } from '@/features/auth/auth-context';
import { getAccessToken } from '@/shared/api/client';
import { recordSharePageView } from '@/features/lot-shares/api';

/** Cookie share: mỗi lần tải hoặc đổi trang public → +1 cho NV. NV đã login CRM thì bỏ. */
export function ShareAttributedViewTracker({ shareCode }: { shareCode: string }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user || peekSessionUser() || getAccessToken()) return;
    const code = shareCode.trim();
    if (!code) return;
    void recordSharePageView(code);
  }, [shareCode, pathname, user, loading]);

  return null;
}
