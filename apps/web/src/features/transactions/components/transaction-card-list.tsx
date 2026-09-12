'use client';

import { TransactionStatus, TransactionType, type TransactionListItem } from '@crmanhung/shared';
import type { Ref } from 'react';
import { CrmBadge } from '@/shared/ui/badge';
import { TransactionListEmpty } from './list-empty';
import {
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
  filteredEmpty: boolean;
  loadingMore?: boolean;
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: () => void;
};

function partyLine(names: string[]): string {
  return names
    .map((n) => n.trim())
    .filter(Boolean)
    .join(', ');
}

function CommissionValue({ item }: { item: TransactionListItem }) {
  if (item.type === TransactionType.RECORD) {
    return <span className="tx-empty">—</span>;
  }
  return <span>{formatMoneyVnd(item.commissionVnd)}</span>;
}

/** Hẹn CC trên list: chỉ Của tôi · Đã cọc (còn việc phải theo dõi). */
function showNotaryOnCard(item: TransactionListItem): boolean {
  return item.type === TransactionType.OWN && item.status === TransactionStatus.DA_COC;
}

function NotaryLine({ item }: { item: TransactionListItem }) {
  const { dateLabel, countdownLabel, countdownTone } = getNotaryAppointmentDisplay(item);
  if (!dateLabel) return null;
  return (
    <p className="tx-card-notary-line">
      <span>Hẹn CC {dateLabel}</span>
      {countdownLabel ? (
        <span className={`tx-countdown tx-countdown--${countdownTone}`}>{countdownLabel}</span>
      ) : null}
    </p>
  );
}

/**
 * Mobile list card — phương án A (phiếu gọn):
 * mã+hangtag → tiêu đề lô → bán→mua → giá/HH → hẹn CC (nếu cần) → ghi chú.
 * Không label IN HOA; ẩn ngày tạo trên list.
 */
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
  filteredEmpty,
  loadingMore = false,
  scrollRef,
  onScroll,
}: Props) {
  return (
    <div className="tx-cards-shell">
      <div
        className="tx-cards"
        role="list"
        aria-label="Danh sách giao dịch"
        ref={scrollRef}
        onScroll={onScroll}
      >
        {items.length === 0 ? (
          <div className="tx-empty-cards">
            <TransactionListEmpty filtered={filteredEmpty} />
          </div>
        ) : (
          items.map((item) => {
            function openCard() {
              onSelect(item.id);
              onOpen(item.id);
            }
            const sellers = partyLine(item.sellerNames);
            const buyers = partyLine(item.buyerNames);
            const note = item.note?.trim() ?? '';
            return (
              <article
                key={item.id}
                role="listitem"
                data-list-row-id={item.id}
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

                <p className="tx-card-parties" aria-label="Người bán và người mua">
                  <span className="tx-card-party">{sellers || '—'}</span>
                  <span className="tx-card-party-arrow" aria-hidden>
                    →
                  </span>
                  <span className="tx-card-party">{buyers || '—'}</span>
                </p>

                <div className="tx-card-money">
                  <p className="tx-card-price crm-money">{formatMoneyVnd(item.salePriceVnd)}</p>
                  <p className="tx-card-commission">
                    <span className="tx-card-commission-label">HH</span>{' '}
                    <CommissionValue item={item} />
                  </p>
                </div>

                {showNotaryOnCard(item) ? <NotaryLine item={item} /> : null}

                {note ? (
                  <p className="tx-card-note" title={note}>
                    {note}
                  </p>
                ) : null}
              </article>
            );
          })
        )}
      </div>
      <div className="tx-cards-count">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> giao dịch
        {loadingMore ? ' — Đang tải thêm…' : ''}
      </div>
    </div>
  );
}
