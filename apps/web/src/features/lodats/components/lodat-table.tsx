'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { LodatListItem } from '@crmanhung/shared';
import { ColumnFilter } from '@/shared/ui/column-filter';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import {
  ADDRESS_FILTER_OPTIONS,
  KIND_FILTER_OPTIONS,
  PHOTO_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  formatArea,
  formatFrontageDir,
  formatPriceVnd,
  formatUpdatedAt,
  kindLabel,
  kindTone,
  type ExtraFilters,
} from '../display';
import { ActionMenu, type LodatAction } from './action-menu';
import { SaleToggle } from './sale-toggle';
import { SpecsColumnFilter } from './specs-column-filter';

type HeaderFilter = 'photo' | 'address' | 'kind' | 'specs' | 'price' | 'status' | null;

type Props = {
  items: LodatListItem[];
  total: number;
  selectedId: string | null;
  menuId: string | null;
  status: string;
  kind: string;
  extra: ExtraFilters;
  onStatus: (v: string) => void;
  onKind: (v: string) => void;
  onExtra: (next: ExtraFilters) => void;
  onSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (plot: LodatListItem, action: LodatAction) => void;
  togglingId: string | null;
  onToggleSale: (plot: LodatListItem) => void;
};

export function LodatTable({
  items,
  total,
  selectedId,
  menuId,
  status,
  kind,
  extra,
  onStatus,
  onKind,
  onExtra,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onAction,
  togglingId,
  onToggleSale,
}: Props) {
  const [headerFilter, setHeaderFilter] = useState<HeaderFilter>(null);

  function toggleFilter(key: HeaderFilter) {
    setHeaderFilter((cur) => (cur === key ? null : key));
    onCloseMenu();
  }

  return (
    <div className="ld-table-wrap" role="table" aria-label="Danh sách lô đất">
      <div className="ld-table-head" role="rowgroup">
        <div className="ld-grid-row ld-grid-header" role="row">
          <div className="ld-col-head" role="columnheader">
            <span>Ảnh</span>
            <ColumnFilter
              label="Ảnh"
              value={extra.photo}
              options={PHOTO_FILTER_OPTIONS}
              open={headerFilter === 'photo'}
              onToggle={() => toggleFilter('photo')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, photo: v as ExtraFilters['photo'] })}
            />
          </div>
          <div className="ld-col-head" role="columnheader">
            <span>Tiêu đề / Địa chỉ</span>
            <ColumnFilter
              label="Tiêu đề / Địa chỉ"
              value={extra.address}
              options={ADDRESS_FILTER_OPTIONS}
              open={headerFilter === 'address'}
              onToggle={() => toggleFilter('address')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, address: v as ExtraFilters['address'] })}
            />
          </div>
          <div className="ld-col-head" role="columnheader">
            <span>Phân loại</span>
            <ColumnFilter
              label="Phân loại"
              value={kind}
              allValue=""
              options={KIND_FILTER_OPTIONS}
              open={headerFilter === 'kind'}
              onToggle={() => toggleFilter('kind')}
              onClose={() => setHeaderFilter(null)}
              onChange={onKind}
            />
          </div>
          <div className="ld-col-head" role="columnheader">
            <span>DT · MT · Hướng</span>
            <SpecsColumnFilter
              area={extra.area}
              direction={extra.direction}
              open={headerFilter === 'specs'}
              onToggle={() => toggleFilter('specs')}
              onClose={() => setHeaderFilter(null)}
              onChange={({ area, direction }) =>
                onExtra({ ...extra, area, direction })
              }
            />
          </div>
          <div className="ld-col-head" role="columnheader">
            <span>Giá bán</span>
            <ColumnFilter
              label="Giá bán"
              value={extra.price}
              options={PRICE_FILTER_OPTIONS}
              open={headerFilter === 'price'}
              onToggle={() => toggleFilter('price')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, price: v as ExtraFilters['price'] })}
            />
          </div>
          <div className="ld-col-head" role="columnheader">
            <span>Trạng thái</span>
            <ColumnFilter
              label="Trạng thái"
              value={status}
              allValue=""
              options={STATUS_FILTER_OPTIONS}
              open={headerFilter === 'status'}
              onToggle={() => toggleFilter('status')}
              onClose={() => setHeaderFilter(null)}
              onChange={onStatus}
            />
          </div>
          <div role="columnheader">Cập nhật</div>
          <div className="col-act" role="columnheader">
            Thao tác
          </div>
        </div>
      </div>

      <div className="ld-table-scroll" role="rowgroup">
        {items.length === 0 ? (
          <div className="ld-empty" role="row">
            Không có lô đất phù hợp.
          </div>
        ) : (
          items.map((p) => (
            <div
              key={p.id}
              role="row"
              className={[
                'ld-grid-row',
                selectedId === p.id ? 'is-selected' : '',
                menuId === p.id ? 'is-menu-open' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(p.id)}
            >
              <div className="ld-cell" role="cell">
                <div className="ld-thumb">
                  {p.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImageUrl} alt="" />
                  ) : (
                    <span className="ld-thumb-empty" aria-hidden>
                      <Icon icon={ImageOff} size={16} />
                    </span>
                  )}
                  {p.extraPhotoCount > 0 ? (
                    <span className="ld-thumb-more">+{p.extraPhotoCount}</span>
                  ) : null}
                </div>
              </div>
              <div className="ld-cell" role="cell">
                <div className="ld-stack">
                  <strong>{p.title}</strong>
                  <span className="ld-sub">{p.address?.trim() || '—'}</span>
                </div>
              </div>
              <div className="ld-cell" role="cell">
                <CrmBadge tone={kindTone(p.kind)}>{kindLabel(p.kind)}</CrmBadge>
              </div>
              <div className="ld-cell" role="cell">
                <div className="ld-stack">
                  <span>{formatArea(p.areaM2)}</span>
                  <span className="ld-sub">{formatFrontageDir(p.frontageM, p.direction)}</span>
                </div>
              </div>
              <div className="ld-cell" role="cell">
                <div className="ld-stack">
                  <span className="crm-money">{formatPriceVnd(p.priceVnd)}</span>
                  {p.priceNote?.trim() ? (
                    <span className="ld-sub">Ghi chú giá: {p.priceNote}</span>
                  ) : null}
                  {p.commissionPercent != null ? (
                    <span className="ld-sub">Hoa hồng: {p.commissionPercent}%</span>
                  ) : null}
                </div>
              </div>
              <div className="ld-cell" role="cell">
                <SaleToggle
                  title={p.title}
                  status={p.status}
                  busy={togglingId === p.id}
                  onToggle={() => onToggleSale(p)}
                />
              </div>
              <div className="ld-cell ld-updated" role="cell">
                {formatUpdatedAt(p.updatedAt)}
              </div>
              <div
                className="col-act ld-cell"
                role="cell"
                onClick={(e) => e.stopPropagation()}
              >
                <ActionMenu
                  plot={p}
                  open={menuId === p.id}
                  onToggle={() => {
                    setHeaderFilter(null);
                    onToggleMenu(p.id);
                  }}
                  onClose={onCloseMenu}
                  onAction={(a) => onAction(p, a)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="ld-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> lô đất
      </div>
    </div>
  );
}
