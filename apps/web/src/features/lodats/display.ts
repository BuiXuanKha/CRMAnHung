import { LodatKind, LodatSaleStatus, type LodatListItem } from '@crmanhung/shared';
import type { BadgeTone } from '@/shared/ui/badge';

export function formatPriceVnd(n?: number | null): string {
  if (n == null) return '—';
  return `${n.toLocaleString('vi-VN')} đ`;
}

export function formatArea(n?: number | null): string {
  if (n == null) return '—';
  return `${n.toLocaleString('vi-VN')} m²`;
}

export function formatFrontageDir(
  frontageM?: number | null,
  direction?: string | null,
): string {
  const mt =
    frontageM == null ? null : `MT ${frontageM.toLocaleString('vi-VN')} m`;
  const dir = direction?.trim() || null;
  if (!mt && !dir) return '—';
  if (mt && dir) return `${mt} · ${dir}`;
  return mt ?? dir ?? '—';
}

export function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function hasSpecs(p: LodatListItem): boolean {
  return p.areaM2 != null || p.frontageM != null || Boolean(p.direction?.trim());
}

export type ExtraFilters = {
  photo: 'all' | 'has' | 'empty';
  address: 'all' | 'has' | 'empty';
  specs: 'all' | 'has' | 'empty';
  price: 'all' | 'has' | 'empty';
};

export const PHOTO_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả ảnh' },
  { value: 'has', label: 'Có ảnh' },
  { value: 'empty', label: 'Chưa có ảnh' },
];

export const ADDRESS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả địa chỉ' },
  { value: 'has', label: 'Có địa chỉ' },
  { value: 'empty', label: 'Chưa có địa chỉ' },
];

export const SPECS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả thông số' },
  { value: 'has', label: 'Đã có thông số' },
  { value: 'empty', label: 'Thiếu thông số' },
];

export const PRICE_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả giá' },
  { value: 'has', label: 'Có giá bán' },
  { value: 'empty', label: 'Chưa nhập giá' },
];

export function kindLabel(kind: LodatKind): string {
  return kind === LodatKind.NHA ? 'Nhà' : 'Đất';
}

export function kindTone(kind: LodatKind): BadgeTone {
  return kind === LodatKind.NHA ? 'blue' : 'amber';
}

export const KIND_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả phân loại' },
  { value: LodatKind.NHA, label: 'Nhà' },
  { value: LodatKind.DAT, label: 'Đất' },
];

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: LodatSaleStatus.DANG_BAN, label: 'Mở bán' },
  { value: LodatSaleStatus.TAM_DUNG, label: 'Tạm dừng' },
];

export function formatSpecsInline(p: LodatListItem): string {
  const parts: string[] = [];
  if (p.areaM2 != null) parts.push(formatArea(p.areaM2));
  if (p.frontageM != null) parts.push(`MT ${p.frontageM.toLocaleString('vi-VN')} m`);
  if (p.direction?.trim()) parts.push(p.direction.trim());
  return parts.length ? parts.join(' · ') : '—';
}

/** Khoảng giá bán (bước 500tr) — lọc mobile /lo-dat. */
export const PRICE_BRACKET_OPTIONS = [
  { value: '', label: 'Tất cả giá' },
  { value: 'no_price', label: 'Chưa có giá' },
  { value: 'lt_500m', label: 'Dưới 500 triệu' },
  { value: '500m_1b', label: '500 triệu – 1 tỷ' },
  { value: '1b_15b', label: '1 tỷ – 1,5 tỷ' },
  { value: '15b_2b', label: '1,5 tỷ – 2 tỷ' },
  { value: '2b_25b', label: '2 tỷ – 2,5 tỷ' },
  { value: '25b_3b', label: '2,5 tỷ – 3 tỷ' },
  { value: 'gt_3b', label: 'Trên 3 tỷ' },
] as const;

export type PriceBracket = (typeof PRICE_BRACKET_OPTIONS)[number]['value'];

export function applyPriceBracket(
  items: LodatListItem[],
  bracket: PriceBracket,
): LodatListItem[] {
  if (!bracket) return items;
  return items.filter((p) => matchesPriceBracket(p.priceVnd, bracket));
}

function matchesPriceBracket(price: number | null | undefined, bracket: PriceBracket): boolean {
  const n = price == null ? null : price;
  if (bracket === 'no_price') return n == null || n <= 0;
  if (n == null || n <= 0) return false;
  if (bracket === 'lt_500m') return n > 0 && n < 500_000_000;
  if (bracket === '500m_1b') return n >= 500_000_000 && n < 1_000_000_000;
  if (bracket === '1b_15b') return n >= 1_000_000_000 && n < 1_500_000_000;
  if (bracket === '15b_2b') return n >= 1_500_000_000 && n < 2_000_000_000;
  if (bracket === '2b_25b') return n >= 2_000_000_000 && n < 2_500_000_000;
  if (bracket === '25b_3b') return n >= 2_500_000_000 && n < 3_000_000_000;
  if (bracket === 'gt_3b') return n >= 3_000_000_000;
  return true;
}

export function countActiveLodatFilters(
  status: string,
  kind: string,
  extra: ExtraFilters,
): number {
  let n = 0;
  if (status) n += 1;
  if (kind) n += 1;
  if (extra.photo !== 'all') n += 1;
  if (extra.address !== 'all') n += 1;
  if (extra.specs !== 'all') n += 1;
  if (extra.price !== 'all') n += 1;
  return n;
}

export function countMobileLodatFilters(status: string, priceBracket: PriceBracket): number {
  return (status ? 1 : 0) + (priceBracket ? 1 : 0);
}

export function applyExtraFilters(
  items: LodatListItem[],
  extra: ExtraFilters,
): LodatListItem[] {
  return items.filter((p) => {
    const hasPhoto = Boolean(p.coverImageUrl);
    if (extra.photo === 'has' && !hasPhoto) return false;
    if (extra.photo === 'empty' && hasPhoto) return false;
    const hasAddr = Boolean(p.address?.trim());
    if (extra.address === 'has' && !hasAddr) return false;
    if (extra.address === 'empty' && hasAddr) return false;
    const specs = hasSpecs(p);
    if (extra.specs === 'has' && !specs) return false;
    if (extra.specs === 'empty' && specs) return false;
    const hasPrice = p.priceVnd != null;
    if (extra.price === 'has' && !hasPrice) return false;
    if (extra.price === 'empty' && hasPrice) return false;
    return true;
  });
}

/** `@` gồm tạm dừng; `@@` chỉ tạm dừng — theo placeholder §4.3.5. */
export function parseSearchKeyword(raw: string): {
  keyword?: string;
  includePaused?: boolean;
  pausedOnly?: boolean;
} {
  const t = raw.trim();
  if (t.startsWith('@@')) {
    const keyword = t.slice(2).trim();
    return { keyword: keyword || undefined, pausedOnly: true };
  }
  if (t.startsWith('@')) {
    const keyword = t.slice(1).trim();
    return { keyword: keyword || undefined, includePaused: true };
  }
  return { keyword: t || undefined };
}
