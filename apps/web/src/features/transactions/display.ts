import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  TransactionStatus,
  TransactionType,
  type TransactionListItem,
} from '@crmanhung/shared';
import type { BadgeTone } from '@/shared/ui/badge';

export function formatMoneyVnd(n?: number | null): string {
  if (n == null || n <= 0) return '—';
  return `${n.toLocaleString('vi-VN')} đ`;
}

export function formatStatMoneyVnd(n: number): string {
  return `${n.toLocaleString('vi-VN')} đ`;
}

export function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function formatDateShort(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export type CountdownTone = 'none' | 'ok' | 'today' | 'overdue';

export type NotaryDisplay = {
  dateLabel: string | null;
  countdownLabel: string | null;
  countdownTone: CountdownTone;
};

function startOfLocalDay(ms: number): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Hẹn CC: đếm ngược chỉ Của tôi · Đã cọc. */
export function getNotaryAppointmentDisplay(item: TransactionListItem): NotaryDisplay {
  if (item.type === TransactionType.RECORD || !item.notaryAppointmentAt) {
    return { dateLabel: null, countdownLabel: null, countdownTone: 'none' };
  }

  const dateLabel = formatDateShort(item.notaryAppointmentAt) ?? '—';

  if (item.status !== TransactionStatus.DA_COC) {
    return { dateLabel, countdownLabel: null, countdownTone: 'none' };
  }

  const todayMs = startOfLocalDay(Date.now());
  const targetMs = startOfLocalDay(new Date(item.notaryAppointmentAt).getTime());
  const diffDays = Math.round((targetMs - todayMs) / 86_400_000);

  if (diffDays > 0) {
    return { dateLabel, countdownLabel: `Còn ${diffDays} ngày`, countdownTone: 'ok' };
  }
  if (diffDays === 0) {
    return { dateLabel, countdownLabel: 'Hôm nay', countdownTone: 'today' };
  }
  return {
    dateLabel,
    countdownLabel: `Quá ${Math.abs(diffDays)} ngày`,
    countdownTone: 'overdue',
  };
}

export function typeLabel(type: TransactionType): string {
  return TRANSACTION_TYPE_LABELS[type];
}

export function typeTone(type: TransactionType): BadgeTone {
  return type === TransactionType.OWN ? 'blue' : 'gray';
}

export function statusLabel(status: TransactionStatus): string {
  return TRANSACTION_STATUS_LABELS[status];
}

export function statusTone(status: TransactionStatus): BadgeTone {
  switch (status) {
    case TransactionStatus.DA_COC:
      return 'amber';
    case TransactionStatus.DA_CONG_CHUNG:
      return 'blue';
    case TransactionStatus.HOAN_TAT:
      return 'green';
    case TransactionStatus.HUY:
      return 'red';
  }
}

export const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: TransactionType.OWN, label: TRANSACTION_TYPE_LABELS[TransactionType.OWN] },
  { value: TransactionType.RECORD, label: TRANSACTION_TYPE_LABELS[TransactionType.RECORD] },
];

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  {
    value: TransactionStatus.DA_COC,
    label: TRANSACTION_STATUS_LABELS[TransactionStatus.DA_COC],
  },
  {
    value: TransactionStatus.DA_CONG_CHUNG,
    label: TRANSACTION_STATUS_LABELS[TransactionStatus.DA_CONG_CHUNG],
  },
  {
    value: TransactionStatus.HOAN_TAT,
    label: TRANSACTION_STATUS_LABELS[TransactionStatus.HOAN_TAT],
  },
  { value: TransactionStatus.HUY, label: TRANSACTION_STATUS_LABELS[TransactionStatus.HUY] },
];

export type ExtraFilters = {
  lodat: 'all' | 'has' | 'empty';
  seller: 'all' | 'has' | 'empty';
  buyer: 'all' | 'has' | 'empty';
  price: 'all' | 'has' | 'empty';
  commission: 'all' | 'has' | 'empty' | 'na';
  notary: 'all' | 'has' | 'empty';
  note: 'all' | 'has' | 'empty';
};

export const LODAT_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả lô đất' },
  { value: 'has', label: 'Có lô đất' },
  { value: 'empty', label: 'Chưa có lô đất' },
];

export const SELLER_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả người bán' },
  { value: 'has', label: 'Có người bán' },
  { value: 'empty', label: 'Chưa có người bán' },
];

export const BUYER_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả người mua' },
  { value: 'has', label: 'Có người mua' },
  { value: 'empty', label: 'Chưa có người mua' },
];

export const PRICE_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả giá' },
  { value: 'has', label: 'Có giá bán' },
  { value: 'empty', label: 'Chưa nhập giá' },
];

export const COMMISSION_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả hoa hồng' },
  { value: 'has', label: 'Có hoa hồng' },
  { value: 'empty', label: 'Chưa nhập hoa hồng' },
  { value: 'na', label: 'Ghi nhận (không áp dụng)' },
];

export const NOTARY_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả hẹn CC' },
  { value: 'has', label: 'Có ngày hẹn' },
  { value: 'empty', label: 'Chưa hẹn CC' },
];

export const NOTE_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả ghi chú' },
  { value: 'has', label: 'Có ghi chú' },
  { value: 'empty', label: 'Không ghi chú' },
];

function hasPrice(item: TransactionListItem): boolean {
  return item.salePriceVnd != null && item.salePriceVnd > 0;
}

function hasCommission(item: TransactionListItem): boolean {
  return item.type !== TransactionType.RECORD && item.commissionVnd != null && item.commissionVnd > 0;
}

export function applyExtraFilters(
  items: TransactionListItem[],
  extra: ExtraFilters,
): TransactionListItem[] {
  return items.filter((item) => {
    const lodat = Boolean(item.lodatTitle?.trim());
    if (extra.lodat === 'has' && !lodat) return false;
    if (extra.lodat === 'empty' && lodat) return false;

    const seller = item.sellerNames.some((n) => n.trim());
    if (extra.seller === 'has' && !seller) return false;
    if (extra.seller === 'empty' && seller) return false;

    const buyer = item.buyerNames.some((n) => n.trim());
    if (extra.buyer === 'has' && !buyer) return false;
    if (extra.buyer === 'empty' && buyer) return false;

    const price = hasPrice(item);
    if (extra.price === 'has' && !price) return false;
    if (extra.price === 'empty' && price) return false;

    if (extra.commission === 'na' && item.type !== TransactionType.RECORD) return false;
    if (extra.commission === 'has' && !hasCommission(item)) return false;
    if (extra.commission === 'empty') {
      if (item.type === TransactionType.RECORD || hasCommission(item)) return false;
    }

    const notary = Boolean(item.notaryAppointmentAt);
    if (extra.notary === 'has' && !notary) return false;
    if (extra.notary === 'empty' && notary) return false;

    const note = Boolean(item.note?.trim());
    if (extra.note === 'has' && !note) return false;
    if (extra.note === 'empty' && note) return false;

    return true;
  });
}
