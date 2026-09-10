'use client';

import type { Ref } from 'react';
import { Map, Phone, SquarePen } from 'lucide-react';
import type { CustomerListItem } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import {
  channelLabel,
  demandLabel,
  formatBudget,
  initials,
  statusLabel,
  statusTone,
} from '../display';
import { ActionMenu, type CustomerAction } from './action-menu';

type Props = {
  items: CustomerListItem[];
  selectedId: string | null;
  menuId: string | null;
  onSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (customer: CustomerListItem, action: CustomerAction) => void;
  onAddPhone?: (customer: CustomerListItem) => void;
  onCallPhone?: (customer: CustomerListItem) => void;
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: () => void;
};

export function CustomerCardList({
  items,
  selectedId,
  menuId,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onAction,
  onAddPhone,
  onCallPhone,
  scrollRef,
  onScroll,
}: Props) {
  return (
    <div className="kh-cards-shell">
      <div
        className="kh-cards"
        role="list"
        aria-label="Danh sách khách hàng"
        ref={scrollRef}
        onScroll={onScroll}
      >
        {items.length === 0 ? (
          <p className="kh-empty">Không có khách hàng phù hợp.</p>
        ) : (
          items.map((c) => {
            const demand = demandLabel(c);
            const budget = formatBudget(c.budgetMinVnd, c.budgetMaxVnd);
            return (
              <article
                key={c.id}
                role="listitem"
                data-list-row-id={c.id}
                className={[
                  'kh-card',
                  selectedId === c.id ? 'is-selected' : '',
                  c.isPinned ? 'is-pinned' : '',
                  c.isHidden ? 'is-hidden' : '',
                  menuId === c.id ? 'is-menu-open' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect(c.id)}
              >
                <span className="kh-card-avatar" aria-hidden>
                  {c.facebook?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.facebook.avatarUrl} alt="" />
                  ) : (
                    initials(c.fullName)
                  )}
                </span>
                <div className="kh-card-main">
                  <div className="kh-card-name">
                    <strong>{c.fullName}</strong>
                    {c.primaryPhone ? (
                      <button
                        type="button"
                        className="kh-card-call"
                        title={c.primaryPhone}
                        aria-label={`Gọi ${c.fullName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCallPhone?.(c);
                        }}
                      >
                        <Icon icon={Phone} size={12} />
                      </button>
                    ) : !c.isHidden ? (
                      <button
                        type="button"
                        className="kh-card-call kh-card-call-add"
                        title="Thêm số điện thoại"
                        aria-label={`Thêm số điện thoại cho ${c.fullName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddPhone?.(c);
                        }}
                      >
                        <Icon icon={Phone} size={12} />
                      </button>
                    ) : null}
                    {c.lodatCount > 0 ? (
                      <span className="kh-card-lodat" title={`${c.lodatCount} lô đất`}>
                        <Icon icon={Map} size={12} />
                        {c.lodatCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="kh-card-meta">
                    <span className="kh-card-channel">{channelLabel(c)}</span>
                    <span className="kh-hangtags">
                      <CrmBadge tone={statusTone(c.status)}>{statusLabel(c.status)}</CrmBadge>
                      {c.isHidden ? (
                        <CrmBadge tone="red">Đã xoá</CrmBadge>
                      ) : null}
                      {!c.isHidden && c.autoRestoredAt ? (
                        <CrmBadge tone="amber">Tự khôi phục</CrmBadge>
                      ) : null}
                    </span>
                  </div>
                  {budget !== '—' ? (
                    <span className="kh-card-budget crm-money">{budget}</span>
                  ) : null}
                  {demand !== '—' ? <span className="kh-card-need">{demand}</span> : null}
                </div>
                <div className="kh-card-actions" onClick={(e) => e.stopPropagation()}>
                  {!c.isHidden ? (
                    <button
                      type="button"
                      className="kh-card-edit"
                      title="Cập nhật chăm sóc"
                      aria-label={`Cập nhật chăm sóc ${c.fullName}`}
                      onClick={() => onAction(c, 'care')}
                    >
                      <Icon icon={SquarePen} size={16} />
                    </button>
                  ) : null}
                  <ActionMenu
                    customer={c}
                    open={menuId === c.id}
                    onToggle={() => onToggleMenu(c.id)}
                    onClose={onCloseMenu}
                    onAction={(a) => onAction(c, a)}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
