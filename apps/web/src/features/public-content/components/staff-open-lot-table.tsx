import { ImageOff } from 'lucide-react';
import type { Ref } from 'react';
import type { PublicWebStaffLotRow } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import { lotPriceDisplay, lotWebLabel, lotWebTone } from '../display';

type Props = {
  items: PublicWebStaffLotRow[];
  total: number;
  selectedId: string | null;
  onSelect: (lodatId: string) => void;
  scrollRef?: Ref<HTMLDivElement>;
};

export function StaffOpenLotTable({ items, total, selectedId, onSelect, scrollRef }: Props) {
  return (
    <section className="pw-table-shell" aria-label="Lô nhân viên đang mở bán">
      <div className="pw-table-wrap pw-table-wrap--staff-lot">
        <div className="pw-table-head">
          <div className="pw-grid-row pw-grid-header" role="row">
            <div>Ảnh</div>
            <div>Tiêu đề</div>
            <div>NV</div>
            <div>Giá</div>
            <div>Web</div>
          </div>
        </div>
        <div className="pw-table-scroll" ref={scrollRef}>
          {items.length === 0 ? (
            <p className="pw-empty">Không có lô đang mở bán.</p>
          ) : (
            items.map((row) => {
              const price = lotPriceDisplay(row);
              return (
                <div
                  key={row.lodatId}
                  role="row"
                  data-list-row-id={row.lodatId}
                  className={
                    selectedId === row.lodatId ? 'pw-grid-row is-selected' : 'pw-grid-row'
                  }
                  onClick={() => onSelect(row.lodatId)}
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
                    <p className="pw-staff">{row.staffName}</p>
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
