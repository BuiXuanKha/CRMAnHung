'use client';

import { useRef } from 'react';
import { CrmSearchField } from '@/shared/ui/search-field';
import { STATUS_FILTER_OPTIONS } from '../display';
import type { UserDirectoryItem } from '@crmanhung/shared';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  status: string;
  onStatus: (v: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  showEmployeeFilter?: boolean;
  employees?: UserDirectoryItem[];
  employeeId?: string;
  onEmployee?: (v: string) => void;
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
  showEmployeeFilter = false,
  employees = [],
  employeeId = '',
  onEmployee,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  function submitSearch() {
    searchRef.current?.blur();
  }

  function employeeSelect(extraClass: string) {
    if (!showEmployeeFilter) return null;
    return (
      <select
        className={`sd-filter-select sd-filter-employee ${extraClass}`.trim()}
        value={employeeId}
        onChange={(e) => onEmployee?.(e.target.value)}
        aria-label="Lọc theo nhân viên tạo hồ sơ"
      >
        <option value="">Tất cả nhân viên</option>
        {employees
          .filter((u) => u.isActive !== false)
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
      </select>
    );
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
      {employeeSelect('is-desktop')}
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
        {employeeSelect('is-mobile')}
        {hasActiveFilters ? (
          <button type="button" className="sd-filter-clear" onClick={onResetFilters}>
            Xoá lọc
          </button>
        ) : null}
      </div>
    </div>
  );
}
