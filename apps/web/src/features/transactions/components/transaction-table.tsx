'use client';

import { TransactionType, type TransactionListItem } from '@crmanhung/shared';
import { useState } from 'react';
import { ColumnFilter } from '@/shared/ui/column-filter';
import { CrmBadge } from '@/shared/ui/badge';
import {
  BUYER_FILTER_OPTIONS,
  COMMISSION_FILTER_OPTIONS,
  LODAT_FILTER_OPTIONS,
  NOTE_FILTER_OPTIONS,
  NOTARY_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  SELLER_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
  formatCreatedAt,
  formatMoneyVnd,
  getNotaryAppointmentDisplay,
  statusLabel,
  statusTone,
  typeLabel,
  typeTone,
  type ExtraFilters,
} from '../display';
import { ActionMenu, type TransactionAction } from './action-menu';

type HeaderFilter =
  | 'type'
  | 'lodat'
  | 'seller'
  | 'buyer'
  | 'price'
  | 'commission'
  | 'status'
  | 'notary'
  | 'note'
  | null;

type Props = {
  items: TransactionListItem[];
  total: number;
  selectedId: string | null;
  menuId: string | null;
  type: string;
  status: string;
  extra: ExtraFilters;
  onType: (v: string) => void;
  onStatus: (v: string) => void;
  onExtra: (next: ExtraFilters) => void;
  onSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (item: TransactionListItem, action: TransactionAction) => void;
};

function PartyNames({ names }: { names: string[] }) {
  const list = names.map((n) => n.trim()).filter(Boolean);
  if (!list.length) {
    return <span className="tx-empty">—</span>;
  }
  return (
    <div className="tx-stack">
      {list.map((name, index) => (
        <span key={`${name}-${index}`}>{name}</span>
      ))}
    </div>
  );
}

function CommissionCell({ item }: { item: TransactionListItem }) {
  if (item.type === TransactionType.RECORD) {
    return <span className="tx-empty">—</span>;
  }
  return <span className="crm-money">{formatMoneyVnd(item.commissionVnd)}</span>;
}

function NotaryCell({ item }: { item: TransactionListItem }) {
  const { dateLabel, countdownLabel, countdownTone } = getNotaryAppointmentDisplay(item);
  if (!dateLabel) {
    return <span className="tx-empty">—</span>;
  }
  return (
    <div className="tx-stack">
      <span>{dateLabel}</span>
      {countdownLabel ? (
        <span className={`tx-countdown tx-countdown--${countdownTone}`}>{countdownLabel}</span>
      ) : null}
    </div>
  );
}

