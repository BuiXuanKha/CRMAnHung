'use client';

import { useState } from 'react';
import {
  LodatSaleStatus,
  type LodatDetail,
  type LodatOwnerHistoryItem,
} from '@crmanhung/shared';
import { formatPriceVnd, formatUpdatedAt } from '../display';
import './lodat-owner-history.css';

const PREVIEW_COUNT = 3;

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

function resolveRows(detail: LodatDetail): LodatOwnerHistoryItem[] {
  if (detail.ownerHistory?.length) return detail.ownerHistory;
  if (!detail.owner) return [];
  return [
    {
      id: detail.owner.customerId,
      customerId: detail.owner.customerId,
      fullName: detail.owner.fullName,
      isActive: true,
      status: detail.status,
      priceVnd: detail.priceVnd ?? null,
      startedAt: detail.updatedAt,
      endedAt: null,
    },
  ];
}

/** Lịch sử chủ trên chi tiết lô — mặc định 3 dòng + Xem thêm (lodats.md §12.3.6). */
export function LodatOwnerHistory({ detail }: Props) {
  const rows = resolveRows(detail);
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) return null;

  const visible = expanded ? rows : rows.slice(0, PREVIEW_COUNT);
  const canExpand = rows.length > PREVIEW_COUNT;

  return (
    <section className="ld-owner-history" aria-label="Lịch sử chủ đất">
      <h2 className="ld-owner-history-title">Lịch sử chủ đất</h2>
      <ul className="ld-owner-history-list">
        {visible.map((row) => (
          <li
            key={row.id}
            className={row.isActive ? 'ld-owner-history-item active' : 'ld-owner-history-item'}
          >
            <div className="ld-owner-history-head">
              <span className="ld-owner-history-name">{row.fullName}</span>
              <span
                className={
                  row.isActive ? 'ld-owner-history-badge' : 'ld-owner-history-badge ended'
                }
              >
                {row.isActive ? 'Đang active' : 'Đã kết thúc'}
              </span>
            </div>
            <div className="ld-owner-history-meta">
              <span>{statusLabel(row.status)}</span>
              <span className="crm-money">{formatPriceVnd(row.priceVnd)}</span>
            </div>
            <div className="ld-owner-history-dates">
              Từ {formatUpdatedAt(row.startedAt)}
              {row.endedAt ? ` · Đến ${formatUpdatedAt(row.endedAt)}` : ''}
            </div>
          </li>
        ))}
      </ul>
      {canExpand ? (
        <button
          type="button"
          className="ld-owner-history-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      ) : null}
    </section>
  );
}
