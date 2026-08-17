'use client';

import { Plus } from 'lucide-react';
import { Icon } from '@/shared/ui/icon';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  onAdd: () => void;
};

export function FilterBar({ keyword, onKeyword, onAdd }: Props) {
  return (
    <div className="kh-filter">
      <input
        className="kh-search"
        value={keyword}
        onChange={(e) => onKeyword(e.target.value)}
        placeholder="Tìm tên, SĐT, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)"
        aria-label="Tìm khách hàng"
      />
      <button type="button" className="kh-add" onClick={onAdd}>
        <Icon icon={Plus} size="sm" /> Thêm khách hàng bằng số điện thoại
      </button>
    </div>
  );
}
