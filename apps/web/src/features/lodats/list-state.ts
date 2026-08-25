import {
  createListStateStore,
  getActiveListScrollEl,
  type ListSavedState,
} from '@/shared/list-state';
import type { ExtraFilters, PriceBracket } from './display';

export const LODAT_LIST_STATE_KEY = 'crmanhung:lodat-list-state';

export type LodatListFields = {
  searchKeyword: string;
  status: string;
  kind: string;
  extra: ExtraFilters;
  priceBracket: PriceBracket;
};

export type LodatListSavedState = ListSavedState<LodatListFields>;

const DEFAULT_EXTRA: ExtraFilters = {
  photo: 'all',
  address: 'all',
  area: 'all',
  direction: 'all',
};

function parseExtra(raw: unknown): ExtraFilters {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_EXTRA };
  const extra = raw as Partial<ExtraFilters>;
  return {
    photo: extra.photo ?? 'all',
    address: extra.address ?? 'all',
    area: extra.area ?? 'all',
    direction: extra.direction ?? 'all',
  };
}

function parsePriceBracket(raw: unknown): PriceBracket {
  return typeof raw === 'string' ? (raw as PriceBracket) : '';
}

const store = createListStateStore<LodatListFields>({
  key: LODAT_LIST_STATE_KEY,
  parseFields: (raw) => ({
    searchKeyword: typeof raw.searchKeyword === 'string' ? raw.searchKeyword : '',
    status: typeof raw.status === 'string' ? raw.status : '',
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
  snapshot: { anchorId: string | null; scrollTop: number },
) {
  store.restoreScroll(root, snapshot);
}
