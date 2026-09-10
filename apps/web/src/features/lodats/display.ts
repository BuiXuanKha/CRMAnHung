import {
  LodatKind,
  LodatSaleStatus,
  LODAT_DIRECTION_OPTIONS,
  type LodatListItem,
  type LodatListingStatus,
  type LodatStatusColFilter,
} from '@crmanhung/shared';
import type { BadgeTone } from '@/shared/ui/badge';

function toPriceNumber(n?: number | string | null): number | null {
  if (n == null || n === '') return null;
  const v = typeof n === 'string' ? Number(n) : n;
  return Number.isFinite(v) ? v : null;
}

export function formatPriceVnd(n?: number | string | null): string {
  const v = toPriceNumber(n);
  if (v == null) return '—';
  return `${v.toLocaleString('vi-VN')} đ`;
}

/** Dòng hoa hồng trên list — chữ đã lưu (`1%`, `Chưa trao đổi`); mock cũ còn số %. */
export function formatBrokerFee(
  brokerFeeNote?: string | null,
  commissionPercent?: number | null,
): string | null {
  const note = brokerFeeNote?.trim();
  if (note) return note;
  if (commissionPercent != null) return `${commissionPercent}%`;
  return null;
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
  /** Web — bodyHtml không rỗng (Đã soạn / Chưa soạn) */
  webBody: 'all' | 'has' | 'empty';
  /** Khoảng diện tích (m²) — cột DT · MT · Hướng */
  area: AreaBracket;
  /** Hướng lô — khớp `Lodat.direction` */
  direction: DirectionFilter;
};

export type AreaBracket = 'all' | '1_100' | '100_200' | 'gt_200';

export type DirectionFilter = 'all' | (typeof LODAT_DIRECTION_OPTIONS)[number];

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

/** Lọc cột Web — đã soạn bodyHtml / chưa. */
export const WEB_BODY_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả web' },
  { value: 'has', label: 'Đã soạn' },
  { value: 'empty', label: 'Chưa soạn' },
];

export function lodatWebBodyLabel(hasWebBody: boolean): string {
  return hasWebBody ? 'Đã soạn' : 'Chưa soạn';
}

export function lodatWebBodyTone(hasWebBody: boolean): BadgeTone {
  return hasWebBody ? 'green' : 'gray';
}

export const AREA_FILTER_OPTIONS: { value: AreaBracket; label: string }[] = [
  { value: 'all', label: 'Tất cả diện tích' },
  { value: '1_100', label: '1–100 m²' },
  { value: '100_200', label: '100–200 m²' },
  { value: 'gt_200', label: 'Trên 200 m²' },
];

export const DIRECTION_FILTER_OPTIONS: { value: DirectionFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả hướng' },
  ...LODAT_DIRECTION_OPTIONS.map((d) => ({ value: d as DirectionFilter, label: d })),
];

/** Khoảng giá bán (bước 500tr) — cột desktop + bộ lọc mobile. */
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

/** Sentinel lọc «Tất cả» mobile = Mở bán + Tạm dừng + Không bán. */
export const STATUS_FILTER_ALL = 'all';

/** Mobile Bộ lọc: một dropdown; desktop dùng 3 cột tri-state. */
export const STATUS_FILTER_DEFAULT = STATUS_FILTER_ALL;

export const STATUS_FILTER_OPTIONS = [
  { value: STATUS_FILTER_ALL, label: 'Tất cả trạng thái' },
  { value: LodatSaleStatus.DANG_BAN, label: 'Mở bán' },
  { value: LodatSaleStatus.TAM_DUNG, label: 'Dừng bán' },
  { value: LodatSaleStatus.KHONG_BAN, label: 'Không bán' },
];

/** Lọc một cột trạng thái: Tất cả · đúng · không đúng. */
export type StatusColFilter = LodatStatusColFilter;

export type StatusColFilters = {
  open: StatusColFilter; // Mở bán
  paused: StatusColFilter; // Dừng bán / Tạm dừng
  off: StatusColFilter; // Không bán
};

export const DEFAULT_STATUS_COL_FILTERS: StatusColFilters = {
  open: 'all',
  paused: 'all',
  off: 'all',
};

export const STATUS_COL_FILTER_OPTIONS: Record<
  keyof StatusColFilters,
  { value: StatusColFilter; label: string }[]
> = {
  open: [
    { value: 'all', label: 'Tất cả' },
    { value: 'yes', label: 'Mở bán' },
    { value: 'no', label: 'Không mở bán' },
  ],
  paused: [
    { value: 'all', label: 'Tất cả' },
    { value: 'yes', label: 'Tạm dừng' },
    { value: 'no', label: 'Không tạm dừng' },
  ],
  off: [
    { value: 'all', label: 'Tất cả' },
    { value: 'yes', label: 'Không bán' },
    { value: 'no', label: 'Không phải Không bán' },
  ],
};

const STATUS_COL_TO_VALUE: Record<keyof StatusColFilters, LodatListingStatus> = {
  open: LodatSaleStatus.DANG_BAN,
  paused: LodatSaleStatus.TAM_DUNG,
  off: LodatSaleStatus.KHONG_BAN,
};

/**
 * AND 3 cột → tập status còn lại.
 * `'all'` = đủ 3; `'empty'` = mâu thuẫn (không dòng).
 */
