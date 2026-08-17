'use client';

import type { ExtraFilters } from '../display';
import {
  CHANNEL_FILTER_OPTIONS,
  DEMAND_FILTER_OPTIONS,
  FINANCE_FILTER_OPTIONS,
  NAME_FILTER_OPTIONS,
} from '../display';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  extra: ExtraFilters;
  onExtra: (next: ExtraFilters) => void;
};

export function FilterBar({ keyword, onKeyword, status, onStatus, extra, onExtra }: Props) {
  return (
    <div className="kh-filter">
      <input
        className="kh-search"
        value={keyword}
        onChange={(e) => onKeyword(e.target.value)}
        placeholder="Tìm tên, SĐT, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)"
        aria-label="Tìm khách hàng"
      />
      <select
        value={status}
        onChange={(e) => onStatus(e.target.value)}
        aria-label="Lọc trạng thái"
      >
        {NAME_FILTER_OPTIONS.map((o) => (
          <option key={o.value || 'all'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={extra.finance}
        onChange={(e) => onExtra({ ...extra, finance: e.target.value as ExtraFilters['finance'] })}
        aria-label="Lọc tài chính"
      >
        {FINANCE_FILTER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={extra.channel}
        onChange={(e) => onExtra({ ...extra, channel: e.target.value as ExtraFilters['channel'] })}
        aria-label="Lọc kênh liên hệ"
      >
        {CHANNEL_FILTER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={extra.lodat}
        onChange={(e) => onExtra({ ...extra, lodat: e.target.value as ExtraFilters['lodat'] })}
        aria-label="Lọc lô đất"
      >
        <option value="all">Tất cả lô đất</option>
        <option value="has">Đã gắn lô</option>
        <option value="empty">Chưa gắn lô</option>
      </select>
      <select
        value={extra.demand}
        onChange={(e) => onExtra({ ...extra, demand: e.target.value as ExtraFilters['demand'] })}
        aria-label="Lọc nhu cầu"
      >
        {DEMAND_FILTER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
