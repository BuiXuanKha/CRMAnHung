import {
  PUBLIC_POST_CATEGORY_LABELS,
  PUBLIC_POST_STATUS_LABELS,
  PublicPostCategory,
  PublicPostStatus,
  type PublicWebLotRow,
  type PublicWebPostRow,
} from '@crmanhung/shared';
import type { BadgeTone } from '@/shared/ui/badge';
import type { ColumnFilterOption } from '@/shared/ui/column-filter';

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

export type PostListFilters = {
  category: string;
  status: string;
};

export const POST_CATEGORY_FILTER_OPTIONS: ColumnFilterOption[] = [
  { value: '', label: 'Tất cả chuyên mục' },
  ...Object.values(PublicPostCategory).map((value) => ({
    value,
    label: PUBLIC_POST_CATEGORY_LABELS[value],
  })),
];

export const POST_STATUS_FILTER_OPTIONS: ColumnFilterOption[] = [
  { value: '', label: 'Tất cả trạng thái' },
  {
    value: PublicPostStatus.PUBLISHED,
    label: PUBLIC_POST_STATUS_LABELS[PublicPostStatus.PUBLISHED],
  },
  {
    value: PublicPostStatus.DRAFT,
    label: PUBLIC_POST_STATUS_LABELS[PublicPostStatus.DRAFT],
  },
];

export function applyPostFilters(
  items: PublicWebPostRow[],
  filters: PostListFilters,
): PublicWebPostRow[] {
  return items.filter((row) => {
    if (filters.category && row.category !== filters.category) return false;
    if (filters.status && row.status !== filters.status) return false;
    return true;
  });
}

export function countActivePostFilters(filters: PostListFilters): number {
  let n = 0;
  if (filters.category) n += 1;
  if (filters.status) n += 1;
  return n;
}

export { toPublicSlug, toListingPublicSlug, toPublicPostSlug } from '@crmanhung/shared';