export function resolveStatusColFilters(
  cols: StatusColFilters,
): LodatListingStatus[] | 'all' | 'empty' {
  let set = new Set<LodatListingStatus>([
    LodatSaleStatus.DANG_BAN,
    LodatSaleStatus.TAM_DUNG,
    LodatSaleStatus.KHONG_BAN,
  ]);
  for (const key of Object.keys(STATUS_COL_TO_VALUE) as (keyof StatusColFilters)[]) {
    const mode = cols[key];
    const status = STATUS_COL_TO_VALUE[key];
    if (mode === 'yes') {
      set = new Set([...set].filter((s) => s === status));
    } else if (mode === 'no') {
      set.delete(status);
    }
  }
  if (set.size === 0) return 'empty';
  if (set.size === 3) return 'all';
  return [...set];
}

/** Mobile dropdown → 3 cột (một trạng thái hoặc tất cả). */
export function statusColsFromMobileStatus(status: string): StatusColFilters {
  if (status === LodatSaleStatus.DANG_BAN) {
    return { open: 'yes', paused: 'all', off: 'all' };
  }
  if (status === LodatSaleStatus.TAM_DUNG) {
    return { open: 'all', paused: 'yes', off: 'all' };
  }
  if (status === LodatSaleStatus.KHONG_BAN) {
    return { open: 'all', paused: 'all', off: 'yes' };
  }
  return { ...DEFAULT_STATUS_COL_FILTERS };
}

/** 3 cột → giá trị select mobile (best-effort). */
export function mobileStatusFromCols(cols: StatusColFilters): string {
  const resolved = resolveStatusColFilters(cols);
  if (resolved === 'all') return STATUS_FILTER_ALL;
  if (resolved === 'empty') return STATUS_FILTER_ALL;
  if (resolved.length === 1) return resolved[0];
  return STATUS_FILTER_ALL;
}

export function countActiveStatusColFilters(cols: StatusColFilters): number {
  let n = 0;
  if (cols.open !== 'all') n += 1;
  if (cols.paused !== 'all') n += 1;
  if (cols.off !== 'all') n += 1;
  return n;
}

export function listingSaleStatusLabel(status: string): string {
  if (status === LodatSaleStatus.DANG_BAN) return 'Mở bán';
  if (status === LodatSaleStatus.TAM_DUNG) return 'Dừng bán';
  if (status === LodatSaleStatus.KHONG_BAN) return 'Không bán';
  if (status === LodatSaleStatus.DAT_COC) return 'Đặt cọc';
  if (status === LodatSaleStatus.DA_BAN) return 'Đã bán';
  return status;
}

export function listingSaleStatusTone(status: string): BadgeTone {
  return status === LodatSaleStatus.DANG_BAN ? 'green' : 'gray';
}

export function formatSpecsInline(p: LodatListItem): string {
  const parts: string[] = [];
  if (p.areaM2 != null) parts.push(formatArea(p.areaM2));
  if (p.frontageM != null) parts.push(`MT ${p.frontageM.toLocaleString('vi-VN')} m`);
  if (p.direction?.trim()) parts.push(p.direction.trim());
  return parts.length ? parts.join(' · ') : '—';
}

export function applyPriceBracket(
  items: LodatListItem[],
  bracket: PriceBracket,
): LodatListItem[] {
  if (!bracket) return items;
  return items.filter((p) => matchesPriceBracket(p.priceVnd, bracket));
}

export function matchesPriceBracket(
  price: number | string | null | undefined,
  bracket: PriceBracket,
): boolean {
  const n = toPriceNumber(price);
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
  statusCols: StatusColFilters,
  kind: string,
  extra: ExtraFilters,
  priceBracket: PriceBracket = '',
): number {
  let n = countActiveStatusColFilters(statusCols);
  if (kind) n += 1;
  if (extra.photo !== 'all') n += 1;
  if (extra.address !== 'all') n += 1;
  if (extra.webBody !== 'all') n += 1;
  if (extra.area !== 'all') n += 1;
  if (extra.direction !== 'all') n += 1;
  if (priceBracket) n += 1;
  return n;
}

export function countMobileLodatFilters(
  statusCols: StatusColFilters,
  priceBracket: PriceBracket,
): number {
  return countActiveStatusColFilters(statusCols) + (priceBracket ? 1 : 0);
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
    if (extra.webBody === 'has' && !p.hasWebBody) return false;
    if (extra.webBody === 'empty' && p.hasWebBody) return false;
    if (!matchesAreaBracket(p.areaM2, extra.area)) return false;
    if (extra.direction !== 'all') {
      if ((p.direction?.trim() || '') !== extra.direction) return false;
    }
    return true;
  });
}

/** 1–100: 1≤DT≤100; 100–200: 100&lt;DT≤200; trên 200: DT&gt;200. */
export function matchesAreaBracket(
  areaM2: number | null | undefined,
  bracket: AreaBracket,
): boolean {
  if (bracket === 'all') return true;
  if (areaM2 == null || !Number.isFinite(areaM2)) return false;
  if (bracket === '1_100') return areaM2 >= 1 && areaM2 <= 100;
  if (bracket === '100_200') return areaM2 > 100 && areaM2 <= 200;
  if (bracket === 'gt_200') return areaM2 > 200;
  return true;
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
