'use client';

import { useRef } from 'react';
import { CrmSearchField } from '@/shared/ui/search-field';
import { STATUS_FILTER_OPTIONS } from '../display';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
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
    <div className="sd-filter">
      <div className="sd-search-wrap">
        <CrmSearchField
          ref={searchRef}
          className="sd-search"
          value={keyword}
          onValueChange={onKeyword}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          placeholder="Tìm mã hồ sơ, tên khách, SĐT..."
          aria-label="Tìm hồ sơ sổ đỏ"
        />
      </div>
      <button
        type="button"
        className={['sd-filter-btn', filtersOpen ? 'is-open' : '', hasActiveFilters ? 'is-active' : '']
          .filter(Boolean)
          .join(' ')}
        aria-expanded={filtersOpen}
        aria-controls="sd-filter-advanced"
        onClick={onToggleFilters}
      >
        Bộ lọc
      </button>
      <button type="button" className="sd-search-btn" onClick={submitSearch}>
        Tìm
      </button>
      <div
        id="sd-filter-advanced"
        className={['sd-filter-advanced', filtersOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
      >
        <select
          className="sd-filter-select"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          aria-label="Lọc theo trạng thái hồ sơ"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasActiveFilters ? (
          <button type="button" className="sd-filter-clear" onClick={onResetFilters}>
            Xoá lọc
          </button>
        ) : null}
      </div>
    </div>
  );
}
