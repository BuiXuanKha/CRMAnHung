'use client';

import { ListFilter } from 'lucide-react';
import { Icon } from '@/shared/ui/icon';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  filterCount?: number;
  onOpenFilters?: () => void;
};

export function FilterBar({ keyword, onKeyword, filterCount = 0, onOpenFilters }: Props) {
  return (
    <div className="ld-filter">
      <input
        className="ld-search"
        value={keyword}
        onChange={(e) => onKeyword(e.target.value)}
        placeholder="Tìm lô, địa chỉ, khách... (@ cả tạm dừng)"
        aria-label="Tìm lô đất"
      />
      {onOpenFilters ? (
        <button
          type="button"
          className={['ld-filter-btn', filterCount > 0 ? 'is-active' : ''].filter(Boolean).join(' ')}
          onClick={onOpenFilters}
        >
          <Icon icon={ListFilter} size={16} />
          Bộ lọc
          {filterCount > 0 ? <span className="ld-filter-count">{filterCount}</span> : null}
        </button>
      ) : null}
    </div>
  );
}
