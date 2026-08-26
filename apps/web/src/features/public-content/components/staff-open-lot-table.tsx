'use client';

import { ImageOff } from 'lucide-react';
import { useState, type Ref } from 'react';
import type { PublicWebStaffLotRow } from '@crmanhung/shared';
import {
  ADDRESS_FILTER_OPTIONS,
  KIND_FILTER_OPTIONS,
  PHOTO_FILTER_OPTIONS,
  PRICE_BRACKET_OPTIONS,
  formatArea,
  formatFrontageDir,
  kindLabel,
  kindTone,
  type ExtraFilters,
  type PriceBracket,
} from '@/features/lodats/display';
import { SpecsColumnFilter } from '@/features/lodats/components/specs-column-filter';
import { ColumnFilter } from '@/shared/ui/column-filter';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import '@/shared/ui/column-filter.css';
import { WEB_FILTER_OPTIONS, lotPriceDisplay, lotWebLabel, lotWebTone } from '../display';

type HeaderFilter = 'photo' | 'address' | 'kind' | 'specs' | 'price' | 'staff' | 'web' | null;

type Props = {
  items: PublicWebStaffLotRow[];
  total: number;
  selectedId: string | null;
  onSelect: (lodatId: string) => void;
  scrollRef?: Ref<HTMLDivElement>;
  kind: string;
  extra: ExtraFilters;
  priceBracket: PriceBracket;
  staffName: string;
  staffOptions: { value: string; label: string }[];
  web: (typeof WEB_FILTER_OPTIONS)[number]['value'];
  onKind: (v: string) => void;
  onExtra: (next: ExtraFilters) => void;
  onPriceBracket: (v: PriceBracket) => void;
  onStaffName: (v: string) => void;
  onWeb: (v: (typeof WEB_FILTER_OPTIONS)[number]['value']) => void;
};

export function StaffOpenLotTable({
  items,
  total,
  selectedId,
  onSelect,
  scrollRef,
  kind,
  extra,
  priceBracket,
  staffName,
  staffOptions,
  web,
  onKind,
  onExtra,
  onPriceBracket,
  onStaffName,
  onWeb,
}: Props) {
  const [headerFilter, setHeaderFilter] = useState<HeaderFilter>(null);

  function toggleFilter(key: HeaderFilter) {
    setHeaderFilter((cur) => (cur === key ? null : key));
  }

  return (
    <section className="pw-table-shell" aria-label="Lô nhân viên đang mở bán">
      <div className="pw-table-wrap pw-table-wrap--staff-lot">
        <div className="pw-table-head">
          <div className="pw-grid-row pw-grid-header" role="row">
            <div className="pw-col-head" role="columnheader">
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
            <div className="pw-col-head" role="columnheader">
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
            <div className="pw-col-head" role="columnheader">
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
            <div className="pw-col-head" role="columnheader">
              <span>DT · MT · Hướng</span>
              <SpecsColumnFilter
                area={extra.area}
                direction={extra.direction}
                open={headerFilter === 'specs'}
                onToggle={() => toggleFilter('specs')}
                onClose={() => setHeaderFilter(null)}
                onChange={({ area, direction }) => onExtra({ ...extra, area, direction })}
              />
            </div>
            <div className="pw-col-head" role="columnheader">
              <span>Giá</span>
              <ColumnFilter
                label="Giá"
                value={priceBracket}
                allValue=""
                options={[...PRICE_BRACKET_OPTIONS]}
                open={headerFilter === 'price'}
                onToggle={() => toggleFilter('price')}
                onClose={() => setHeaderFilter(null)}
                onChange={(v) => onPriceBracket(v as PriceBracket)}
              />
            </div>
            <div className="pw-col-head" role="columnheader">
              <span>NV</span>
              <ColumnFilter
                label="NV"
                value={staffName}
                allValue=""
                options={staffOptions}
                open={headerFilter === 'staff'}
                onToggle={() => toggleFilter('staff')}
                onClose={() => setHeaderFilter(null)}
                onChange={onStaffName}
              />
            </div>
            <div className="pw-col-head" role="columnheader">
              <span>Web</span>
              <ColumnFilter
                label="Web"
                value={web}
                options={WEB_FILTER_OPTIONS}
                open={headerFilter === 'web'}
                onToggle={() => toggleFilter('web')}
                onClose={() => setHeaderFilter(null)}
                onChange={(v) => onWeb(v as (typeof WEB_FILTER_OPTIONS)[number]['value'])}
              />
            </div>
          </div>
        </div>
        <div className="pw-table-scroll" ref={scrollRef}>
          {items.length === 0 ? (
            <p className="pw-empty">Không có lô đất phù hợp.</p>
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
                    <CrmBadge tone={kindTone(row.kind)}>{kindLabel(row.kind)}</CrmBadge>
                  </div>
                  <div>
                    <span>{formatArea(row.areaM2)}</span>
                    <span className="pw-sub">{formatFrontageDir(row.frontageM, row.direction)}</span>
                  </div>
                  <div>
                    {price.isMoney ? (
                      <span className="crm-money">{price.text}</span>
                    ) : (
                      <span className="pw-contact">{price.text}</span>
                    )}
                  </div>
                  <div>
                    <p className="pw-staff">{row.staffName}</p>
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
