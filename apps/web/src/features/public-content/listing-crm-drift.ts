import type { LodatListItem, PublicWebListingCrmDriftItem, PublicWebLotRow } from '@crmanhung/shared';

function norm(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function sameText(a: string, b: string): boolean {
  return a.toLocaleLowerCase('vi') === b.toLocaleLowerCase('vi');
}

/**
 * BUG-062 hướng B: so overlay Đăng web với lô CRM (tiêu đề + địa chỉ).
 * Chỉ khi đã có hàng listing (đã soạn / xuất bản).
 */
export function computeListingCrmDrift(
  plot: LodatListItem,
  listing: PublicWebLotRow | undefined,
): PublicWebListingCrmDriftItem[] {
  if (!listing) return [];

  const items: PublicWebListingCrmDriftItem[] = [];
  const listingTitle = norm(listing.title);
  const crmTitle = norm(plot.title);
  if (listingTitle && crmTitle && !sameText(listingTitle, crmTitle)) {
    items.push({
      field: 'title',
      label: 'Tiêu đề',
      listingValue: listingTitle,
      crmValue: crmTitle,
    });
  }

  const listingLocation = norm(listing.location);
  const crmLocation = norm(plot.address);
  if (listingLocation && crmLocation && !sameText(listingLocation, crmLocation)) {
    items.push({
      field: 'location',
      label: 'Địa chỉ',
      listingValue: listingLocation,
      crmValue: crmLocation,
    });
  }

  return items;
}

export function formatListingCrmDriftMessage(items: PublicWebListingCrmDriftItem[]): string {
  if (!items.length) return 'Không có thay đổi.';
  return items
    .map(
      (item) =>
        `• ${item.label}\n  Đăng web: ${item.listingValue}\n  CRM: ${item.crmValue}`,
    )
    .join('\n\n');
}

/** Lô có lệch CRM xếp trước; giữ thứ tự tương đối trong mỗi nhóm. */
export function sortStaffLotsByCrmDrift<T extends { crmDrift?: PublicWebListingCrmDriftItem[] }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const ad = a.crmDrift?.length ? 1 : 0;
    const bd = b.crmDrift?.length ? 1 : 0;
    return bd - ad;
  });
}
