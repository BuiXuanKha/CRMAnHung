'use client';

import { Map, MessageCircle, Phone, Plus, SquarePen } from 'lucide-react';
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
  total: number;
  selectedId: string | null;
  menuId: string | null;
  stats: { KN: number; KM: number; CCS: number; KH: number; pinned: number };
  onSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (customer: CustomerListItem, action: CustomerAction) => void;
  onAdd: () => void;
};

export function CustomerCardList({
  items,
  total,
  selectedId,
  menuId,
  stats,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onAction,
  onAdd,
}: Props) {
  return (
    <div className="kh-cards-shell">
      <div className="kh-cards" role="list" aria-label="Danh sách khách hàng">
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
                      <a
                        href={`tel:${c.primaryPhone}`}
                        className="kh-card-call"
                        title={c.primaryPhone}
                        aria-label={`Gọi ${c.primaryPhone}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon icon={Phone} size={12} />
                      </a>
                    ) : null}
                    {c.facebook ? (
                      <span className="kh-card-chat" title="Có Facebook">
                        <Icon icon={MessageCircle} size={12} />
                      </span>
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
                    <CrmBadge tone={statusTone(c.status)}>{statusLabel(c.status)}</CrmBadge>
                  </div>
                  {budget !== '—' ? <span className="kh-card-budget">{budget}</span> : null}
                  {demand !== '—' ? <span className="kh-card-need">{demand}</span> : null}
                </div>
                <div className="kh-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="kh-card-edit"
                    title="Cập nhật chăm sóc"
                    aria-label={`Cập nhật chăm sóc ${c.fullName}`}
                    onClick={() => onAction(c, 'care')}
                  >
                    <Icon icon={SquarePen} size={16} />
                  </button>
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
      <div className="kh-cards-stats">
        <span>
          All:{' '}
          <strong>
            {items.length}
            {total > items.length ? ` / ${total}` : ''}
          </strong>
        </span>
        <span>
          KN: <strong>{stats.KN}</strong>
        </span>
        <span>
          KM: <strong>{stats.KM}</strong>
        </span>
        <span>
          CCS: <strong>{stats.CCS}</strong>
        </span>
        <span>
          KH: <strong>{stats.KH}</strong>
        </span>
        <span>
          ĐG: <strong>{stats.pinned}</strong>
        </span>
      </div>
      <button type="button" className="kh-cards-add" onClick={onAdd}>
        <Icon icon={Plus} size={18} />
        Thêm khách bằng SĐT
      </button>
    </div>
  );
}
