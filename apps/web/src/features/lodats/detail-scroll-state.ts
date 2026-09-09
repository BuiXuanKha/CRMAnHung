/**
 * Nhớ vị trí cuộn trang chi tiết `/lo-dat/[id]` (sessionStorage).
 * Dùng khi bấm lô cùng xã rồi Back — vùng cuộn là `.ld-detail-page`.
 */
import { registerListStateKey } from '@/shared/list-state';

export const LODAT_DETAIL_SCROLL_KEY = 'crmanhung:lodat-detail-scroll-state';

registerListStateKey(LODAT_DETAIL_SCROLL_KEY);

type ScrollMap = Record<string, number>;

function readMap(): ScrollMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(LODAT_DETAIL_SCROLL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: ScrollMap = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(value);
      if (id && Number.isFinite(n) && n >= 0) out[id] = n;
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: ScrollMap) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(LODAT_DETAIL_SCROLL_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

export function saveLodatDetailScroll(lodatId: string, scrollTop: number) {
  const id = lodatId.trim();
  if (!id || !Number.isFinite(scrollTop) || scrollTop < 0) return;
  const map = readMap();
  map[id] = Math.round(scrollTop);
  writeMap(map);
}

export function peekLodatDetailScroll(lodatId: string): number {
  const id = lodatId.trim();
  if (!id) return 0;
  const n = readMap()[id];
  return Number.isFinite(n) && n > 0 ? n : 0;
}
