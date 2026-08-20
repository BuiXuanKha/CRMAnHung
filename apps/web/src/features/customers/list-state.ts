import type { ExtraFilters } from './display';

export const CUSTOMER_LIST_STATE_KEY = 'crmanhung:customer-list-state';

export type CustomerListSavedState = {
  anchorId: string | null;
  scrollTop: number;
  searchKeyword: string;
  statusFilter: string;
  extra: ExtraFilters;
  selectedId: string | null;
};

const DEFAULT_EXTRA: ExtraFilters = {
  finance: 'all',
  channel: 'all',
  lodat: 'all',
  demand: 'all',
};

function parseExtra(raw: unknown): ExtraFilters {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_EXTRA };
  const extra = raw as Partial<ExtraFilters>;
  return {
    finance: extra.finance ?? 'all',
    channel: extra.channel ?? 'all',
    lodat: extra.lodat ?? 'all',
    demand: extra.demand ?? 'all',
  };
}

export function getActiveListScrollEl(
  desktop: HTMLElement | null,
  mobile: HTMLElement | null,
): HTMLElement | null {
  const desktopVisible = desktop && desktop.offsetParent !== null;
  const mobileVisible = mobile && mobile.offsetParent !== null;
  const preferred = desktopVisible ? desktop : mobileVisible ? mobile : desktop || mobile;
  if (!preferred) return null;
  if (preferred.scrollHeight > preferred.clientHeight + 2) return preferred;
  return preferred;
}

export function captureListScroll(root: HTMLElement | null): {
  anchorId: string | null;
  scrollTop: number;
} {
  if (!root) return { anchorId: null, scrollTop: 0 };
  const rows = root.querySelectorAll('[data-customer-row-id]');
  const rootRect = root.getBoundingClientRect();
  let anchorId: string | null = null;
  for (const row of rows) {
    const rect = row.getBoundingClientRect();
    if (rect.bottom > rootRect.top + 1) {
      anchorId = row.getAttribute('data-customer-row-id');
      break;
    }
  }
  if (!anchorId && rows.length) {
    anchorId = rows[0].getAttribute('data-customer-row-id');
  }
  return { anchorId, scrollTop: root.scrollTop };
}

export function maxListScrollTop(root: HTMLElement | null): number {
  if (!root) return 0;
  return Math.max(0, root.scrollHeight - root.clientHeight);
}

export function needsMoreListScrollHeight(root: HTMLElement | null, scrollTop: number): boolean {
  if (!root || !Number.isFinite(scrollTop)) return false;
  return scrollTop > maxListScrollTop(root) + 2;
}

export function restoreListScroll(
  root: HTMLElement | null,
  snapshot: { anchorId: string | null; scrollTop: number },
) {
  if (!root) return;
  const apply = () => {
    if (Number.isFinite(snapshot.scrollTop)) {
      root.scrollTop = Math.min(snapshot.scrollTop, maxListScrollTop(root));
      return;
    }
    if (!snapshot.anchorId) return;
    const row = root.querySelector(
      `[data-customer-row-id="${CSS.escape(snapshot.anchorId)}"]`,
    );
    if (!(row instanceof HTMLElement)) return;
    const rootRect = root.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    root.scrollTop += rowRect.top - rootRect.top;
  };
  apply();
  requestAnimationFrame(apply);
}

export function saveCustomerListState(
  root: HTMLElement | null,
  filters: {
    searchKeyword: string;
    statusFilter: string;
    extra: ExtraFilters;
    selectedId: string | null;
  },
) {
  const scroll = captureListScroll(root);
  try {
    sessionStorage.setItem(
      CUSTOMER_LIST_STATE_KEY,
      JSON.stringify({
        version: 1,
        ...scroll,
        searchKeyword: filters.searchKeyword,
        statusFilter: filters.statusFilter,
        extra: filters.extra,
        selectedId: filters.selectedId,
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function peekCustomerListState(): CustomerListSavedState | null {
  try {
    const raw = sessionStorage.getItem(CUSTOMER_LIST_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      anchorId: typeof parsed.anchorId === 'string' ? parsed.anchorId : null,
      scrollTop: Number(parsed.scrollTop) || 0,
      searchKeyword: typeof parsed.searchKeyword === 'string' ? parsed.searchKeyword : '',
      statusFilter: typeof parsed.statusFilter === 'string' ? parsed.statusFilter : '',
      extra: parseExtra(parsed.extra),
      selectedId: typeof parsed.selectedId === 'string' ? parsed.selectedId : null,
    };
  } catch {
    return null;
  }
}

export function clearCustomerListState() {
  try {
    sessionStorage.removeItem(CUSTOMER_LIST_STATE_KEY);
  } catch {
    /* ignore */
  }
}
