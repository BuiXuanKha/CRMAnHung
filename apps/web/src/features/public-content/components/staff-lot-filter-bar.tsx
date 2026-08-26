'use client';

import { useRef } from 'react';
import { CrmSearchField } from '@/shared/ui/search-field';
import {
  KIND_FILTER_OPTIONS,
  PRICE_BRACKET_OPTIONS,
  type PriceBracket,
} from '@/features/lodats/display';
import { WEB_FILTER_OPTIONS, type StaffLotWebFilter } from '../display';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  kind: string;
  onKind: (v: string) => void;
  priceBracket: PriceBracket;
  onPriceBracket: (v: PriceBracket) => void;
  web: StaffLotWebFilter;
  onWeb: (v: StaffLotWebFilter) => void;
  staffName: string;
  staffOptions: { value: string; label: string }[];
  onStaffName: (v: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

export function StaffLotFilterBar({
  keyword,
  onKeyword,
  filtersOpen,
  onToggleFilters,
  kind,
  onKind,
  priceBracket,
  onPriceBracket,
  web,
  onWeb,
  staffName,
  staffOptions,
  onStaffName,
  hasActiveFilters,
  onResetFilters,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  function submitSearch() {
    searchRef.current?.blur();
  }

  return (
    <div className="pw-filter">
      <div className="pw-search-wrap">
        <CrmSearchField
          ref={searchRef}
          className="pw-search"
          value={keyword}
          onValueChange={onKeyword}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          placeholder="Tìm tiêu đề, địa chỉ, nhân viên..."
          aria-label="Tìm lô đang mở bán"
        />
      </div>
      <button
        type="button"
        className={['pw-filter-btn', filtersOpen ? 'is-open' : '', hasActiveFilters ? 'is-active' : '']
          .filter(Boolean)
          .join(' ')}
        aria-expanded={filtersOpen}
        aria-controls="staff-lot-filter-advanced"
        onClick={onToggleFilters}
      >
        Bộ lọc
      </button>
      <button type="button" className="pw-search-btn" onClick={submitSearch}>
        Tìm
      </button>
      <div
        id="staff-lot-filter-advanced"
        className={['pw-filter-advanced', filtersOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
      >
        <select
          className="pw-filter-select"
          value={kind}
          onChange={(e) => onKind(e.target.value)}
          aria-label="Lọc theo phân loại"
        >
          {KIND_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="pw-filter-select"
          value={priceBracket}
          onChange={(e) => onPriceBracket(e.target.value as PriceBracket)}
          aria-label="Lọc theo khoảng giá"
        >
          {PRICE_BRACKET_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="pw-filter-select"
          value={web}
          onChange={(e) => onWeb(e.target.value as StaffLotWebFilter)}
          aria-label="Lọc theo trạng thái web"
        >
          {WEB_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="pw-filter-select"
          value={staffName}
          onChange={(e) => onStaffName(e.target.value)}
          aria-label="Lọc theo nhân viên"
        >
          {staffOptions.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasActiveFilters ? (
          <button type="button" className="pw-filter-clear" onClick={onResetFilters}>
            Xoá lọc
          </button>
        ) : null}
      </div>
    </div>
  );
}
