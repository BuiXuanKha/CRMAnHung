'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { peekSessionUser, useAuth } from '@/features/auth/auth-context';
import { getAccessToken } from '@/shared/api/client';
import { recordPublicPageView } from '@/features/lot-shares/api';

/** Mỗi lần tải hoặc đổi trang public → +1 (cookie NV hoặc Truy cập trực tiếp). NV đã login CRM thì bỏ. */
export function ShareAttributedViewTracker({ shareCode }: { shareCode?: string }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user || peekSessionUser() || getAccessToken()) return;
    void recordPublicPageView(shareCode);
  }, [shareCode, pathname, user, loading]);

  return null;
}
