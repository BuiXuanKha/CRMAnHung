import type { PublicWebPostRow } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { postCategoryLabel, postStatusLabel, postStatusTone } from '../display';

type Props = {
  items: PublicWebPostRow[];
  total: number;
  onSelect: (id: string) => void;
};

export function DashboardPostCards({ items, total, onSelect }: Props) {
  return (
    <section className="pw-cards" aria-label="Bài viết gần đây">
      <h2 className="pw-panel-title">Bài viết gần đây</h2>
      {items.length === 0 ? (
        <p className="pw-empty">Không có bài viết.</p>
      ) : (
        <ul className="pw-card-list">
          {items.map((row) => (
            <li key={row.id}>
              <button type="button" className="pw-card" onClick={() => onSelect(row.id)}>
                <span className="pw-card-body">
                  <span className="pw-card-top">
                    <CrmBadge tone="blue">{postCategoryLabel(row)}</CrmBadge>
                    <CrmBadge tone={postStatusTone(row)}>{postStatusLabel(row)}</CrmBadge>
                  </span>
                  <strong className="pw-title">{row.title}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="pw-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> bài
      </p>
    </section>
  );
}
