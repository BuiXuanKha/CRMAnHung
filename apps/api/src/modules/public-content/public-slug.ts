/** Local copy — Nest CJS must not import runtime from @crmanhung/shared. */

export function toPublicSlug(title: string, maxLen = 60): string {
  const slug = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
    .replace(/-+$/g, '');
  return slug || 'lo-dat';
}

/** Guest lot URL: tên lô + địa chỉ công khai (không đổi sau khi đã tạo). */
export function toListingPublicSlug(title: string, location?: string | null): string {
  const combined = [title.trim(), (location ?? '').trim()].filter(Boolean).join(' ');
  return toPublicSlug(combined, 80);
}

export function kindLabel(kind: string): string {
  return kind === 'NHA' ? 'Nhà' : 'Đất';
}

export function formatM(value: number | null | undefined, suffix: string): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${value.toLocaleString('vi-VN')} ${suffix}`;
}
