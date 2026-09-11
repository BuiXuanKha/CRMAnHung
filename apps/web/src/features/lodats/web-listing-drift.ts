/**
 * Icon đỏ trên /lo-dat: CRM đã cập nhật sau lần NV lưu bài web (`needsWebUpdate`).
 * Alert liệt kê cụ thể: «Diện tích thay đổi: 90m² thành 100m²».
 */
import {
  formatLodatWebUpdateChangesMessage,
  type LodatWebUpdateChange,
} from '@crmanhung/shared';

export function formatNeedsWebUpdateMessage(
  changes?: LodatWebUpdateChange[] | null,
): string {
  return formatLodatWebUpdateChangesMessage(changes);
}

/** Lô cần cập nhật bài web xếp trước; giữ thứ tự tương đối trong mỗi nhóm. */
export function sortByNeedsWebUpdate<T extends { needsWebUpdate?: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ad = a.needsWebUpdate ? 1 : 0;
    const bd = b.needsWebUpdate ? 1 : 0;
    return bd - ad;
  });
}
