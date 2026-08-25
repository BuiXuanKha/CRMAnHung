import { formatStatMoneyVnd, formatStatShortVnd } from '../display';

type Props = {
  count: number;
  totalRevenueVnd: number | string;
  totalCommissionVnd: number | string;
};

export function TransactionStats({ count, totalRevenueVnd, totalCommissionVnd }: Props) {
  return (
    <section className="tx-stats" aria-label="Tổng quan giao dịch">
      <article className="tx-stat">
        <p className="tx-stat-label">Số lô giao dịch</p>
        <p className="tx-stat-value">{count}</p>
        <p className="tx-stat-hint">Theo bộ lọc hiện tại</p>
      </article>
      <article className="tx-stat">
        <p className="tx-stat-label">Tổng doanh thu</p>
        <p className="tx-stat-value crm-money">
          <span className="tx-stat-full">{formatStatMoneyVnd(totalRevenueVnd)}</span>
          <span className="tx-stat-short">{formatStatShortVnd(totalRevenueVnd)}</span>
        </p>
        <p className="tx-stat-hint">Chỉ giao dịch của tôi · Hoàn thành</p>
      </article>
      <article className="tx-stat">
        <p className="tx-stat-label">Tổng hoa hồng</p>
        <p className="tx-stat-value crm-money">
          <span className="tx-stat-full">{formatStatMoneyVnd(totalCommissionVnd)}</span>
          <span className="tx-stat-short">{formatStatShortVnd(totalCommissionVnd)}</span>
        </p>
        <p className="tx-stat-hint">Chỉ giao dịch của tôi · Hoàn thành</p>
      </article>
    </section>
  );
}
