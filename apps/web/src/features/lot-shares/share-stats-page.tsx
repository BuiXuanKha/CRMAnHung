'use client';

import { useQuery } from '@tanstack/react-query';
import { listShareEmployeeStats } from './api';
import { ShareStatsCards } from './share-stats-cards';
import { ShareStatsTable } from './share-stats-table';
import '@/features/public-content/public-web-dashboard.css';

const STATS_KEY = ['lot-share-employee-stats'] as const;

export function ShareStatsPage() {
  const query = useQuery({
    queryKey: STATS_KEY,
    queryFn: listShareEmployeeStats,
  });
  const data = query.data;

  return (
    <div className="pw-page">
      <header className="pw-head">
        <div>
          <h1>Thống kê</h1>
          <p>
            Số lô đã tạo link share và lượt khách xem trang (trang chủ, lô, bài…) khi còn cookie
            NV. F5 cũng cộng 1.
          </p>
        </div>
      </header>

      {query.isError ? (
        <p className="pw-loading">
          {query.error instanceof Error ? query.error.message : 'Không tải được thống kê.'}
        </p>
      ) : query.isLoading || !data ? (
        <p className="pw-loading">Đang tải…</p>
      ) : (
        <>
          <div className="pw-list-desktop">
            <ShareStatsTable items={data.items} total={data.total} />
          </div>
          <div className="pw-list-mobile">
            <ShareStatsCards items={data.items} total={data.total} />
          </div>
        </>
      )}
    </div>
  );
}
