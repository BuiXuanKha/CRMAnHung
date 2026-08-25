'use client';

import Link from 'next/link';
import { LodatSaleStatus, type LodatListItem } from '@crmanhung/shared';
import { formatArea, formatFrontageDir, formatPriceVnd } from '../display';
import './same-ward-list.css';

type Props = {
  placement: 'desktop' | 'mobile';
  wardName: string | null | undefined;
  items: LodatListItem[];
  loading?: boolean;
  error?: string | null;
  /** Ẩn hẳn khi không có xã (không gọi API / không có ward). */
  visible: boolean;
};

function statusLabel(status: LodatListItem['status']): string {
  return status === LodatSaleStatus.DANG_BAN ? 'Mở bán' : 'Tạm dừng';
}

export function SameWardList({
  placement,
  wardName,
  items,
  loading,
  error,
  visible,
}: Props) {
  if (!visible) return null;

  const asideClass = [
    'ld-same-ward',
    placement === 'desktop' ? 'ld-same-ward-desktop' : 'ld-same-ward-mobile',
  ].join(' ');

  return (
    <aside className={asideClass} aria-label="Lô đất cùng xã">
      <header className="ld-same-ward-header">
        <h3 className="ld-same-ward-title">Lô đất cùng xã</h3>
        {wardName ? <p className="ld-same-ward-ward">{wardName}</p> : null}
      </header>
      <div className="ld-same-ward-body">
        {loading && items.length === 0 ? (
          <p className="ld-same-ward-state">Đang tải…</p>
        ) : error ? (
          <p className="ld-same-ward-error">{error}</p>
        ) : items.length === 0 ? (
          <p className="ld-same-ward-state">Không có lô đất khác trong xã này.</p>
        ) : (
          <ul className="ld-same-ward-list">
            {items.map((p) => {
              const extra = p.extraPhotoCount ?? 0;
              return (
                <li key={p.id}>
                  <Link href={`/lo-dat/${p.id}`} className="ld-same-ward-card">
                    <div className="ld-same-ward-thumb" aria-hidden>
                      {p.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverImageUrl} alt="" />
                      ) : (
                        <span>—</span>
                      )}
                      {extra > 0 ? (
                        <span className="ld-same-ward-img-badge">+{extra}</span>
                      ) : null}
                    </div>
                    <span className="ld-same-ward-text">
                      <span className="ld-same-ward-item-title">{p.title}</span>
                      {p.address ? (
                        <span className="ld-same-ward-addr">{p.address}</span>
                      ) : null}
                      <span className="ld-same-ward-meta">
                        {formatArea(p.areaM2)}
                        {' · '}
                        {formatFrontageDir(p.frontageM, p.direction)}
                      </span>
                      <span className="ld-same-ward-meta">
                        {formatPriceVnd(p.priceVnd)}
                        {p.priceNote ? ` · ${p.priceNote}` : ''}
                      </span>
                    </span>
                    <span
                      className={[
                        'ld-same-ward-status',
                        p.status === LodatSaleStatus.DANG_BAN
                          ? 'is-open'
                          : 'is-paused',
                      ].join(' ')}
                    >
                      {statusLabel(p.status)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
