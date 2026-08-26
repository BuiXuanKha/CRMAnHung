'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { CrmAlertDialog } from '@/shared/ui/dialog';
import '@/shared/ui/dialog.css';
import { Icon } from '@/shared/ui/icon';
import { getPublicWebDashboard } from './api';
import { DashboardStats } from './components/dashboard-stats';
import { DashboardLotTable } from './components/dashboard-lot-table';
import { DashboardPostTable } from './components/dashboard-post-table';
import { DashboardLotCards } from './components/dashboard-lot-cards';
import { DashboardPostCards } from './components/dashboard-post-cards';
import './public-web-dashboard.css';
import '@/shared/ui/money.css';

type AlertKind = 'lot-row' | 'post-row' | null;

export function PublicWebDashboard() {
  const [alert, setAlert] = useState<AlertKind>(null);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['public-web-dashboard'],
    queryFn: getPublicWebDashboard,
  });

  const data = query.data;
  const lotTotal = data ? data.publishedLotCount + data.pendingLotCount : 0;
  const postTotal = data ? data.publishedPostCount + data.draftPostCount : 0;

  return (
    <div className="pw-page">
      <header className="pw-head">
        <div>
          <h1>Dashboard</h1>
          <p>Khách trên anhungland.com chỉ thấy lô và bài đã đăng.</p>
        </div>
        <div className="pw-head-actions">
          <Link href="/" className="crm-btn" target="_blank" rel="noreferrer">
            <Icon icon={ExternalLink} size="sm" /> Xem trang khách
          </Link>
          <Link href="/dashboard/lo-dat" className="crm-btn primary">
            Lô đất public
          </Link>
          <Link href="/dashboard/bai-viet" className="crm-btn">
            Bài viết
          </Link>
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
        open={alert === 'lot-row'}
        title="Lô trên web"
        message="Sửa copy public, hiện giá hoặc Liên hệ, và gỡ web — làm ở slice sau."
        onClose={() => setAlert(null)}
      />
      <CrmAlertDialog
        open={alert === 'post-row'}
        title="Bài viết"
        message="Sửa bài, xuất bản hoặc gỡ về nháp — làm ở slice sau."
        onClose={() => setAlert(null)}
      />
    </div>
  );
}
