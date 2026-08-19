'use client';

import { useRef } from 'react';
import { STATUS_FILTER_OPTIONS, TYPE_FILTER_OPTIONS } from '../display';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  type: string;
  onType: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

export function FilterBar({
  keyword,
  onKeyword,
  filtersOpen,
  onToggleFilters,
  type,
  onType,
  status,
  onStatus,
  hasActiveFilters,
  onResetFilters,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  function submitSearch() {
    searchRef.current?.blur();
  }

  return (
    <div className="tx-filter">
      <div className="tx-search-wrap">
        <input
          ref={searchRef}
          className="tx-search"
          value={keyword}
          onChange={(e) => onKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          placeholder="Tìm mã GD, lô đất, người bán, người mua, ghi chú..."
          aria-label="Tìm giao dịch"
        />
      </div>
      <button
        type="button"
        className={['tx-filter-btn', filtersOpen ? 'is-open' : '', hasActiveFilters ? 'is-active' : '']
          .filter(Boolean)
          .join(' ')}
        aria-expanded={filtersOpen}
        aria-controls="tx-filter-advanced"
        onClick={onToggleFilters}
      >
        Bộ lọc
      </button>
      <button type="button" className="tx-search-btn" onClick={submitSearch}>
        Tìm
      </button>
      <div
        id="tx-filter-advanced"
        className={['tx-filter-advanced', filtersOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
      >
        <select
          className="tx-filter-select"
          value={type}
          onChange={(e) => onType(e.target.value)}
          aria-label="Lọc theo loại giao dịch"
        >
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="tx-filter-select"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          aria-label="Lọc theo trạng thái giao dịch"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasActiveFilters ? (
          <button type="button" className="tx-filter-clear" onClick={onResetFilters}>
            Xoá lọc
          </button>
        ) : null}
      </div>
    </div>
  );
}
