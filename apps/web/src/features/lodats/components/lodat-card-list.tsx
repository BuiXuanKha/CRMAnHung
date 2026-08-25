'use client';

import type { Ref } from 'react';
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
  onOpenGallery: (plot: LodatListItem) => void;
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: () => void;
};

export function LodatCardList({
  items,
  total,
  selectedId,
  onSelect,
  onOpen,
  onOpenGallery,
  scrollRef,
  onScroll,
}: Props) {
  return (
    <div className="ld-cards-shell">
      <div
        className="ld-cards"
        role="list"
        aria-label="Danh sách lô đất"
        ref={scrollRef}
        onScroll={onScroll}
      >
        {items.length === 0 ? (
          <p className="ld-empty">Không có lô đất phù hợp.</p>
        ) : (
          items.map((p) => {
            const open = p.status === LodatSaleStatus.DANG_BAN;
            function openCard() {
              onSelect(p.id);
              onOpen(p.id);
            }
            return (
              <article
                key={p.id}
                role="listitem"
                data-list-row-id={p.id}
                className={['ld-card', selectedId === p.id ? 'is-selected' : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={openCard}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCard();
                  }
                }}
                tabIndex={0}
              >
                <header className="ld-card-title">
                  <strong>{p.title}</strong>
                </header>
                <div className="ld-card-body">
                  <button
                    type="button"
                    className={[
                      'ld-card-thumb',
                      p.coverImageUrl ? 'is-clickable' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label={
                      p.coverImageUrl
                        ? `Xem ảnh «${p.title}»`
                        : `«${p.title}» chưa có ảnh`
                    }
                    disabled={!p.coverImageUrl}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (p.coverImageUrl) onOpenGallery(p);
                    }}
                  >
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
                  </button>
                  <div className="ld-card-meta">
                    <span className="ld-card-address">{p.address?.trim() || '—'}</span>
                    <span className="crm-money">{formatPriceVnd(p.priceVnd)}</span>
                    <span className="ld-card-specs">{formatSpecsInline(p)}</span>
                  </div>
                </div>
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
