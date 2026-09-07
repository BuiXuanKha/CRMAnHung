import { PUBLIC_LISTING_PATH } from '@crmanhung/shared';

type Props = {
  publishedLotCount: number;
  pendingLotCount: number;
  publishedPostCount: number;
  draftPostCount: number;
};

export function DashboardStats({
  publishedLotCount,
  pendingLotCount,
  publishedPostCount,
  draftPostCount,
}: Props) {
  return (
    <section className="pw-stats" aria-label="Tổng quan web công khai">
      <article className="pw-stat">
        <p className="pw-stat-label">Đã soạn</p>
        <p className="pw-stat-value">{publishedLotCount}</p>
        <p className="pw-stat-hint">Có mô tả trên {PUBLIC_LISTING_PATH}</p>
      </article>
      <article className="pw-stat">
        <p className="pw-stat-label">Chưa soạn</p>
        <p className="pw-stat-value">{pendingLotCount}</p>
        <p className="pw-stat-hint">Đã có slug — cần bổ sung copy</p>
      </article>
      <article className="pw-stat">
        <p className="pw-stat-label">Bài đã đăng</p>
        <p className="pw-stat-value">{publishedPostCount}</p>
        <p className="pw-stat-hint">Khách đọc được</p>
      </article>
      <article className="pw-stat">
        <p className="pw-stat-label">Bài nháp</p>
        <p className="pw-stat-value">{draftPostCount}</p>
        <p className="pw-stat-hint">Chỉ admin</p>
      </article>
    </section>
  );
}
