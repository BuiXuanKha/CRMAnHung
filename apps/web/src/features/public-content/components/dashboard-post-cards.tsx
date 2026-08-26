import type { Ref } from 'react';
import type { PublicWebPostRow } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { postCategoryLabel, postStatusLabel, postStatusTone } from '../display';

type Props = {
  items: PublicWebPostRow[];
  total: number;
  onSelect: (id: string) => void;
  selectedId?: string | null;
  heading?: string | null;
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: () => void;
  hasActiveFilters?: boolean;
};

export function DashboardPostCards({
  items,
  total,
  onSelect,
  selectedId = null,
  heading = 'Bài viết gần đây',
  scrollRef,
  onScroll,
  hasActiveFilters = false,
}: Props) {
  const emptyLabel = hasActiveFilters
    ? 'Không có bài viết phù hợp.'
    : 'Không có bài viết.';

  return (
    <section className="pw-cards" aria-label={heading ?? 'Bài viết'}>
      {heading ? <h2 className="pw-panel-title">{heading}</h2> : null}
      {items.length === 0 ? (
        <p className="pw-empty">{emptyLabel}</p>
      ) : (
        <div className="pw-card-scroll" ref={scrollRef} onScroll={onScroll}>
          <ul className="pw-card-list">
            {items.map((row) => (
              <li key={row.id} data-list-row-id={row.id}>
                <button
                  type="button"
                  className={selectedId === row.id ? 'pw-card is-selected' : 'pw-card'}
                  onClick={() => onSelect(row.id)}
                >
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
        </div>
      )}
      <p className="pw-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> bài
      </p>
    </section>
  );
}
