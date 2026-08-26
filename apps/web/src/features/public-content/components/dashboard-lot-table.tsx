import { ImageOff } from 'lucide-react';
import type { Ref } from 'react';
import type { PublicWebLotRow } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import { lotPriceDisplay, lotWebLabel, lotWebTone } from '../display';

type Props = {
  items: PublicWebLotRow[];
  total: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  heading?: string | null;
  scrollRef?: Ref<HTMLDivElement>;
};

export function DashboardLotTable({
  items,
  total,
  selectedId,
  onSelect,
  heading = 'Lô trên web',
  scrollRef,
}: Props) {
  return (
    <section className="pw-table-shell" aria-label={heading ?? 'Lô trên web'}>
      {heading ? <h2 className="pw-panel-title">{heading}</h2> : null}
      <div className="pw-table-wrap pw-table-wrap--lot">
        <div className="pw-table-head">
          <div className="pw-grid-row pw-grid-header" role="row">
            <div>Ảnh</div>
            <div>Tiêu đề</div>
            <div>Giá</div>
            <div>Web</div>
          </div>
        </div>
        <div className="pw-table-scroll" ref={scrollRef}>
          {items.length === 0 ? (
            <p className="pw-empty">Không có lô trên web.</p>
          ) : (
            items.map((row) => {
              const price = lotPriceDisplay(row);
              return (
                <div
                  key={row.id}
                  role="row"
                  data-list-row-id={row.id}
                  className={
                    selectedId === row.id ? 'pw-grid-row is-selected' : 'pw-grid-row'
                  }
                  onClick={() => onSelect(row.id)}
                >
                  <div>
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
                  </div>
                  <div>
                    <p className="pw-title">{row.title}</p>
                    <p className="pw-sub">{row.location || '—'}</p>
                  </div>
                  <div>
                    {price.isMoney ? (
                      <span className="crm-money">{price.text}</span>
                    ) : (
                      <span className="pw-contact">{price.text}</span>
                    )}
                  </div>
                  <div>
                    <CrmBadge tone={lotWebTone(row.isPublished)}>
                      {lotWebLabel(row.isPublished)}
                    </CrmBadge>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="pw-table-foot">
          Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> lô
        </div>
      </div>
    </section>
  );
}
