/**
 * Icon đỏ /dang-bai: CRM đã cập nhật sau lần NV lưu bài web (`needsWebUpdate`).
 * Không so khớp title/location overlay vs CRM.
 */

export function formatNeedsWebUpdateMessage(): string {
  return [
    'Lô đất trên CRM đã được cập nhật sau lần lưu bài đăng web.',
    '',
    'Vào Soạn bài đăng và Lưu lại để cập nhật nội dung trên web khách (ảnh, mô tả, giá công khai…).',
  ].join('\n');
}

/** Lô cần cập nhật bài web xếp trước; giữ thứ tự tương đối trong mỗi nhóm. */
export function sortStaffLotsByNeedsWebUpdate<T extends { needsWebUpdate?: boolean }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const ad = a.needsWebUpdate ? 1 : 0;
    const bd = b.needsWebUpdate ? 1 : 0;
    return bd - ad;
  });
}
