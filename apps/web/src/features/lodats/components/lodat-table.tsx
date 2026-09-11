'use client';

import { useState, type Ref } from 'react';
import { CircleAlert, ImageOff, Sparkles } from 'lucide-react';
import type { LodatListItem, LodatListingStatus } from '@crmanhung/shared';
import { LodatSaleStatus } from '@crmanhung/shared';
import { ColumnFilter } from '@/shared/ui/column-filter';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import {
  ADDRESS_FILTER_OPTIONS,
  KIND_FILTER_OPTIONS,
  PHOTO_FILTER_OPTIONS,
  PRICE_BRACKET_OPTIONS,
  STATUS_COL_FILTER_OPTIONS,
  WEB_BODY_FILTER_OPTIONS,
  formatArea,
  formatBrokerFee,
  formatFrontageDir,
  formatPriceVnd,
  kindLabel,
  kindTone,
  lodatWebBodyLabel,
  lodatWebBodyTone,
  type ExtraFilters,
  type PriceBracket,
  type StatusColFilter,
  type StatusColFilters,
} from '../display';
import { ActionMenu, type LodatAction } from './action-menu';
import {
  SALE_STATUS_TRIAD_COLUMNS,
  SaleStatusCell,
} from './sale-status-cell';
import { SpecsColumnFilter } from './specs-column-filter';

type HeaderFilter =
  | 'photo'
  | 'address'
  | 'kind'
  | 'specs'
  | 'price'
  | 'web'
  | 'status-open'
  | 'status-paused'
  | 'status-off'
  | null;

const STATUS_COL_BY_SALE: Record<
  (typeof SALE_STATUS_TRIAD_COLUMNS)[number]['status'],
  keyof StatusColFilters
> = {
  [LodatSaleStatus.DANG_BAN]: 'open',
  [LodatSaleStatus.TAM_DUNG]: 'paused',
  [LodatSaleStatus.KHONG_BAN]: 'off',
};

const STATUS_HEADER_KEY: Record<keyof StatusColFilters, HeaderFilter> = {
  open: 'status-open',
  paused: 'status-paused',
  off: 'status-off',
};

function BrokerFeeLine({ plot }: { plot: LodatListItem }) {
  const fee = formatBrokerFee(plot.brokerFeeNote, plot.commissionPercent);
  if (!fee) return null;
  return <span className="ld-sub">Hoa hồng: {fee}</span>;
}

type Props = {
  items: LodatListItem[];
  total: number;
  selectedId: string | null;
  menuId: string | null;
  statusCols: StatusColFilters;
  kind: string;
  extra: ExtraFilters;
  priceBracket: PriceBracket;
  onStatusCols: (next: StatusColFilters) => void;
  onKind: (v: string) => void;
  onExtra: (next: ExtraFilters) => void;
  onPriceBracket: (v: PriceBracket) => void;
  onSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (plot: LodatListItem, action: LodatAction) => void;
  togglingId: string | null;
  onSetSaleStatus: (
    plot: LodatListItem,
    next: LodatListingStatus,
  ) => void;
  onOpenGallery: (plot: LodatListItem) => void;
  onGptContent: (plot: LodatListItem) => void;
  onComposeListing?: (plot: LodatListItem) => void;
  onNeedsWebUpdate?: (plot: LodatListItem) => void;
  loadingMore?: boolean;
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: () => void;
};

