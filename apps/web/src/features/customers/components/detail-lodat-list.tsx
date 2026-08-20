'use client';

import { useRouter } from 'next/navigation';
import type { MockLodatBrief } from '../mock-data';

type Props = {
  lots: MockLodatBrief[];
};

export function DetailLodatList({ lots }: Props) {
  const router = useRouter();

  if (lots.length === 0) {
    return <p className="kh-detail-empty">Chưa gắn lô đất.</p>;
  }

  return (
    <ul className="kh-detail-lots">
      {lots.map((lot) => {
        const spec = [lot.area, lot.frontage ? `MT ${lot.frontage}` : null, lot.direction]
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
                  —
                </div>
                <div className="kh-detail-lot-info">
                  {lot.address ? <div className="kh-detail-lot-addr">{lot.address}</div> : null}
                  {spec ? <div className="kh-detail-lot-spec">{spec}</div> : null}
                  <div className="kh-detail-lot-price">
                    <span className="crm-money">{lot.price}</span>
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
