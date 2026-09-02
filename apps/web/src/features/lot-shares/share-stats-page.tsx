'use client';

import { useQuery } from '@tanstack/react-query';
import { mergeShareStatsDisplayRows } from '@crmanhung/shared';
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
  const rows = data
    ? mergeShareStatsDisplayRows(data.items, data.directViewCount)
    : [];

  return (
    <div className="pw-page">
      <header className="pw-head">
        <div>
          <h1>Thống kê</h1>
          <p>
            Số lô đã tạo link share và lượt khách xem trang. Cookie NV cộng cho nhân viên; không
            cookie = Truy cập trực tiếp. F5 cũng cộng 1.
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
            <ShareStatsTable rows={rows} />
          </div>
          <div className="pw-list-mobile">
            <ShareStatsCards rows={rows} />
          </div>
        </>
      )}
    </div>
  );
}
