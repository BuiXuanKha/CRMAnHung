import type { ShareEmployeeStat } from '@crmanhung/shared';
import { ShareStatsPerson } from './share-stats-person';

export function ShareStatsCards({
  items,
  total,
}: {
  items: ShareEmployeeStat[];
  total: number;
}) {
  return (
    <section className="pw-cards" aria-label="Thống kê share">
      {items.length === 0 ? (
        <p className="pw-empty">Không có nhân viên.</p>
      ) : (
        <ul className="pw-card-list">
          {items.map((row) => (
            <li key={row.employeeId}>
              <div className="pw-card pw-card-static">
                <ShareStatsPerson row={row} />
                <span className="pw-share-count" aria-label="Đã share">
                  {row.sharedListingCount}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="pw-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> nhân viên
      </p>
    </section>
  );
}
