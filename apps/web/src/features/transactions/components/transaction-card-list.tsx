'use client';

import { TransactionType, type TransactionListItem } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import {
  formatCreatedAt,
  formatMoneyVnd,
  getNotaryAppointmentDisplay,
  statusLabel,
  statusTone,
  typeLabel,
  typeTone,
} from '../display';
import { ActionMenu, type TransactionAction } from './action-menu';

type Props = {
  items: TransactionListItem[];
  total: number;
  selectedId: string | null;
  menuId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (item: TransactionListItem, action: TransactionAction) => void;
};

function PartyNames({ names }: { names: string[] }) {
  const list = names.map((n) => n.trim()).filter(Boolean);
  if (!list.length) return <span className="tx-empty">—</span>;
  return <span>{list.join(', ')}</span>;
}

function CommissionValue({ item }: { item: TransactionListItem }) {
  if (item.type === TransactionType.RECORD) {
    return <span className="tx-empty">—</span>;
  }
  return <span className="crm-money">{formatMoneyVnd(item.commissionVnd)}</span>;
}

function NotaryValue({ item }: { item: TransactionListItem }) {
  const { dateLabel, countdownLabel, countdownTone } = getNotaryAppointmentDisplay(item);
  if (!dateLabel) return <span className="tx-empty">—</span>;
  return (
    <span className="tx-card-notary">
      {dateLabel}
      {countdownLabel ? (
        <span className={`tx-countdown tx-countdown--${countdownTone}`}>{countdownLabel}</span>
      ) : null}
    </span>
  );
}

export function TransactionCardList({
  items,
  total,
  selectedId,
  menuId,
  onSelect,
  onOpen,
  onToggleMenu,
  onCloseMenu,
  onAction,
}: Props) {
  return (
    <div className="tx-cards-shell">
      <div className="tx-cards" role="list" aria-label="Danh sách giao dịch">
        {items.length === 0 ? (
          <p className="tx-empty-cards">Không có giao dịch phù hợp.</p>
        ) : (
          items.map((item) => {
            function openCard() {
              onSelect(item.id);
              onOpen(item.id);
            }
            return (
              <article
                key={item.id}
                role="listitem"
                className={[
                  'tx-card',
                  selectedId === item.id ? 'is-selected' : '',
                  menuId === item.id ? 'is-menu-open' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={openCard}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCard();
                  }
                }}
                tabIndex={0}
              >
                <header className="tx-card-head">
                  <strong className="tx-card-code">{item.code}</strong>
                  <div className="tx-card-head-end">
                    <CrmBadge tone={typeTone(item.type)}>{typeLabel(item.type)}</CrmBadge>
                    <CrmBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</CrmBadge>
                    <div className="tx-card-actions" onClick={(e) => e.stopPropagation()}>
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
                <p className="tx-card-lot">{item.lodatTitle?.trim() || '—'}</p>
                <dl className="tx-card-meta">
                  <div className="tx-card-meta-full">
                    <dt>Người bán</dt>
                    <dd>
                      <PartyNames names={item.sellerNames} />
                    </dd>
                  </div>
                  <div className="tx-card-meta-full">
                    <dt>Người mua</dt>
                    <dd>
                      <PartyNames names={item.buyerNames} />
                    </dd>
                  </div>
                  <div>
                    <dt>Giá bán</dt>
                    <dd>
                      <span className="crm-money">{formatMoneyVnd(item.salePriceVnd)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Hoa hồng</dt>
                    <dd>
                      <CommissionValue item={item} />
                    </dd>
                  </div>
                  <div className="tx-card-meta-full">
                    <dt>Hẹn công chứng</dt>
                    <dd>
                      <NotaryValue item={item} />
                    </dd>
                  </div>
                  <div className="tx-card-meta-full">
                    <dt>Ghi chú</dt>
                    <dd>
                      {item.note?.trim() ? (
                        <span className="tx-card-note" title={item.note.trim()}>
                          {item.note.trim()}
                        </span>
                      ) : (
                        <span className="tx-empty">—</span>
                      )}
                    </dd>
                  </div>
                  <div className="tx-card-meta-full">
                    <dt>Ngày tạo</dt>
                    <dd>{formatCreatedAt(item.createdAt)}</dd>
                  </div>
                </dl>
              </article>
            );
          })
        )}
      </div>
      <div className="tx-cards-count">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> giao dịch
      </div>
    </div>
  );
}
