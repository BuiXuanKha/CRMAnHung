'use client';

import { Star } from 'lucide-react';
import type { Ref } from 'react';
import type { TitleServiceListItem } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import {
  formatDaysWorking,
  formatMoneyVnd,
  isTitleServiceMuted,
  progressLine,
  statusLabel,
  statusTone,
} from '../display';
import { ActionMenu, type TitleServiceAction } from './action-menu';

type Props = {
  items: TitleServiceListItem[];
  total: number;
  loadingMore?: boolean;
  selectedId: string | null;
  menuId: string | null;
  onSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (item: TitleServiceListItem, action: TitleServiceAction) => void;
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: () => void;
};

export function TitleServiceCardList({
  items,
  total,
  loadingMore = false,
  selectedId,
  menuId,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onAction,
  scrollRef,
  onScroll,
}: Props) {
  return (
    <div className="sd-cards-shell">
      <div
        className="sd-cards"
        role="list"
        aria-label="Danh sách hồ sơ sổ đỏ"
        ref={scrollRef}
        onScroll={onScroll}
      >
        {items.length === 0 ? (
          <p className="sd-empty-cards">Không có hồ sơ sổ đỏ phù hợp.</p>
        ) : (
          items.map((item) => {
            const latest = progressLine(item.latestProgress);
            return (
              <article
                key={item.id}
                role="listitem"
                data-list-row-id={item.id}
                className={[
                  'sd-card',
                  selectedId === item.id ? 'is-selected' : '',
                  menuId === item.id ? 'is-menu-open' : '',
                  item.isPinned ? 'is-pinned' : '',
                  isTitleServiceMuted(item.status) ? 'is-muted' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(item.id);
                  }
                }}
                tabIndex={0}
              >
                <header className="sd-card-head">
                  <span className="sd-card-name">
                    {item.isPinned ? (
                      <span className="sd-card-pin" title="Đã ghim">
                        <Icon icon={Star} size={14} strokeWidth={2.4} />
                      </span>
                    ) : null}
                    <strong>{item.customerName}</strong>
                  </span>
                  <div className="sd-card-head-end">
                    <CrmBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</CrmBadge>
                    <div className="sd-card-actions" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        item={item}
                        open={menuId === item.id}
                        onToggle={() => onToggleMenu(item.id)}
                        onClose={onCloseMenu}
                        onAction={(a) => onAction(item, a)}
                      />
                    </div>
                  </div>
                </header>
                <p className="sd-card-meta">
                  <span>{item.code}</span>
                  <span>· {formatDaysWorking(item.daysWorking)}</span>
                  {item.primaryPhone ? <span>· {item.primaryPhone}</span> : null}
                </p>
                <p className="sd-card-need">
                  <em>Nhu cầu</em> {item.needSummary?.trim() || '—'}
                </p>
                <p className="sd-card-money">
                  <span>
                    Giá <span className="crm-money">{formatMoneyVnd(item.agreedFeeVnd)}</span>
                  </span>
                  <span className="sd-thu">Thu {formatMoneyVnd(item.totalThuVnd)}</span>
                  <span className="sd-chi">Chi {formatMoneyVnd(item.totalChiVnd)}</span>
                </p>
                <p className={latest.date ? 'sd-card-progress' : 'sd-card-progress is-empty'}>
                  {latest.date ? (
                    <>
                      <strong>{latest.title}</strong>
                      {latest.completed ? (
                        <CrmBadge tone="green">Đã hoàn thành</CrmBadge>
                      ) : latest.isWorkTask ? (
                        <CrmBadge tone="amber">Đang làm</CrmBadge>
                      ) : null}
                      <span> · {latest.date}</span>
                    </>
                  ) : (
                    latest.title
                  )}
                </p>
                <p className="sd-card-docs">
                  Tài liệu: {item.documentCount > 0 ? `${item.documentCount} file` : 'Chưa có'}
                </p>
              </article>
            );
          })
        )}
      </div>
      <div className="sd-cards-count">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> hồ sơ sổ đỏ
        {loadingMore ? ' — Đang tải thêm…' : ''}
      </div>
    </div>
  );
}
