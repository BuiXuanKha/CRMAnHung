'use client';

import { useState, type Ref } from 'react';
import type { PublicWebPostRow } from '@crmanhung/shared';
import { ColumnFilter } from '@/shared/ui/column-filter';
import { CrmBadge } from '@/shared/ui/badge';
import '@/shared/ui/column-filter.css';
import {
  POST_CATEGORY_FILTER_OPTIONS,
  POST_STATUS_FILTER_OPTIONS,
  postCategoryLabel,
  postStatusLabel,
  postStatusTone,
} from '../display';

type HeaderFilter = 'category' | 'status' | null;

type Props = {
  items: PublicWebPostRow[];
  total: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  heading?: string | null;
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: () => void;
  /** Hub `/dashboard` không lọc cột (§12.1.4). List `/dashboard/bai-viet` bật. */
  enableFilters?: boolean;
  category?: string;
  status?: string;
  onCategory?: (v: string) => void;
  onStatus?: (v: string) => void;
  hasActiveFilters?: boolean;
};

export function DashboardPostTable({
  items,
  total,
  selectedId,
  onSelect,
  heading = 'Bài viết gần đây',
  scrollRef,
  onScroll,
  enableFilters = false,
  category = '',
  status = '',
  onCategory,
  onStatus,
  hasActiveFilters = false,
}: Props) {
  const [headerFilter, setHeaderFilter] = useState<HeaderFilter>(null);

  function toggleFilter(key: HeaderFilter) {
    setHeaderFilter((cur) => (cur === key ? null : key));
  }

  const emptyLabel =
    enableFilters && hasActiveFilters
      ? 'Không có bài viết phù hợp.'
      : 'Không có bài viết.';

  return (
    <section className="pw-table-shell" aria-label={heading ?? 'Bài viết'}>
      {heading ? <h2 className="pw-panel-title">{heading}</h2> : null}
      <div className="pw-table-wrap pw-table-wrap--post">
        <div className="pw-table-head">
          <div className="pw-grid-row pw-grid-header" role="row">
            {enableFilters ? (
              <div className="pw-col-head" role="columnheader">
                <span>Chuyên mục</span>
                <ColumnFilter
                  label="Chuyên mục"
                  value={category}
                  allValue=""
                  options={POST_CATEGORY_FILTER_OPTIONS}
                  open={headerFilter === 'category'}
                  onToggle={() => toggleFilter('category')}
                  onClose={() => setHeaderFilter(null)}
                  onChange={(v) => onCategory?.(v)}
                />
              </div>
            ) : (
              <div role="columnheader">Chuyên mục</div>
            )}
            <div role="columnheader">Tiêu đề</div>
            {enableFilters ? (
              <div className="pw-col-head" role="columnheader">
                <span>Trạng thái</span>
                <ColumnFilter
                  label="Trạng thái"
                  value={status}
                  allValue=""
                  options={POST_STATUS_FILTER_OPTIONS}
                  open={headerFilter === 'status'}
                  onToggle={() => toggleFilter('status')}
                  onClose={() => setHeaderFilter(null)}
                  onChange={(v) => onStatus?.(v)}
                />
              </div>
            ) : (
              <div role="columnheader">Trạng thái</div>
            )}
          </div>
        </div>
        <div className="pw-table-scroll" ref={scrollRef} onScroll={onScroll}>
          {items.length === 0 ? (
            <p className="pw-empty">{emptyLabel}</p>
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
