import {
  LODAT_KIND_LABELS,
  PUBLIC_POST_CATEGORY_LABELS,
  PUBLIC_POST_STATUS_LABELS,
  PublicPostStatus,
  type PublicWebLotRow,
  type PublicWebPostRow,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import {
  matchesAreaBracket,
  matchesPriceBracket,
  type ExtraFilters,
  type PriceBracket,
} from '@/features/lodats/display';
import type { BadgeTone } from '@/shared/ui/badge';

export function lotWebLabel(isPublished: boolean): string {
  return isPublished ? 'Đang hiện' : 'Chờ đăng';
}

export function lotWebTone(isPublished: boolean): BadgeTone {
  return isPublished ? 'green' : 'gray';
}

export function lotPriceDisplay(row: PublicWebLotRow): { text: string; isMoney: boolean } {
  if (row.priceMode === 'AMOUNT' && row.priceLabel) {
    return { text: row.priceLabel, isMoney: true };
  }
  return { text: 'Liên hệ', isMoney: false };
}

export function postCategoryLabel(row: PublicWebPostRow): string {
  return PUBLIC_POST_CATEGORY_LABELS[row.category];
}

export function postStatusLabel(row: PublicWebPostRow): string {
  return PUBLIC_POST_STATUS_LABELS[row.status];
}

export function postStatusTone(row: PublicWebPostRow): BadgeTone {
  return row.status === PublicPostStatus.PUBLISHED ? 'green' : 'gray';
}

export function matchPostSearch(row: PublicWebPostRow, keyword: string): boolean {
  const q = keyword.trim().toLocaleLowerCase('vi');
  if (!q) return true;
  return `${row.title} ${postCategoryLabel(row)}`.toLocaleLowerCase('vi').includes(q);
}

export function lotKindLabel(row: PublicWebStaffLotRow): string {
  return LODAT_KIND_LABELS[row.kind];
}

export function lotSpecLine(row: PublicWebStaffLotRow): string {
  const parts: string[] = [];
  if (row.areaM2 != null) parts.push(`${row.areaM2.toLocaleString('vi-VN')} m²`);
  if (row.frontageM != null) parts.push(`MT ${row.frontageM.toLocaleString('vi-VN')} m`);
  if (row.direction?.trim()) parts.push(row.direction.trim());
  return parts.join(' · ') || '—';
}

export function matchLotSearch(row: PublicWebLotRow, keyword: string): boolean {
  const q = keyword.trim().toLocaleLowerCase('vi');
  if (!q) return true;
  const staff = 'staffName' in row ? (row as PublicWebStaffLotRow) : null;
  const extra = staff
    ? `${staff.staffName} ${lotKindLabel(staff)} ${lotSpecLine(staff)}`
    : '';
  return `${row.title} ${row.location} ${row.priceLabel ?? ''} ${extra}`
    .toLocaleLowerCase('vi')
    .includes(q);
}

export type StaffLotWebFilter = 'all' | 'published' | 'pending';

export type StaffLotFilters = {
  kind: string;
  extra: ExtraFilters;
  priceBracket: PriceBracket;
  staffName: string;
  web: StaffLotWebFilter;
};

export const DEFAULT_STAFF_LOT_EXTRA: ExtraFilters = {
  photo: 'all',
  address: 'all',
  area: 'all',
  direction: 'all',
};

export const WEB_FILTER_OPTIONS: { value: StaffLotWebFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả web' },
  { value: 'published', label: 'Đang hiện' },
  { value: 'pending', label: 'Chờ đăng' },
];

export function staffNameFilterOptions(
  items: PublicWebStaffLotRow[],
): { value: string; label: string }[] {
  const names = [...new Set(items.map((row) => row.staffName.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'vi'),
  );
  return [{ value: '', label: 'Tất cả NV' }, ...names.map((name) => ({ value: name, label: name }))];
}

export function applyStaffLotFilters(
  items: PublicWebStaffLotRow[],
  filters: StaffLotFilters,
): PublicWebStaffLotRow[] {
  return items.filter((row) => {
    if (filters.kind && row.kind !== filters.kind) return false;
    if (filters.staffName && row.staffName !== filters.staffName) return false;
    if (filters.web === 'published' && !row.isPublished) return false;
    if (filters.web === 'pending' && row.isPublished) return false;

    const hasPhoto = Boolean(row.coverImageUrl);
    if (filters.extra.photo === 'has' && !hasPhoto) return false;
    if (filters.extra.photo === 'empty' && hasPhoto) return false;

    const hasAddr = Boolean(row.location?.trim());
    if (filters.extra.address === 'has' && !hasAddr) return false;
    if (filters.extra.address === 'empty' && hasAddr) return false;

    if (!matchesAreaBracket(row.areaM2, filters.extra.area)) return false;
    if (filters.extra.direction !== 'all') {
      if ((row.direction?.trim() || '') !== filters.extra.direction) return false;
    }

    if (filters.priceBracket) {
      const price = row.priceMode === 'AMOUNT' ? row.priceVnd : null;
      if (!matchesPriceBracket(price, filters.priceBracket)) return false;
    }
    return true;
  });
}

export function countActiveStaffLotFilters(filters: StaffLotFilters): number {
  let n = 0;
  if (filters.kind) n += 1;
  if (filters.staffName) n += 1;
  if (filters.web !== 'all') n += 1;
  if (filters.extra.photo !== 'all') n += 1;
  if (filters.extra.address !== 'all') n += 1;
  if (filters.extra.area !== 'all') n += 1;
  if (filters.extra.direction !== 'all') n += 1;
  if (filters.priceBracket) n += 1;
  return n;
}

/** Slug URL bài viết (mock). */
export function toPublicSlug(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'bai-viet';
}
