import {
  LODAT_KIND_LABELS,
  PUBLIC_POST_CATEGORY_LABELS,
  PUBLIC_POST_STATUS_LABELS,
  PublicPostStatus,
  type PublicWebLotRow,
  type PublicWebPostRow,
  type PublicWebStaffLotRow,
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
