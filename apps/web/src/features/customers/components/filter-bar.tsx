'use client';

import { CustomerStatus } from '@crmanhung/shared';
import type { ExtraFilters } from '../display';

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
        <option value="">Tất cả trạng thái</option>
        <option value={CustomerStatus.KHACH_MOI}>Khách mới</option>
        <option value={CustomerStatus.KHACH_NET}>Khách nét</option>
        <option value={CustomerStatus.KHACH_CAN_CHAM_SOC}>Khách cần chăm sóc</option>
        <option value={CustomerStatus.KHAC}>Khác</option>
      </select>
      <select
        value={extra.finance}
        onChange={(e) => onExtra({ ...extra, finance: e.target.value as ExtraFilters['finance'] })}
        aria-label="Lọc tài chính"
      >
        <option value="all">Tất cả tài chính</option>
        <option value="has">Có ngân sách</option>
        <option value="empty">Chưa nhập</option>
      </select>
      <select
        value={extra.channel}
        onChange={(e) => onExtra({ ...extra, channel: e.target.value as ExtraFilters['channel'] })}
        aria-label="Lọc kênh liên hệ"
      >
        <option value="all">Tất cả kênh liên hệ</option>
        <option value="facebook">Facebook / Messenger</option>
        <option value="phone">SĐT / Zalo</option>
        <option value="page">Page</option>
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
        <option value="all">Tất cả nhu cầu</option>
        <option value="has">Có nhu cầu</option>
        <option value="empty">Chưa có</option>
      </select>
    </div>
  );
}
