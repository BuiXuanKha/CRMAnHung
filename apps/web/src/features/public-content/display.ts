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
