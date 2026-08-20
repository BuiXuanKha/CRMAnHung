import { CUSTOMER_STATUS_LABELS, CustomerStatus, type CustomerListItem } from '@crmanhung/shared';

export function initials(name: string): string {
  const parts = name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatBudget(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return '—';
  if (min != null && max != null) return `${vndShort(min)} - ${vndShort(max)}`;
  if (min != null) return `Từ ${vndShort(min)}`;
  return `Đến ${vndShort(max as number)}`;
}

function vndShort(n: number): string {
  if (n >= 1_000_000_000) {
    const ty = n / 1_000_000_000;
    const s = ty % 1 === 0 ? String(ty) : ty.toFixed(1).replace('.', ',');
    return `${s} tỷ`;
  }
  if (n >= 1_000_000) {
    return `${Math.round(n / 1_000_000)} triệu`;
  }
  return n.toLocaleString('vi-VN');
}

export function channelLabel(c: CustomerListItem): string {
  if (c.sourceHotline) {
    const label = c.sourceHotline.label?.trim();
    return label
      ? `${c.sourceHotline.phone} (${label})`
      : c.sourceHotline.phone;
  }
  const profileName = c.sourceFacebookProfile?.nickname?.trim();
  if (profileName) return profileName;
  const profileUid = c.sourceFacebookProfile?.facebookUid?.trim();
  if (profileUid) return profileUid;
  const scanLabel = c.facebook?.scanSourceLabel?.trim();
  if (scanLabel) return scanLabel;
  const zalo = c.phones.find((p) => (p.label ?? '').toLowerCase().includes('zalo'));
  if (zalo) {
    return `${zalo.phone} (${zalo.label})`;
  }
  const source = c.facebook?.scanSource ?? '';
  if (source === 'page' || source === 'business_suite') {
    const page = c.facebook?.facebookName?.trim() || c.employeeName;
    return `Page ${page}`;
  }
  if (c.facebook) return c.facebook.facebookName?.trim() || 'Facebook';
  return '—';
}

export function demandLabel(c: CustomerListItem): string {
  const need = c.latestNeedSummary?.trim();
  if (need) return need;
  return '—';
}

export function statusLabel(status: CustomerStatus): string {
  return CUSTOMER_STATUS_LABELS[status];
}

export function statusTone(status: CustomerStatus): 'green' | 'blue' | 'amber' | 'gray' | 'red' {
  if (status === CustomerStatus.KHACH_NET) return 'green';
  if (status === CustomerStatus.KHACH_MOI) return 'blue';
  if (status === CustomerStatus.KHACH_CAN_CHAM_SOC) return 'amber';
  return 'gray';
}

export type ExtraFilters = {
  finance: 'all' | 'has' | 'empty';
  channel: 'all' | 'facebook' | 'phone' | 'page';
  lodat: 'all' | 'has' | 'empty';
  demand: 'all' | 'has' | 'empty';
};

export const NAME_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: CustomerStatus.KHACH_MOI, label: 'Khách mới' },
  { value: CustomerStatus.KHACH_NET, label: 'Khách nét' },
  { value: CustomerStatus.KHACH_CAN_CHAM_SOC, label: 'Khách cần chăm sóc' },
  { value: CustomerStatus.KHAC, label: 'Khác' },
];

export const DEMAND_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả nhu cầu' },
  { value: 'has', label: 'Có nhu cầu' },
  { value: 'empty', label: 'Chưa có' },
];

export const FINANCE_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả tài chính' },
  { value: 'has', label: 'Có ngân sách' },
  { value: 'empty', label: 'Chưa nhập' },
];

export const CHANNEL_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả kênh liên hệ' },
  { value: 'facebook', label: 'Facebook / Messenger' },
  { value: 'phone', label: 'SĐT / Zalo' },
  { value: 'page', label: 'Page' },
];

export const LODAT_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả lô đất' },
  { value: 'has', label: 'Đã gắn lô' },
  { value: 'empty', label: 'Chưa gắn lô' },
];

export function countMobileCustomerFilters(status: string, extra: ExtraFilters): number {
  let n = 0;
  if (status) n += 1;
  if (extra.finance !== 'all') n += 1;
  if (extra.channel !== 'all') n += 1;
  if (extra.lodat !== 'all') n += 1;
  if (extra.demand !== 'all') n += 1;
  return n;
}

export function countCustomerStats(items: CustomerListItem[]): {
  KN: number;
  KM: number;
  CCS: number;
  KH: number;
  pinned: number;
} {
  const counts = { KN: 0, KM: 0, CCS: 0, KH: 0, pinned: 0 };
  for (const c of items) {
    if (c.status === CustomerStatus.KHACH_NET) counts.KN += 1;
    else if (c.status === CustomerStatus.KHACH_MOI) counts.KM += 1;
    else if (c.status === CustomerStatus.KHACH_CAN_CHAM_SOC) counts.CCS += 1;
    else counts.KH += 1;
    if (c.isPinned) counts.pinned += 1;
  }
  return counts;
}

export function applyExtraFilters(
  items: CustomerListItem[],
  extra: ExtraFilters,
): CustomerListItem[] {
  return items.filter((c) => {
    if (extra.finance === 'has' && c.budgetMinVnd == null && c.budgetMaxVnd == null) return false;
    if (extra.finance === 'empty' && (c.budgetMinVnd != null || c.budgetMaxVnd != null)) return false;
    if (extra.channel === 'facebook' && !c.facebook && !c.sourceFacebookProfile) return false;
    if (extra.channel === 'phone' && c.phones.length === 0 && !c.sourceHotline) return false;
    if (extra.channel === 'page') {
      const s = c.facebook?.scanSource;
      if (s !== 'page' && s !== 'business_suite') return false;
    }
    if (extra.lodat === 'has' && c.lodatCount <= 0) return false;
    if (extra.lodat === 'empty' && c.lodatCount > 0) return false;
    const hasDemand = Boolean(c.latestNeedSummary?.trim());
    if (extra.demand === 'has' && !hasDemand) return false;
    if (extra.demand === 'empty' && hasDemand) return false;
    return true;
  });
}

/** `@` gồm đã ẩn; `@@` chỉ đã ẩn — theo placeholder §4.3.4. */
export function parseSearchKeyword(raw: string): {
  keyword?: string;
  includeHidden?: boolean;
  hiddenOnly?: boolean;
} {
  const t = raw.trim();
  if (t.startsWith('@@')) {
    const keyword = t.slice(2).trim();
    return { keyword: keyword || undefined, hiddenOnly: true };
  }
  if (t.startsWith('@')) {
    const keyword = t.slice(1).trim();
    return { keyword: keyword || undefined, includeHidden: true };
  }
  return { keyword: t || undefined };
}