export function LodatTable({
  items,
  total,
  selectedId,
  menuId,
  statusCols,
  kind,
  extra,
  priceBracket,
  onStatusCols,
  onKind,
  onExtra,
  onPriceBracket,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onAction,
  togglingId,
  onSetSaleStatus,
  onOpenGallery,
  onGptContent,
  onComposeListing,
  onNeedsWebUpdate,
  loadingMore = false,
  scrollRef,
  onScroll,
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
              value={priceBracket}
              allValue=""
              options={[...PRICE_BRACKET_OPTIONS]}
              open={headerFilter === 'price'}
              onToggle={() => toggleFilter('price')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onPriceBracket(v as PriceBracket)}
            />
          </div>
          <div className="ld-col-head" role="columnheader">
            <span>Web</span>
            <ColumnFilter
              label="Web"
              value={extra.webBody}
              options={WEB_BODY_FILTER_OPTIONS}
              open={headerFilter === 'web'}
              onToggle={() => toggleFilter('web')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) =>
                onExtra({ ...extra, webBody: v as ExtraFilters['webBody'] })
              }
            />
          </div>
          <div className="ld-col-head" role="columnheader">
            <span title="Tạo content bằng AI GPT">AI GPT</span>
          </div>
          {SALE_STATUS_TRIAD_COLUMNS.map((col) => {
            const colKey = STATUS_COL_BY_SALE[col.status];
            const filterKey = STATUS_HEADER_KEY[colKey];
            const colValue = statusCols[colKey];
            return (
              <div
                key={col.status}
                className="ld-col-head is-status-triad"
                role="columnheader"
              >
                <span>{col.label}</span>
                <ColumnFilter
                  label={col.label}
                  value={colValue}
                  allValue="all"
                  options={STATUS_COL_FILTER_OPTIONS[colKey]}
                  open={headerFilter === filterKey}
                  onToggle={() => toggleFilter(filterKey)}
                  onClose={() => setHeaderFilter(null)}
                  onChange={(v) =>
                    onStatusCols({
                      ...statusCols,
                      [colKey]: v as StatusColFilter,
                    })
                  }
                />
              </div>
            );
          })}
          <div className="col-act" role="columnheader">
            Thao tác
          </div>
        </div>
      </div>

      <div
        className="ld-table-scroll"
        role="rowgroup"
        ref={scrollRef}
        onScroll={onScroll}
      >
        {items.length === 0 ? (
          <div className="ld-empty" role="row">
            Không có lô đất phù hợp.
          </div>
        ) : (
          items.map((p) => (
            <div
              key={p.id}
              role="row"
              data-list-row-id={p.id}
              className={[
                'ld-grid-row',
                selectedId === p.id ? 'is-selected' : '',
                menuId === p.id ? 'is-menu-open' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(p.id)}
              onDoubleClick={() => onComposeListing?.(p)}
            >
              <div className="ld-cell" role="cell">
                <button
                  type="button"
                  className={['ld-thumb', p.coverImageUrl ? 'is-clickable' : '']
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
                  {p.extraPhotoCount > 0 ? (
                    <span className="ld-thumb-more">+{p.extraPhotoCount}</span>
                  ) : null}
                </button>
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
                  <BrokerFeeLine plot={p} />
                </div>
              </div>
              <div className="ld-cell ld-cell-web" role="cell">
                <div className="ld-web-row">
                  <CrmBadge tone={lodatWebBodyTone(Boolean(p.hasWebBody))}>
                    {lodatWebBodyLabel(Boolean(p.hasWebBody))}
                  </CrmBadge>
                  {p.needsWebUpdate ? (
                    <button
                      type="button"
                      className="ld-web-drift-btn"
                      title="Lô CRM đã cập nhật — cần cập nhật bài web"
                      aria-label="Lô CRM đã cập nhật, cần cập nhật bài đăng web"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNeedsWebUpdate?.(p);
                      }}
                    >
                      <Icon icon={CircleAlert} size={14} />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="ld-cell ld-cell-gpt" role="cell" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="ld-gpt-btn"
                  title="Tạo content bằng AI GPT"
                  onClick={() => onGptContent(p)}
                >
                  <Icon icon={Sparkles} size={14} />
                  GPT
                </button>
              </div>
              {SALE_STATUS_TRIAD_COLUMNS.map((col) => (
                <div key={col.status} className="ld-cell ld-cell-status" role="cell">
                  <SaleStatusCell
                    title={p.title}
                    target={col.status}
                    current={p.status}
                    busy={togglingId === p.id}
                    onSelect={(next) => onSetSaleStatus(p, next)}
                  />
                </div>
              ))}
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
        {items.length < total ? (
          <>
            Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> lô đất
            {loadingMore ? ' — Đang tải thêm…' : ''}
          </>
        ) : (
          <>
            Tổng <strong>{total}</strong> lô đất
          </>
        )}
      </div>
    </div>
  );
}
