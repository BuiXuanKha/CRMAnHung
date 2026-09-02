import type { ShareStatsDisplayRow } from '@crmanhung/shared';
import {
  ShareStatsPerson,
  shareStatsRowKey,
  shareStatsShareCount,
  shareStatsViewCount,
} from './share-stats-person';

export function ShareStatsCards({ rows }: { rows: ShareStatsDisplayRow[] }) {
  const total = rows.length;
  return (
    <section className="pw-cards" aria-label="Thống kê share">
      <ul className="pw-card-list">
        {rows.map((row) => (
          <li key={shareStatsRowKey(row)}>
            <div className="pw-card pw-card-static">
              <ShareStatsPerson row={row} />
              <span className="pw-share-metrics">
                <span>
                  Share <strong>{shareStatsShareCount(row)}</strong>
                </span>
                <span>
                  Xem <strong>{shareStatsViewCount(row)}</strong>
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="pw-table-foot">
        Hiển thị <strong>{total}</strong> / Tổng <strong>{total}</strong> dòng
      </p>
    </section>
  );
}
