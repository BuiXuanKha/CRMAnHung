'use client';

import { useRef } from 'react';
import { FilePlus, Sparkles } from 'lucide-react';
import { CrmSearchField } from '@/shared/ui/search-field';
import { Icon } from '@/shared/ui/icon';
import {
  POST_CATEGORY_FILTER_OPTIONS,
  POST_STATUS_FILTER_OPTIONS,
} from '../display';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  category: string;
  onCategory: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onCompose: () => void;
  onComposeGpt: () => void;
};

export function PostFilterBar({
  keyword,
  onKeyword,
  filtersOpen,
  onToggleFilters,
  category,
  onCategory,
  status,
  onStatus,
  hasActiveFilters,
  onResetFilters,
  onCompose,
  onComposeGpt,
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
          placeholder="Tìm tiêu đề, chuyên mục..."
          aria-label="Tìm bài viết"
        />
      </div>
      <button
        type="button"
        className={['pw-filter-btn', filtersOpen ? 'is-open' : '', hasActiveFilters ? 'is-active' : '']
          .filter(Boolean)
          .join(' ')}
        aria-expanded={filtersOpen}
        aria-controls="post-filter-advanced"
        onClick={onToggleFilters}
      >
        Bộ lọc
      </button>
      <button type="button" className="pw-search-btn" onClick={submitSearch}>
        Tìm
      </button>
      <button type="button" className="crm-btn" onClick={onComposeGpt}>
        <Icon icon={Sparkles} size="sm" /> Soạn bài bằng GPT AI
      </button>
      <button type="button" className="crm-btn primary" onClick={onCompose}>
        <Icon icon={FilePlus} size="sm" /> Soạn bài
      </button>
      <div
        id="post-filter-advanced"
        className={['pw-filter-advanced', filtersOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
      >
        <select
          className="pw-filter-select"
          value={category}
          onChange={(e) => onCategory(e.target.value)}
          aria-label="Lọc theo chuyên mục"
        >
          {POST_CATEGORY_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="pw-filter-select"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          aria-label="Lọc theo trạng thái"
        >
          {POST_STATUS_FILTER_OPTIONS.map((opt) => (
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
