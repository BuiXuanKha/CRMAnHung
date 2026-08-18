'use client';

import { ImageOff } from 'lucide-react';
import { LodatSaleStatus, type LodatListItem } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import {
  formatPriceVnd,
  formatSpecsInline,
  kindLabel,
  kindTone,
} from '../display';
import { ActionMenu, type LodatAction } from './action-menu';
import { SaleToggle } from './sale-toggle';

type Props = {
  items: LodatListItem[];
  total: number;
  selectedId: string | null;
  menuId: string | null;
  togglingId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (plot: LodatListItem, action: LodatAction) => void;
  onToggleSale: (plot: LodatListItem) => void;
};

export function LodatCardList({
  items,
  total,
  selectedId,
  menuId,
  togglingId,
  onSelect,
  onOpen,
  onToggleMenu,
  onCloseMenu,
  onAction,
  onToggleSale,
}: Props) {
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
                className={[
                  'ld-card',
                  selectedId === p.id ? 'is-selected' : '',
                  menuId === p.id ? 'is-menu-open' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <header className="ld-card-head">
                  <button
                    type="button"
                    className="ld-card-title"
                    onClick={() => {
                      onSelect(p.id);
                      onOpen(p.id);
                    }}
                  >
                    <strong>{p.title}</strong>
                    <CrmBadge tone={kindTone(p.kind)}>{kindLabel(p.kind)}</CrmBadge>
                  </button>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      plot={p}
                      open={menuId === p.id}
                      onToggle={() => onToggleMenu(p.id)}
                      onClose={onCloseMenu}
                      onAction={(a) => onAction(p, a)}
                    />
                  </div>
                </header>

                <div
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
                    <CrmBadge
                      tone={open ? 'green' : 'gray'}
                      className="ld-card-status"
                    >
                      {open ? 'Mở bán' : 'Tạm dừng'}
                    </CrmBadge>
                    {p.extraPhotoCount > 0 ? (
                      <span className="ld-thumb-more">+{p.extraPhotoCount}</span>
                    ) : null}
                  </div>
                  <div className="ld-card-meta">
                    <span className="ld-sub">{p.address?.trim() || '—'}</span>
                    <span className="crm-money">{formatPriceVnd(p.priceVnd)}</span>
                    {p.priceNote?.trim() ? (
                      <span className="ld-sub">Ghi chú giá: {p.priceNote}</span>
                    ) : null}
                    {p.commissionPercent != null ? (
                      <span className="ld-sub">Hoa hồng: {p.commissionPercent}%</span>
                    ) : null}
                    <span className="ld-card-specs">{formatSpecsInline(p)}</span>
                  </div>
                </div>

                <footer className="ld-card-foot">
                  <SaleToggle
                    title={p.title}
                    status={p.status}
                    busy={togglingId === p.id}
                    onToggle={() => onToggleSale(p)}
                  />
                </footer>
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
