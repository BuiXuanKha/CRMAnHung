'use client';

import { useRef } from 'react';
import { CrmSearchField } from '@/shared/ui/search-field';
import {
  PRICE_BRACKET_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type PriceBracket,
} from '../display';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  status: string;
  onStatus: (v: string) => void;
  priceBracket: PriceBracket;
  onPriceBracket: (v: PriceBracket) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

export function FilterBar({
  keyword,
  onKeyword,
  filtersOpen,
  onToggleFilters,
  status,
  onStatus,
  priceBracket,
  onPriceBracket,
  hasActiveFilters,
  onResetFilters,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const includePaused = keyword.trim().startsWith('@');
  const pausedOnly = keyword.trim().startsWith('@@');

  function submitSearch() {
    searchRef.current?.blur();
  }

  return (
    <div className="ld-filter">
      <div className="ld-search-wrap">
        <CrmSearchField
          ref={searchRef}
          className={['ld-search', includePaused ? 'is-at-mode' : ''].filter(Boolean).join(' ')}
          value={keyword}
          onValueChange={onKeyword}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          placeholder="Tìm lô, địa chỉ, khách... (@ cả tạm dừng)"
          aria-label="Tìm lô đất"
        />
        {includePaused ? (
          <span className="ld-at-badge">
            {pausedOnly ? '@ Chỉ tạm dừng' : '@ Cả tạm dừng'}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className={['ld-filter-btn', filtersOpen ? 'is-open' : '', hasActiveFilters ? 'is-active' : '']
          .filter(Boolean)
          .join(' ')}
        aria-expanded={filtersOpen}
        aria-controls="lodat-filter-advanced"
        onClick={onToggleFilters}
      >
        Bộ lọc
      </button>
      <button type="button" className="ld-search-btn" onClick={submitSearch}>
        Tìm
      </button>
      <div
        id="lodat-filter-advanced"
        className={['ld-filter-advanced', filtersOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
      >
        <select
          className="ld-filter-select"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          aria-label="Lọc theo trạng thái"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="ld-filter-select"
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
        {hasActiveFilters ? (
          <button type="button" className="ld-filter-clear" onClick={onResetFilters}>
            Xoá lọc
          </button>
        ) : null}
      </div>
    </div>
  );
}
