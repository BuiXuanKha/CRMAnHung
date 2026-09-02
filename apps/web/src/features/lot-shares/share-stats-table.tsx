import type { ShareStatsDisplayRow } from '@crmanhung/shared';
import {
  ShareStatsPerson,
  shareStatsRowKey,
  shareStatsShareCount,
  shareStatsViewCount,
} from './share-stats-person';

export function ShareStatsTable({ rows }: { rows: ShareStatsDisplayRow[] }) {
  const total = rows.length;
  return (
    <section className="pw-table-shell" aria-label="Thống kê share">
      <div className="pw-table-wrap pw-table-wrap--share-stats">
        <div className="pw-table-head">
          <div className="pw-grid-row pw-grid-header" role="row">
            <div>#</div>
            <div>Nhân viên</div>
            <div>Đã share</div>
            <div>Lượt xem</div>
          </div>
        </div>
        <div className="pw-table-scroll">
          {rows.map((row, index) => (
            <div key={shareStatsRowKey(row)} className="pw-grid-row is-static" role="row">
              <div>
                <span className="pw-col-index">{index + 1}</span>
              </div>
              <div>
                <ShareStatsPerson row={row} />
              </div>
              <div>
                <span className="pw-share-count">{shareStatsShareCount(row)}</span>
              </div>
              <div>
                <span className="pw-share-count">{shareStatsViewCount(row)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pw-table-foot">
          Hiển thị <strong>{total}</strong> / Tổng <strong>{total}</strong> dòng
        </div>
      </div>
    </section>
  );
}
