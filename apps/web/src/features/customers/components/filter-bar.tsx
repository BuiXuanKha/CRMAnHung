'use client';

import { Plus } from 'lucide-react';
import { Icon } from '@/shared/ui/icon';
import type { ExtraFilters } from '../display';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  extra: ExtraFilters;
  onExtra: (next: ExtraFilters) => void;
  onAdd: () => void;
};

export function FilterBar({ keyword, onKeyword, extra, onExtra, onAdd }: Props) {
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
        value={extra.lodat}
        onChange={(e) => onExtra({ ...extra, lodat: e.target.value as ExtraFilters['lodat'] })}
        aria-label="Lọc lô đất"
      >
        <option value="all">Tất cả lô đất</option>
        <option value="has">Đã gắn lô</option>
        <option value="empty">Chưa gắn lô</option>
      </select>
      <button type="button" className="kh-add" onClick={onAdd}>
        <Icon icon={Plus} size="sm" /> Thêm khách hàng bằng số điện thoại
      </button>
    </div>
  );
}
