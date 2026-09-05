'use client';

import { useRef } from 'react';
import type { ColumnFilterOption } from '@/shared/ui/column-filter';
import { Plus } from 'lucide-react';
import { Icon } from '@/shared/ui/icon';
import { CrmSearchField } from '@/shared/ui/search-field';
import {
  CHANNEL_ALL_OPTION,
  DEMAND_FILTER_OPTIONS,
  FINANCE_FILTER_OPTIONS,
  LODAT_FILTER_OPTIONS,
  NAME_FILTER_OPTIONS,
  type ExtraFilters,
} from '../display';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  onAdd: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  status: string;
  onStatus: (v: string) => void;
  extra: ExtraFilters;
  onExtra: (next: ExtraFilters) => void;
  channelOptions: ColumnFilterOption[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

export function FilterBar({
  keyword,
  onKeyword,
  onAdd,
  filtersOpen,
  onToggleFilters,
  status,
  onStatus,
  extra,
  onExtra,
  channelOptions,
  hasActiveFilters,
  onResetFilters,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const includeHidden = keyword.trim().startsWith('@');

  function submitSearch() {
    searchRef.current?.blur();
  }

  return (
    <div className="kh-filter">
      <div className="kh-search-wrap">
        <CrmSearchField
          ref={searchRef}
          className={['kh-search', includeHidden ? 'is-at-mode' : ''].filter(Boolean).join(' ')}
          value={keyword}
          onValueChange={onKeyword}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          placeholder="Tìm tên, SĐT, Facebook, UID, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)"
          aria-label="Tìm khách hàng"
        />
      </div>
      <button
        type="button"
        className={['kh-filter-btn', filtersOpen ? 'is-open' : '', hasActiveFilters ? 'is-active' : '']
          .filter(Boolean)
          .join(' ')}
        aria-expanded={filtersOpen}
        aria-controls="customer-filter-advanced"
        onClick={onToggleFilters}
      >
        Bộ lọc
      </button>
      <button type="button" className="kh-search-btn" onClick={submitSearch}>
        Tìm
      </button>
      <button type="button" className="kh-add" onClick={onAdd}>
        <Icon icon={Plus} size="sm" /> Thêm khách hàng bằng số điện thoại
      </button>
      <div
        id="customer-filter-advanced"
        className={['kh-filter-advanced', filtersOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
      >
        <select
          className="kh-filter-select"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          aria-label="Lọc theo trạng thái"
        >
          {NAME_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="kh-filter-select"
          value={extra.finance}
          onChange={(e) => onExtra({ ...extra, finance: e.target.value as ExtraFilters['finance'] })}
          aria-label="Lọc theo tài chính"
        >
          {FINANCE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="kh-filter-select"
          value={extra.channel}
          onChange={(e) => onExtra({ ...extra, channel: e.target.value as ExtraFilters['channel'] })}
          aria-label="Lọc theo kênh liên hệ"
        >
          { [CHANNEL_ALL_OPTION, ...channelOptions].map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="kh-filter-select"
          value={extra.lodat}
          onChange={(e) => onExtra({ ...extra, lodat: e.target.value as ExtraFilters['lodat'] })}
          aria-label="Lọc theo lô đất"
        >
          {LODAT_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="kh-filter-select"
          value={extra.demand}
          onChange={(e) => onExtra({ ...extra, demand: e.target.value as ExtraFilters['demand'] })}
          aria-label="Lọc theo nhu cầu"
        >
          {DEMAND_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasActiveFilters ? (
          <button type="button" className="kh-filter-clear" onClick={onResetFilters}>
            Xoá lọc
          </button>
        ) : null}
      </div>
    </div>
  );
}
