import {
  createListStateStore,
  getActiveListScrollEl,
  type ListSavedState,
  type ListScrollSnapshot,
} from '@/shared/list-state';
import {
  DEFAULT_STATUS_COL_FILTERS,
  type ExtraFilters,
  type PriceBracket,
  type StatusColFilter,
  type StatusColFilters,
} from './display';

/** v4: + cột Đã đăng web / AI GPT (+ webBody filter). */
export const LODAT_LIST_STATE_KEY = 'crmanhung:lodat-list-state:v4';

export type LodatListFields = {
  searchKeyword: string;
  statusCols: StatusColFilters;
  kind: string;
  extra: ExtraFilters;
  priceBracket: PriceBracket;
};

export type LodatListSavedState = ListSavedState<LodatListFields>;

const DEFAULT_EXTRA: ExtraFilters = {
  photo: 'all',
  address: 'all',
  webBody: 'all',
  area: 'all',
  direction: 'all',
};

function parseExtra(raw: unknown): ExtraFilters {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_EXTRA };
  const extra = raw as Partial<ExtraFilters>;
  return {
    photo: extra.photo ?? 'all',
    address: extra.address ?? 'all',
    webBody: extra.webBody ?? 'all',
    area: extra.area ?? 'all',
    direction: extra.direction ?? 'all',
  };
}

function parsePriceBracket(raw: unknown): PriceBracket {
  return typeof raw === 'string' ? (raw as PriceBracket) : '';
}

function parseCol(raw: unknown): StatusColFilter {
  return raw === 'yes' || raw === 'no' ? raw : 'all';
}

function parseStatusCols(raw: unknown): StatusColFilters {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATUS_COL_FILTERS };
  const cols = raw as Partial<StatusColFilters>;
  return {
    open: parseCol(cols.open),
    paused: parseCol(cols.paused),
    off: parseCol(cols.off),
  };
}

const store = createListStateStore<LodatListFields>({
  key: LODAT_LIST_STATE_KEY,
  parseFields: (raw) => ({
    searchKeyword: typeof raw.searchKeyword === 'string' ? raw.searchKeyword : '',
    statusCols: parseStatusCols(raw.statusCols),
    kind: typeof raw.kind === 'string' ? raw.kind : '',
    extra: parseExtra(raw.extra),
    priceBracket: parsePriceBracket(raw.priceBracket),
  }),
});

export function peekLodatListState(): LodatListSavedState | null {
  return store.peek();
}

export function saveLodatListState(
  root: HTMLElement | null,
  fields: LodatListFields & { selectedId: string | null },
) {
  store.save(root, fields);
}

export function clearLodatListState() {
  store.clear();
}

export { getActiveListScrollEl };

export function restoreLodatListScroll(
  root: HTMLElement | null,
  snapshot: ListScrollSnapshot,
) {
  store.restoreScroll(root, snapshot);
}
