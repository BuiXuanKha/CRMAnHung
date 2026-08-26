import { ImageOff } from 'lucide-react';
import type { PublicWebStaffLotRow } from '@crmanhung/shared';
import { formatArea, formatFrontageDir, kindLabel, kindTone } from '@/features/lodats/display';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import { lotPriceDisplay, lotWebLabel, lotWebTone } from '../display';

type Props = {
  items: PublicWebStaffLotRow[];
  total: number;
  selectedId: string | null;
  onSelect: (lodatId: string) => void;
};

export function StaffOpenLotCards({ items, total, selectedId, onSelect }: Props) {
  return (
    <section className="pw-cards" aria-label="Lô nhân viên đang mở bán">
      {items.length === 0 ? (
        <p className="pw-empty">Không có lô đang mở bán.</p>
      ) : (
        <ul className="pw-card-list">
          {items.map((row) => {
            const price = lotPriceDisplay(row);
            return (
              <li key={row.lodatId} data-list-row-id={row.lodatId}>
                <button
                  type="button"
                  className={selectedId === row.lodatId ? 'pw-card is-selected' : 'pw-card'}
                  onClick={() => onSelect(row.lodatId)}
                >
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
                    <span className="pw-card-meta">
                      <CrmBadge tone={kindTone(row.kind)}>{kindLabel(row.kind)}</CrmBadge>
                      <span className="pw-sub">
                        {formatArea(row.areaM2)} · {formatFrontageDir(row.frontageM, row.direction)}
                      </span>
                    </span>
                    <span className="pw-staff">{row.staffName}</span>
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
