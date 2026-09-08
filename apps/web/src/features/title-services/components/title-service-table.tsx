'use client';

import { Star } from 'lucide-react';
import { useState, type Ref } from 'react';
import type { TitleServiceListItem } from '@crmanhung/shared';
import { ColumnFilter } from '@/shared/ui/column-filter';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import {
  DOCS_FILTER_OPTIONS,
  MONEY_FILTER_OPTIONS,
  NEED_FILTER_OPTIONS,
  PROGRESS_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  formatDaysWorking,
  formatMoneyVnd,
  progressLine,
  statusLabel,
  statusTone,
  type ExtraFilters,
} from '../display';
import { ActionMenu, type TitleServiceAction } from './action-menu';

type HeaderFilter = 'name' | 'need' | 'progress' | 'money' | 'docs' | null;

type Props = {
  items: TitleServiceListItem[];
  total: number;
  loadingMore?: boolean;
  selectedId: string | null;
  menuId: string | null;
  status: string;
  extra: ExtraFilters;
  onStatus: (v: string) => void;
  onExtra: (next: ExtraFilters) => void;
  onSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (item: TitleServiceListItem, action: TitleServiceAction) => void;
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: () => void;
};

export function TitleServiceTable({
  items,
  total,
  loadingMore = false,
  selectedId,
  menuId,
  status,
  extra,
  onStatus,
  onExtra,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onAction,
  scrollRef,
  onScroll,
}: Props) {
  const [headerFilter, setHeaderFilter] = useState<HeaderFilter>(null);

  function toggleFilter(key: HeaderFilter) {
    setHeaderFilter((cur) => (cur === key ? null : key));
    onCloseMenu();
  }

  return (
    <div className="sd-table-wrap" role="table" aria-label="Danh sách hồ sơ sổ đỏ">
      <div className="sd-table-head" role="rowgroup">
        <div className="sd-grid-row sd-grid-header" role="row">
          <div className="col-idx" role="columnheader">
            #
          </div>
          <div className="sd-col-head" role="columnheader">
            <span>Tên khách</span>
            <ColumnFilter
              label="Tên khách"
              value={status}
              allValue=""
              options={STATUS_FILTER_OPTIONS}
              open={headerFilter === 'name'}
              onToggle={() => toggleFilter('name')}
              onClose={() => setHeaderFilter(null)}
              onChange={onStatus}
            />
          </div>
          <div className="sd-col-head" role="columnheader">
            <span>Nhu cầu</span>
            <ColumnFilter
              label="Nhu cầu"
              value={extra.need}
              options={NEED_FILTER_OPTIONS}
              open={headerFilter === 'need'}
              onToggle={() => toggleFilter('need')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, need: v as ExtraFilters['need'] })}
            />
          </div>
          <div className="sd-col-head" role="columnheader">
            <span>Lịch sử đang làm</span>
            <ColumnFilter
              label="Lịch sử đang làm"
              value={extra.progress}
              options={PROGRESS_FILTER_OPTIONS}
              open={headerFilter === 'progress'}
              onToggle={() => toggleFilter('progress')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, progress: v as ExtraFilters['progress'] })}
            />
          </div>
          <div className="sd-col-head" role="columnheader">
            <span>Giá / Thu / Chi</span>
            <ColumnFilter
              label="Giá / Thu / Chi"
              value={extra.money}
              options={MONEY_FILTER_OPTIONS}
              open={headerFilter === 'money'}
              onToggle={() => toggleFilter('money')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, money: v as ExtraFilters['money'] })}
            />
          </div>
          <div className="sd-col-head" role="columnheader">
            <span>Tài liệu</span>
            <ColumnFilter
              label="Tài liệu"
              value={extra.docs}
              options={DOCS_FILTER_OPTIONS}
              open={headerFilter === 'docs'}
              onToggle={() => toggleFilter('docs')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, docs: v as ExtraFilters['docs'] })}
            />
          </div>
          <div role="columnheader">Số ngày</div>
          <div className="col-act" role="columnheader">
            Thao tác
          </div>
        </div>
      </div>

      <div
        className="sd-table-scroll"
        role="rowgroup"
        ref={scrollRef}
        onScroll={onScroll}
      >
        {items.length === 0 ? (
          <div className="sd-empty-row" role="row">
            Không có hồ sơ sổ đỏ phù hợp.
          </div>
        ) : (
          items.map((item, index) => {
            const latest = progressLine(item.latestProgress);
            return (
              <div
                key={item.id}
                role="row"
                data-list-row-id={item.id}
                className={[
                  'sd-grid-row',
                  selectedId === item.id ? 'is-selected' : '',
                  menuId === item.id ? 'is-menu-open' : '',
                  item.isPinned ? 'is-hot' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect(item.id)}
              >
                <div className="sd-cell col-idx" role="cell">
                  {item.isPinned ? (
                    <span className="sd-pin" title="Đã ghim">
                      <Icon icon={Star} size={14} strokeWidth={2.4} />
                    </span>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="sd-cell" role="cell">
                  <div className="sd-stack">
                    <span className="sd-name-row">
                      <strong>{item.customerName}</strong>
                      <CrmBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</CrmBadge>
                    </span>
                    <span className="sd-sub">
                      {item.code}
                      {item.primaryPhone ? ` · ${item.primaryPhone}` : ''}
                    </span>
                  </div>
                </div>
                <div className="sd-cell" role="cell">
                  {item.needSummary?.trim() ? (
                    <span className="sd-need" title={item.needSummary}>
                      {item.needSummary}
                    </span>
                  ) : (
                    <span className="sd-empty">—</span>
                  )}
                </div>
                <div className="sd-cell" role="cell">
                  <div className="sd-stack">
                    {latest.date ? (
                      <span className="sd-progress-line">
                        <strong>{latest.title}</strong>
                        {latest.completed ? (
                          <CrmBadge tone="green">Đã hoàn thành</CrmBadge>
                        ) : null}
                      </span>
                    ) : (
                      <span className="sd-empty">{latest.title}</span>
                    )}
                    {latest.date ? <span className="sd-sub">{latest.date}</span> : null}
                  </div>
                </div>
                <div className="sd-cell" role="cell">
                  <div className="sd-money">
                    <span>
                      <em>Giá</em>{' '}
                      <span className="crm-money">{formatMoneyVnd(item.agreedFeeVnd)}</span>
                    </span>
                    <span className="sd-thu">
                      <em>Thu</em> {formatMoneyVnd(item.totalThuVnd)}
                    </span>
                    <span className="sd-chi">
                      <em>Chi</em> {formatMoneyVnd(item.totalChiVnd)}
                    </span>
                  </div>
                </div>
                <div className="sd-cell" role="cell">
                  {item.documentCount > 0 ? (
                    <span>{item.documentCount} file</span>
                  ) : (
                    <span className="sd-empty">Chưa có</span>
                  )}
                </div>
                <div className="sd-cell" role="cell">
                  <CrmBadge tone="green">{formatDaysWorking(item.daysWorking)}</CrmBadge>
                </div>
                <div
                  className="col-act sd-cell"
                  role="cell"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionMenu
                    item={item}
                    open={menuId === item.id}
                    onToggle={() => {
                      setHeaderFilter(null);
                      onToggleMenu(item.id);
                    }}
                    onClose={onCloseMenu}
                    onAction={(a) => onAction(item, a)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="sd-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> hồ sơ sổ đỏ
        {loadingMore ? ' — Đang tải thêm…' : ''}
      </div>
    </div>
  );
}
