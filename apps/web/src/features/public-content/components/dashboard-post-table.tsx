import type { Ref } from 'react';
import type { PublicWebPostRow } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { postCategoryLabel, postStatusLabel, postStatusTone } from '../display';

type Props = {
  items: PublicWebPostRow[];
  total: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  heading?: string | null;
  scrollRef?: Ref<HTMLDivElement>;
};

export function DashboardPostTable({
  items,
  total,
  selectedId,
  onSelect,
  heading = 'Bài viết gần đây',
  scrollRef,
}: Props) {
  return (
    <section className="pw-table-shell" aria-label={heading ?? 'Bài viết'}>
      {heading ? <h2 className="pw-panel-title">{heading}</h2> : null}
      <div className="pw-table-wrap pw-table-wrap--post">
        <div className="pw-table-head">
          <div className="pw-grid-row pw-grid-header" role="row">
            <div>Chuyên mục</div>
            <div>Tiêu đề</div>
            <div>Trạng thái</div>
          </div>
        </div>
        <div className="pw-table-scroll" ref={scrollRef}>
          {items.length === 0 ? (
            <p className="pw-empty">Không có bài viết.</p>
          ) : (
            items.map((row) => (
              <div
                key={row.id}
                role="row"
                data-list-row-id={row.id}
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
