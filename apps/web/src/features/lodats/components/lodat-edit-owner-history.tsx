'use client';

import { LodatSaleStatus, type LodatDetail } from '@crmanhung/shared';
import { formatPriceVnd, formatUpdatedAt } from '../display';

type Props = {
  detail: LodatDetail;
};

function statusLabel(status: string): string {
  if (status === LodatSaleStatus.DANG_BAN) return 'Mở bán';
  if (status === LodatSaleStatus.TAM_DUNG) return 'Tạm dừng';
  if (status === LodatSaleStatus.KHONG_BAN) return 'Không bán';
  if (status === LodatSaleStatus.DAT_COC) return 'Đặt cọc';
  if (status === LodatSaleStatus.DA_BAN) return 'Đã bán';
  return status;
}

/** Lịch sử chủ — mọi map của lô (lodats.md §12.4.5). */
export function LodatEditOwnerHistory({ detail }: Props) {
  const rows = detail.ownerHistory?.length
    ? detail.ownerHistory
    : detail.owner
      ? [
          {
            id: detail.owner.customerId,
            customerId: detail.owner.customerId,
            fullName: detail.owner.fullName,
            isActive: true,
            status: detail.status,
            priceVnd: detail.priceVnd ?? null,
            startedAt: detail.updatedAt,
            endedAt: null as string | null,
          },
        ]
      : [];

  if (rows.length === 0) return null;

  return (
    <section className="ld-edit-card">
      <h2 className="ld-edit-section-title">Lịch sử chủ đất</h2>
      <ul className="ld-edit-history-list">
        {rows.map((row) => (
          <li
            key={row.id}
            className={row.isActive ? 'ld-edit-history-item active' : 'ld-edit-history-item'}
          >
            <div className="ld-edit-history-head">
              <span className="ld-edit-history-owner">{row.fullName}</span>
              <span
                className={
                  row.isActive ? 'ld-edit-history-badge' : 'ld-edit-history-badge ended'
                }
              >
                {row.isActive ? 'Đang active' : 'Đã kết thúc'}
              </span>
            </div>
            <div className="ld-edit-history-meta">
              <span>{statusLabel(row.status)}</span>
              <span className="crm-money">{formatPriceVnd(row.priceVnd)}</span>
            </div>
            <div className="ld-edit-history-dates">
              Từ {formatUpdatedAt(row.startedAt)}
              {row.endedAt ? ` · Đến ${formatUpdatedAt(row.endedAt)}` : ''}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
