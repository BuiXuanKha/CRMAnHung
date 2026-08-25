'use client';

import Link from 'next/link';
import type { LodatListItem } from '@crmanhung/shared';
import { formatArea, formatFrontageDir, formatPriceVnd } from '../display';
import './same-ward-list.css';

type Props = {
  wardName: string | null | undefined;
  items: LodatListItem[];
  loading?: boolean;
};

export function SameWardList({ wardName, items, loading }: Props) {
  if (loading) {
    return (
      <section className="ld-same-ward" aria-label="Lô cùng xã">
        <h2 className="ld-same-ward-title">Lô cùng xã</h2>
        <p className="ld-same-ward-empty">Đang tải…</p>
      </section>
    );
  }

  if (!items.length) return null;

  const heading = wardName ? `Lô cùng xã · ${wardName}` : 'Lô cùng xã';

  return (
    <section className="ld-same-ward" aria-label={heading}>
      <h2 className="ld-same-ward-title">{heading}</h2>
      <ul className="ld-same-ward-list">
        {items.map((p) => (
          <li key={p.id}>
            <Link href={`/lo-dat/${p.id}`} className="ld-same-ward-card">
              <div className="ld-same-ward-thumb" aria-hidden>
                {p.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImageUrl} alt="" />
                ) : (
                  <span>—</span>
                )}
              </div>
              <div className="ld-same-ward-body">
                <h3>{p.title}</h3>
                {p.address ? <p className="ld-same-ward-addr">{p.address}</p> : null}
                <p className="ld-same-ward-specs">
                  {formatArea(p.areaM2)}
                  {' · '}
                  {formatFrontageDir(p.frontageM, p.direction)}
                </p>
                <p className="crm-money ld-same-ward-price">{formatPriceVnd(p.priceVnd)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
