'use client';

import { useEffect, useRef, useState, type Ref } from 'react';
import { Check, Map, Pencil, Phone } from 'lucide-react';
import type { CustomerListItem } from '@crmanhung/shared';
import { ColumnFilter, type ColumnFilterOption } from '@/shared/ui/column-filter';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import {
  DEMAND_FILTER_OPTIONS,
  FINANCE_FILTER_OPTIONS,
  LODAT_FILTER_OPTIONS,
  NAME_FILTER_OPTIONS,
  channelLabel,
  demandLabel,
  formatBudget,
  initials,
  statusLabel,
  statusTone,
  type ExtraFilters,
} from '../display';
import { ActionMenu, type CustomerAction } from './action-menu';

type HeaderFilter = 'name' | 'demand' | 'finance' | 'channel' | 'lodat' | null;

type Props = {
  items: CustomerListItem[];
  total: number;
  loadingMore?: boolean;
  selectedId: string | null;
  menuId: string | null;
  status: string;
  extra: ExtraFilters;
  onStatus: (v: string) => void;
  onExtra: (next: ExtraFilters) => void;
  onSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (customer: CustomerListItem, action: CustomerAction) => void;
  onCare?: (customer: CustomerListItem) => void;
  onAddPhone?: (customer: CustomerListItem) => void;
  onRename?: (customer: CustomerListItem) => void;
  channelOptions: ColumnFilterOption[];
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: () => void;
};

