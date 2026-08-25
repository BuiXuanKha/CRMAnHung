'use client';

import { useRouter } from 'next/navigation';
import type { CustomerLodatBrief } from '@crmanhung/shared';
import { formatPriceVnd } from '@/features/lodats/display';

type Props = {
  lots: CustomerLodatBrief[];
  loading?: boolean;
};

export function DetailLodatList({ lots, loading }: Props) {
  const router = useRouter();

  if (loading) {
    return <p className="kh-detail-empty">Đang tải lô đất…</p>;
  }

  if (lots.length === 0) {
    return <p className="kh-detail-empty">Chưa gắn lô đất.</p>;
  }

  return (
    <ul className="kh-detail-lots">
      {lots.map((lot) => {
        const spec = [
          lot.areaM2 != null ? `${lot.areaM2.toLocaleString('vi-VN')} m²` : null,
          lot.frontageM != null
            ? `MT ${lot.frontageM.toLocaleString('vi-VN')} m`
            : null,
          lot.direction?.trim() || null,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <li key={lot.id}>
            <button
              type="button"
              className="kh-detail-lot"
              onClick={() => router.push(`/lo-dat/${lot.id}`)}
            >
              <h4>{lot.title}</h4>
              <div className="kh-detail-lot-body">
                <div className="kh-detail-lot-thumb" aria-hidden>
                  {lot.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lot.coverImageUrl} alt="" />
                  ) : (
                    '—'
                  )}
                </div>
                <div className="kh-detail-lot-info">
                  {lot.address?.trim() ? (
                    <div className="kh-detail-lot-addr">{lot.address}</div>
                  ) : null}
                  {spec ? <div className="kh-detail-lot-spec">{spec}</div> : null}
                  <div className="kh-detail-lot-price">
                    <span className="crm-money">{formatPriceVnd(lot.priceVnd)}</span>
                  </div>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
