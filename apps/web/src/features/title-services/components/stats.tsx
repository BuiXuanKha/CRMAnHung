import { formatStatMoneyVnd, formatStatShortVnd } from '../display';

type Props = {
  count: number;
  totalThuVnd: number | string;
  totalChiVnd: number | string;
};

export function TitleServiceStats({ count, totalThuVnd, totalChiVnd }: Props) {
  return (
    <section className="sd-stats" aria-label="Tổng quan dịch vụ sổ đỏ">
      <article className="sd-stat">
        <p className="sd-stat-label">Số hồ sơ sổ đỏ</p>
        <p className="sd-stat-value">{count}</p>
        <p className="sd-stat-hint">Theo bộ lọc hiện tại</p>
      </article>
      <article className="sd-stat">
        <p className="sd-stat-label">Tổng thu</p>
        <p className="sd-stat-value sd-stat-thu">
          <span className="sd-stat-full">{formatStatMoneyVnd(totalThuVnd)}</span>
          <span className="sd-stat-short">{formatStatShortVnd(totalThuVnd)}</span>
        </p>
        <p className="sd-stat-hint">Theo bộ lọc hiện tại</p>
      </article>
      <article className="sd-stat">
        <p className="sd-stat-label">Tổng chi</p>
        <p className="sd-stat-value sd-stat-chi">
          <span className="sd-stat-full">{formatStatMoneyVnd(totalChiVnd)}</span>
          <span className="sd-stat-short">{formatStatShortVnd(totalChiVnd)}</span>
        </p>
        <p className="sd-stat-hint">Theo bộ lọc hiện tại</p>
      </article>
    </section>
  );
}
