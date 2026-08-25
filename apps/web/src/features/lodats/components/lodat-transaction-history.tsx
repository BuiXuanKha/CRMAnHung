'use client';

import Link from 'next/link';
import {
  TransactionStatus,
  type LodatTransactionHistoryItem,
} from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import {
  formatCreatedAt,
  formatMoneyVnd,
  statusLabel,
  statusTone,
  typeLabel,
  typeTone,
} from '@/features/transactions/display';
import './lodat-transaction-history.css';

const OPEN_TX = new Set<TransactionStatus>([
  TransactionStatus.DA_COC,
  TransactionStatus.DA_CONG_CHUNG,
]);

type Props = {
  items: LodatTransactionHistoryItem[] | undefined;
};

function partySummary(names: string[], emptyLabel: string): string {
  const list = names.map((n) => n.trim()).filter(Boolean);
  return list.length ? list.join(', ') : emptyLabel;
}

/** Lịch sử GD trên chi tiết lô — lodats.md §12.3.5. */
export function LodatTransactionHistory({ items }: Props) {
  if (!items?.length) return null;

  return (
    <section className="ld-tx-history" aria-label="Lịch sử giao dịch">
      <h2 className="ld-tx-history-title">Lịch sử giao dịch</h2>
      <ul className="ld-tx-history-list">
        {items.map((item) => {
          const isOpen = OPEN_TX.has(item.status);
          const priceNum =
            typeof item.salePriceVnd === 'string'
              ? Number(item.salePriceVnd)
              : item.salePriceVnd;
          const priceText = formatMoneyVnd(
            priceNum != null && Number.isFinite(priceNum) ? priceNum : null,
          );
          return (
            <li
              key={item.id}
              className={
                isOpen ? 'ld-tx-history-item open' : 'ld-tx-history-item'
              }
            >
              <div className="ld-tx-history-head">
                <Link href={`/giao-dich/${item.id}`} className="ld-tx-history-code">
                  {item.code || `GD #${item.id}`}
                </Link>
                <CrmBadge tone={statusTone(item.status)}>
                  {statusLabel(item.status)}
                </CrmBadge>
              </div>
              <div className="ld-tx-history-meta">
                <CrmBadge tone={typeTone(item.type)}>{typeLabel(item.type)}</CrmBadge>
                {priceText !== '—' ? (
                  <span className="crm-money">{priceText}</span>
                ) : null}
              </div>
              <div className="ld-tx-history-parties">
                <span>Bán: {partySummary(item.sellerNames, 'Chưa có')}</span>
                <span>Mua: {partySummary(item.buyerNames, 'Chưa có')}</span>
              </div>
              <div className="ld-tx-history-dates">{formatCreatedAt(item.createdAt)}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