export function TransactionTable({
  items,
  total,
  selectedId,
  menuId,
  type,
  status,
  extra,
  onType,
  onStatus,
  onExtra,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onAction,
}: Props) {
  const [headerFilter, setHeaderFilter] = useState<HeaderFilter>(null);

  function toggleFilter(key: HeaderFilter) {
    setHeaderFilter((cur) => (cur === key ? null : key));
    onCloseMenu();
  }

  return (
    <div className="tx-table-wrap" role="table" aria-label="Danh sách giao dịch">
      <div className="tx-table-head" role="rowgroup">
        <div className="tx-grid-row tx-grid-header" role="row">
          <div role="columnheader">Mã GD</div>
          <div className="tx-col-head" role="columnheader">
            <span>Loại</span>
            <ColumnFilter
              label="Loại"
              value={type}
              allValue=""
              options={TYPE_FILTER_OPTIONS}
              open={headerFilter === 'type'}
              onToggle={() => toggleFilter('type')}
              onClose={() => setHeaderFilter(null)}
              onChange={onType}
            />
          </div>
          <div className="tx-col-head" role="columnheader">
            <span>Lô đất</span>
            <ColumnFilter
              label="Lô đất"
              value={extra.lodat}
              options={LODAT_FILTER_OPTIONS}
              open={headerFilter === 'lodat'}
              onToggle={() => toggleFilter('lodat')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, lodat: v as ExtraFilters['lodat'] })}
            />
          </div>
          <div className="tx-col-head" role="columnheader">
            <span>Người bán</span>
            <ColumnFilter
              label="Người bán"
              value={extra.seller}
              options={SELLER_FILTER_OPTIONS}
              open={headerFilter === 'seller'}
              onToggle={() => toggleFilter('seller')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, seller: v as ExtraFilters['seller'] })}
            />
          </div>
          <div className="tx-col-head" role="columnheader">
            <span>Người mua</span>
            <ColumnFilter
              label="Người mua"
              value={extra.buyer}
              options={BUYER_FILTER_OPTIONS}
              open={headerFilter === 'buyer'}
              onToggle={() => toggleFilter('buyer')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, buyer: v as ExtraFilters['buyer'] })}
            />
          </div>
          <div className="tx-col-head" role="columnheader">
            <span>Giá bán</span>
            <ColumnFilter
              label="Giá bán"
              value={extra.price}
              options={PRICE_FILTER_OPTIONS}
              open={headerFilter === 'price'}
              onToggle={() => toggleFilter('price')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, price: v as ExtraFilters['price'] })}
            />
          </div>
          <div className="tx-col-head" role="columnheader">
            <span>Hoa hồng</span>
            <ColumnFilter
              label="Hoa hồng"
              value={extra.commission}
              options={COMMISSION_FILTER_OPTIONS}
              open={headerFilter === 'commission'}
              onToggle={() => toggleFilter('commission')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) =>
                onExtra({ ...extra, commission: v as ExtraFilters['commission'] })
              }
            />
          </div>
          <div className="tx-col-head" role="columnheader">
            <span>Trạng thái</span>
            <ColumnFilter
              label="Trạng thái"
              value={status}
              allValue=""
              options={STATUS_FILTER_OPTIONS}
              open={headerFilter === 'status'}
              onToggle={() => toggleFilter('status')}
              onClose={() => setHeaderFilter(null)}
              onChange={onStatus}
            />
          </div>
          <div className="tx-col-head" role="columnheader">
            <span>Hẹn CC</span>
            <ColumnFilter
              label="Hẹn CC"
              value={extra.notary}
              options={NOTARY_FILTER_OPTIONS}
              open={headerFilter === 'notary'}
              onToggle={() => toggleFilter('notary')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, notary: v as ExtraFilters['notary'] })}
            />
          </div>
          <div className="tx-col-head" role="columnheader">
            <span>Ghi chú</span>
            <ColumnFilter
              label="Ghi chú"
              value={extra.note}
              options={NOTE_FILTER_OPTIONS}
              open={headerFilter === 'note'}
              onToggle={() => toggleFilter('note')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, note: v as ExtraFilters['note'] })}
            />
          </div>
          <div role="columnheader">Ngày tạo</div>
          <div className="col-act" role="columnheader">
            Thao tác
          </div>
        </div>
      </div>

      <div className="tx-table-scroll" role="rowgroup">
        {items.length === 0 ? (
          <div className="tx-empty-row" role="row">
            Không có giao dịch phù hợp.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              role="row"
              className={[
                'tx-grid-row',
                selectedId === item.id ? 'is-selected' : '',
                menuId === item.id ? 'is-menu-open' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(item.id)}
            >
              <div className="tx-cell" role="cell">
                <strong className="tx-code">{item.code}</strong>
              </div>
              <div className="tx-cell" role="cell">
                <CrmBadge tone={typeTone(item.type)}>{typeLabel(item.type)}</CrmBadge>
              </div>
              <div className="tx-cell" role="cell">
                {item.lodatTitle?.trim() ? (
                  <span>{item.lodatTitle}</span>
                ) : (
                  <span className="tx-empty">—</span>
                )}
              </div>
              <div className="tx-cell" role="cell">
                <PartyNames names={item.sellerNames} />
              </div>
              <div className="tx-cell" role="cell">
                <PartyNames names={item.buyerNames} />
              </div>
              <div className="tx-cell" role="cell">
                <span className="crm-money">{formatMoneyVnd(item.salePriceVnd)}</span>
              </div>
              <div className="tx-cell" role="cell">
                <CommissionCell item={item} />
              </div>
              <div className="tx-cell" role="cell">
                <CrmBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</CrmBadge>
              </div>
              <div className="tx-cell" role="cell">
                <NotaryCell item={item} />
              </div>
              <div className="tx-cell" role="cell">
                {item.note?.trim() ? (
                  <span className="tx-note" title={item.note.trim()}>
                    {item.note.trim()}
                  </span>
                ) : (
                  <span className="tx-empty">—</span>
                )}
              </div>
              <div className="tx-cell tx-created" role="cell">
                {formatCreatedAt(item.createdAt)}
              </div>
              <div
                className="col-act tx-cell"
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
          ))
        )}
      </div>

      <div className="tx-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> giao dịch
      </div>
    </div>
  );
}
