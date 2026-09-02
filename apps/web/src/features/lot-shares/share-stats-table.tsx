import type { ShareEmployeeStat } from '@crmanhung/shared';
import { ShareStatsPerson } from './share-stats-person';

export function ShareStatsTable({
  items,
  total,
}: {
  items: ShareEmployeeStat[];
  total: number;
}) {
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
          {items.length === 0 ? (
            <p className="pw-empty">Không có nhân viên.</p>
          ) : (
            items.map((row, index) => (
              <div key={row.employeeId} className="pw-grid-row is-static" role="row">
                <div>
                  <span className="pw-col-index">{index + 1}</span>
                </div>
                <div>
                  <ShareStatsPerson row={row} />
                </div>
                <div>
                  <span className="pw-share-count">{row.sharedListingCount}</span>
                </div>
                <div>
                  <span className="pw-share-count">{row.attributedViewCount}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="pw-table-foot">
          Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> nhân viên
        </div>
      </div>
    </section>
  );
}
