import {
  PUBLIC_POST_CATEGORY_LABELS,
  PUBLIC_POST_STATUS_LABELS,
  PublicPostStatus,
  type PublicWebLotRow,
  type PublicWebPostRow,
} from '@crmanhung/shared';
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

export function matchLotSearch(row: PublicWebLotRow, keyword: string): boolean {
  const q = keyword.trim().toLocaleLowerCase('vi');
  if (!q) return true;
  return `${row.title} ${row.location}`.toLocaleLowerCase('vi').includes(q);
}

export function matchPostSearch(row: PublicWebPostRow, keyword: string): boolean {
  const q = keyword.trim().toLocaleLowerCase('vi');
  if (!q) return true;
  return `${row.title} ${postCategoryLabel(row)}`.toLocaleLowerCase('vi').includes(q);
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
