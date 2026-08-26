import { ImageOff } from 'lucide-react';
import type { PublicWebLotRow } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import { lotPriceDisplay, lotWebLabel, lotWebTone } from '../display';

type Props = {
  items: PublicWebLotRow[];
  total: number;
  onSelect: (id: string) => void;
};

export function DashboardLotCards({ items, total, onSelect }: Props) {
  return (
    <section className="pw-cards" aria-label="Lô trên web">
      <h2 className="pw-panel-title">Lô trên web</h2>
      {items.length === 0 ? (
        <p className="pw-empty">Không có lô trên web.</p>
      ) : (
        <ul className="pw-card-list">
          {items.map((row) => {
            const price = lotPriceDisplay(row);
            return (
              <li key={row.id}>
                <button type="button" className="pw-card" onClick={() => onSelect(row.id)}>
                  <span className="pw-thumb">
                    {row.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.coverImageUrl} alt="" />
                    ) : (
                      <span className="pw-thumb-empty">
                        <Icon icon={ImageOff} size="sm" />
                      </span>
                    )}
                  </span>
                  <span className="pw-card-body">
                    <span className="pw-card-top">
                      <strong className="pw-title">{row.title}</strong>
                      <CrmBadge tone={lotWebTone(row.isPublished)}>
                        {lotWebLabel(row.isPublished)}
                      </CrmBadge>
                    </span>
                    <span className="pw-sub">{row.location || '—'}</span>
                    {price.isMoney ? (
                      <span className="crm-money">{price.text}</span>
                    ) : (
                      <span className="pw-contact">{price.text}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="pw-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> lô
      </p>
    </section>
  );
}
