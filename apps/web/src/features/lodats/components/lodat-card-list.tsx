'use client';

import { ImageOff } from 'lucide-react';
import { LodatSaleStatus, type LodatListItem } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import { formatPriceVnd, formatSpecsInline } from '../display';

type Props = {
  items: LodatListItem[];
  total: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
};

export function LodatCardList({ items, total, selectedId, onSelect, onOpen }: Props) {
  return (
    <div className="ld-cards-shell">
      <div className="ld-cards" role="list" aria-label="Danh sách lô đất">
        {items.length === 0 ? (
          <p className="ld-empty">Không có lô đất phù hợp.</p>
        ) : (
          items.map((p) => {
            const open = p.status === LodatSaleStatus.DANG_BAN;
            return (
              <article
                key={p.id}
                role="listitem"
                className={['ld-card', selectedId === p.id ? 'is-selected' : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <button
                  type="button"
                  className="ld-card-title"
                  onClick={() => {
                    onSelect(p.id);
                    onOpen(p.id);
                  }}
                >
                  <strong>{p.title}</strong>
                </button>
                <button
                  type="button"
                  className="ld-card-body"
                  onClick={() => {
                    onSelect(p.id);
                    onOpen(p.id);
                  }}
                >
                  <div className="ld-card-thumb">
                    {p.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImageUrl} alt="" />
                    ) : (
                      <span className="ld-thumb-empty" aria-hidden>
                        <Icon icon={ImageOff} size={16} />
                      </span>
                    )}
                    <CrmBadge tone={open ? 'green' : 'gray'} className="ld-card-status">
                      {open ? 'Mở bán' : 'Tạm dừng'}
                    </CrmBadge>
                    {p.extraPhotoCount > 0 ? (
                      <span className="ld-thumb-more">+{p.extraPhotoCount}</span>
                    ) : null}
                  </div>
                  <div className="ld-card-meta">
                    <span className="ld-card-address">{p.address?.trim() || '—'}</span>
                    <span className="crm-money">{formatPriceVnd(p.priceVnd)}</span>
                    <span className="ld-card-specs">{formatSpecsInline(p)}</span>
                  </div>
                </button>
              </article>
            );
          })
        )}
      </div>
      <div className="ld-cards-count">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> lô đất
      </div>
    </div>
  );
}