export function CustomerTable({
  items,
  total,
  loadingMore = false,
  selectedId,
  menuId,
  status,
  extra,
  onStatus,
  onExtra,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onAction,
  onCare,
  onAddPhone,
  onRename,
  channelOptions,
  scrollRef,
  onScroll,
}: Props) {
  const [headerFilter, setHeaderFilter] = useState<HeaderFilter>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    },
    [],
  );

  function toggleFilter(key: HeaderFilter) {
    setHeaderFilter((cur) => (cur === key ? null : key));
    onCloseMenu();
  }

  async function copyPhone(phone: string, id: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(phone);
      } else {
        const el = document.createElement('textarea');
        el.value = phone;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedId(id);
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore copy failures */
    }
  }

  return (
    <div className="kh-table-wrap" role="table" aria-label="Danh sách khách hàng">
      <div className="kh-table-head" role="rowgroup">
        <div className="kh-grid-row kh-grid-header" role="row">
          <div className="col-idx" role="columnheader">
            #
          </div>
          <div className="kh-col-head" role="columnheader">
            <span>Tên khách</span>
            <ColumnFilter
              label="Tên khách"
              value={status}
              allValue=""
              options={NAME_FILTER_OPTIONS}
              open={headerFilter === 'name'}
              onToggle={() => toggleFilter('name')}
              onClose={() => setHeaderFilter(null)}
              onChange={onStatus}
            />
            <ColumnFilter
              label="Lô đất"
              value={extra.lodat}
              options={LODAT_FILTER_OPTIONS}
              open={headerFilter === 'lodat'}
              onToggle={() => toggleFilter('lodat')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, lodat: v as ExtraFilters['lodat'] })}
            />
          </div>
          <div className="kh-col-head" role="columnheader">
            <span>Nhu cầu</span>
            <ColumnFilter
              label="Nhu cầu"
              value={extra.demand}
              options={DEMAND_FILTER_OPTIONS}
              open={headerFilter === 'demand'}
              onToggle={() => toggleFilter('demand')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, demand: v as ExtraFilters['demand'] })}
            />
          </div>
          <div className="kh-col-head" role="columnheader">
            <span>Tài chính</span>
            <ColumnFilter
              label="Tài chính"
              value={extra.finance}
              options={FINANCE_FILTER_OPTIONS}
              open={headerFilter === 'finance'}
              onToggle={() => toggleFilter('finance')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, finance: v as ExtraFilters['finance'] })}
            />
          </div>
          <div className="kh-col-head" role="columnheader">
            <span>Kênh liên hệ</span>
            <ColumnFilter
              label="Kênh liên hệ"
              value={extra.channel}
              options={[{ value: 'all', label: 'Tất cả kênh liên hệ' }, ...channelOptions]}
              open={headerFilter === 'channel'}
              onToggle={() => toggleFilter('channel')}
              onClose={() => setHeaderFilter(null)}
              onChange={(v) => onExtra({ ...extra, channel: v as ExtraFilters['channel'] })}
            />
          </div>
          <div className="col-act" role="columnheader">
            Thao tác
          </div>
        </div>
      </div>

      <div
        className="kh-table-scroll"
        role="rowgroup"
        ref={scrollRef}
        onScroll={onScroll}
      >
        {items.length === 0 ? (
          <div className="kh-empty" role="row">
            Không có khách hàng phù hợp.
          </div>
        ) : (
          items.map((c, i) => (
            <div
              key={c.id}
              role="row"
              data-list-row-id={c.id}
              className={[
                'kh-grid-row',
                c.isPinned ? 'is-hot' : '',
                selectedId === c.id ? 'is-selected' : '',
                c.isHidden ? 'is-hidden' : '',
                menuId === c.id ? 'is-menu-open' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(c.id)}
              onDoubleClick={(event) => {
                const target = event.target as HTMLElement | null;
                if (target?.closest('button, a, [role="menu"]')) return;
                if (c.isHidden) return;
                onCare?.(c);
              }}
            >
              <div className="col-idx kh-cell" role="cell">
                {i + 1}
              </div>
              <div className="kh-cell" role="cell">
                <div className="kh-name">
                  <span className="kh-avatar" aria-hidden>
                    {c.facebook?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.facebook.avatarUrl} alt="" />
                    ) : (
                      initials(c.fullName)
                    )}
                  </span>
                  <div className="kh-name-text">
                    <div className="kh-name-row">
                      <strong>{c.fullName}</strong>
                      <button
                        type="button"
                        className="kh-mini-icon rename"
                        title="Sửa tên khách"
                        aria-label={`Sửa tên ${c.fullName}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onRename?.(c);
                        }}
                      >
                        <Icon icon={Pencil} size="mini" />
                      </button>
                      {c.primaryPhone ? (
                        <button
                          type="button"
                          className="kh-mini-icon phone"
                          title={
                            copiedId === c.id
                              ? 'Đã copy số điện thoại'
                              : `Copy ${c.primaryPhone}`
                          }
                          aria-label={
                            copiedId === c.id
                              ? 'Đã copy số điện thoại'
                              : `Copy số điện thoại ${c.primaryPhone}`
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            const phone = c.primaryPhone;
                            if (phone) void copyPhone(phone, c.id);
                          }}
                        >
                          <Icon icon={copiedId === c.id ? Check : Phone} size="mini" />
                        </button>
                      ) : !c.isHidden ? (
                        <button
                          type="button"
                          className="kh-mini-icon phone-add"
                          title="Thêm số điện thoại"
                          aria-label={`Thêm số điện thoại cho ${c.fullName}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onAddPhone?.(c);
                          }}
                        >
                          <Icon icon={Phone} size="mini" />
                        </button>
                      ) : null}
                      {c.lodatCount > 0 ? (
                        <span
                          className="kh-mini-icon lodat"
                          title={`${c.lodatCount} lô đất`}
                          aria-label={`${c.lodatCount} lô đất`}
                        >
                          <Icon icon={Map} size="mini" />
                          <span className="kh-lodat-count">{c.lodatCount}</span>
                        </span>
                      ) : null}
                    </div>
                    <div className="kh-hangtags">
                      <CrmBadge tone={statusTone(c.status)}>{statusLabel(c.status)}</CrmBadge>
                      {c.isHidden ? (
                        <CrmBadge tone="red">Đã xoá</CrmBadge>
                      ) : null}
                    </div>
                    {c.facebook?.facebookName ? (
                      <span className="kh-sub">{c.facebook.facebookName}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="kh-cell" role="cell">
                <span className="kh-demand">{demandLabel(c)}</span>
              </div>
              <div className="kh-cell" role="cell">
                <span className="kh-budget crm-money">{formatBudget(c.budgetMinVnd, c.budgetMaxVnd)}</span>
              </div>
              <div className="kh-cell" role="cell">
                <span className="kh-channel">{channelLabel(c)}</span>
              </div>
              <div
                className="col-act kh-cell"
                role="cell"
                onClick={(e) => e.stopPropagation()}
              >
                <ActionMenu
                  customer={c}
                  open={menuId === c.id}
                  onToggle={() => {
                    setHeaderFilter(null);
                    onToggleMenu(c.id);
                  }}
                  onClose={onCloseMenu}
                  onAction={(a) => onAction(c, a)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="kh-table-foot">
        {items.length < total ? (
          <>
            Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> khách hàng
            {loadingMore ? ' — Đang tải thêm…' : ''}
          </>
        ) : (
          <>
            Tổng <strong>{total}</strong> khách hàng
          </>
        )}
      </div>
    </div>
  );
}
