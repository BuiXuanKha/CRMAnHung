'use client';

import { LodatSaleStatus, type LodatDetail } from '@crmanhung/shared';
import { formatPriceVnd, formatUpdatedAt } from '../display';

type Props = {
  detail: LodatDetail;
};

function statusLabel(status: LodatDetail['status']): string {
  return status === LodatSaleStatus.DANG_BAN ? 'Mở bán' : 'Tạm dừng';
}

/**
 * Lịch sử chủ đầy đủ (API maps) = slice sau.
 * Hiện card chủ active từ detail để khớp layout CRM cũ.
 */
export function LodatEditOwnerHistory({ detail }: Props) {
  if (!detail.owner) return null;

  return (
    <section className="ld-edit-card">
      <h2 className="ld-edit-section-title">Lịch sử chủ đất</h2>
      <ul className="ld-edit-history-list">
        <li className="ld-edit-history-item active">
          <div className="ld-edit-history-head">
            <span className="ld-edit-history-owner">{detail.owner.fullName}</span>
            <span className="ld-edit-history-badge">Đang active</span>
          </div>
          <div className="ld-edit-history-meta">
            <span>{statusLabel(detail.status)}</span>
            <span>{formatPriceVnd(detail.priceVnd)}</span>
          </div>
          <div className="ld-edit-history-dates">
            Từ {formatUpdatedAt(detail.updatedAt)}
          </div>
        </li>
      </ul>
    </section>
  );
}
