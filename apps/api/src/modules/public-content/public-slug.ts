/** Local copy — Nest CJS must not import runtime from @crmanhung/shared. */

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
  return slug || 'lo-dat';
}

export function kindLabel(kind: string): string {
  return kind === 'NHA' ? 'Nhà' : 'Đất';
}

export function formatM(value: number | null | undefined, suffix: string): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${value.toLocaleString('vi-VN')} ${suffix}`;
}
