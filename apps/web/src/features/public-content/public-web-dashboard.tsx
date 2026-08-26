'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Globe } from 'lucide-react';
import { UserRole } from '@crmanhung/shared';
import { useAuth } from '@/features/auth/auth-context';
import { CrmAlertDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { getPublicWebDashboard } from './api';
import { DashboardStats } from './components/dashboard-stats';
import { DashboardLotTable } from './components/dashboard-lot-table';
import { DashboardPostTable } from './components/dashboard-post-table';
import { DashboardLotCards } from './components/dashboard-lot-cards';
import { DashboardPostCards } from './components/dashboard-post-cards';
import './public-web-dashboard.css';
import '@/shared/ui/money.css';

type AlertKind = 'lot-list' | 'post-list' | 'lot-row' | 'post-row' | null;

const ALERTS: Record<Exclude<AlertKind, null>, { title: string; message: string }> = {
  'lot-list': {
    title: 'Đăng lô lên web',
    message: 'Danh sách chọn lô và công tắc Đăng web làm ở slice sau.',
  },
  'post-list': {
    title: 'Soạn bài',
    message: 'Màn soạn tin tức / bài đăng làm ở slice sau.',
  },
  'lot-row': {
    title: 'Lô trên web',
    message: 'Sửa copy public, hiện giá hoặc Liên hệ, và gỡ web — làm ở slice sau.',
  },
  'post-row': {
    title: 'Bài viết',
    message: 'Sửa bài, xuất bản hoặc gỡ về nháp — làm ở slice sau.',
  },
};

export function PublicWebDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alert, setAlert] = useState<AlertKind>(null);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== UserRole.ADMIN) {
      router.replace('/khach-hang');
    }
  }, [authLoading, user, router]);

  const query = useQuery({
    queryKey: ['public-web-dashboard'],
    queryFn: getPublicWebDashboard,
    enabled: Boolean(user && user.role === UserRole.ADMIN),
  });

  if (authLoading || !user || user.role !== UserRole.ADMIN) {
    return <div className="boot-screen">Đang tải…</div>;
  }

  const data = query.data;
  const lotTotal = data ? data.publishedLotCount + data.pendingLotCount : 0;
  const postTotal = data ? data.publishedPostCount + data.draftPostCount : 0;
  const alertCopy = alert ? ALERTS[alert] : null;

  return (
    <div className="pw-page">
      <header className="pw-head">
        <div>
          <h1>
            <Icon icon={Globe} size="sm" /> Dashboard
          </h1>
          <p>Khách trên anhungland.com chỉ thấy lô và bài đã đăng.</p>
        </div>
        <div className="pw-head-actions">
          <Link href="/" className="crm-btn" target="_blank" rel="noreferrer">
            <Icon icon={ExternalLink} size="sm" /> Xem trang khách
          </Link>
          <button type="button" className="crm-btn primary" onClick={() => setAlert('lot-list')}>
            Đăng lô
          </button>
          <button type="button" className="crm-btn" onClick={() => setAlert('post-list')}>
            Soạn bài
          </button>
        </div>
      </header>

      {query.isLoading || !data ? (
        <p className="pw-loading">Đang tải…</p>
      ) : (
        <>
          <DashboardStats
            publishedLotCount={data.publishedLotCount}
            pendingLotCount={data.pendingLotCount}
            publishedPostCount={data.publishedPostCount}
            draftPostCount={data.draftPostCount}
          />

          <div className="pw-panels pw-panels-desktop">
            <DashboardLotTable
              items={data.recentLots}
              total={lotTotal}
              selectedId={selectedLotId}
              onSelect={(id) => {
                setSelectedLotId(id);
                setAlert('lot-row');
              }}
            />
            <DashboardPostTable
              items={data.recentPosts}
              total={postTotal}
              selectedId={selectedPostId}
              onSelect={(id) => {
                setSelectedPostId(id);
                setAlert('post-row');
              }}
            />
          </div>

          <div className="pw-panels pw-panels-mobile">
            <DashboardLotCards
              items={data.recentLots}
              total={lotTotal}
              onSelect={(id) => {
                setSelectedLotId(id);
                setAlert('lot-row');
              }}
            />
            <DashboardPostCards
              items={data.recentPosts}
              total={postTotal}
              onSelect={(id) => {
                setSelectedPostId(id);
                setAlert('post-row');
              }}
            />
          </div>
        </>
      )}

      <CrmAlertDialog
        open={Boolean(alertCopy)}
        title={alertCopy?.title ?? ''}
        message={alertCopy?.message ?? ''}
        onClose={() => setAlert(null)}
      />
    </div>
  );
}
