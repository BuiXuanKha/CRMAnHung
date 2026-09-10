type Props = {
  publishedPostCount: number;
  draftPostCount: number;
};

/** Admin Tổng quan — chỉ số bài CMS (lô đăng web thuộc `/lo-dat` của NV). */
export function DashboardStats({ publishedPostCount, draftPostCount }: Props) {
  return (
    <section className="pw-stats" aria-label="Tổng quan bài viết">
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
