import type { PublicWebPostRow } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { postCategoryLabel, postStatusLabel, postStatusTone } from '../display';

type Props = {
  items: PublicWebPostRow[];
  total: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function DashboardPostTable({ items, total, selectedId, onSelect }: Props) {
  return (
    <section className="pw-table-shell" aria-label="Bài viết gần đây">
      <h2 className="pw-panel-title">Bài viết gần đây</h2>
      <div className="pw-table-wrap pw-table-wrap--post">
        <div className="pw-table-head">
          <div className="pw-grid-row pw-grid-header" role="row">
            <div>Chuyên mục</div>
            <div>Tiêu đề</div>
            <div>Trạng thái</div>
          </div>
        </div>
        <div className="pw-table-scroll">
          {items.length === 0 ? (
            <p className="pw-empty">Không có bài viết.</p>
          ) : (
            items.map((row) => (
              <div
                key={row.id}
                role="row"
                className={
                  selectedId === row.id ? 'pw-grid-row is-selected' : 'pw-grid-row'
                }
                onClick={() => onSelect(row.id)}
              >
                <div>
                  <CrmBadge tone="blue">{postCategoryLabel(row)}</CrmBadge>
                </div>
                <div>
                  <p className="pw-title">{row.title}</p>
                </div>
                <div>
                  <CrmBadge tone={postStatusTone(row)}>{postStatusLabel(row)}</CrmBadge>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="pw-table-foot">
          Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> bài
        </div>
      </div>
    </section>
  );
}
