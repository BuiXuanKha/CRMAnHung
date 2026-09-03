import {
  createListStateStore,
  getActiveListScrollEl,
  type ListSavedState,
  type ListScrollSnapshot,
} from '@/shared/list-state';
import type { ExtraFilters } from './display';

export const TITLE_SERVICE_LIST_STATE_KEY = 'crmanhung:title-service-list-state';

export const DEFAULT_TITLE_SERVICE_EXTRA: ExtraFilters = {
  need: 'all',
  progress: 'all',
  money: 'all',
  docs: 'all',
};

export type TitleServiceListFields = {
  searchKeyword: string;
  status: string;
  employeeId: string;
  extra: ExtraFilters;
};

export type TitleServiceListSavedState = ListSavedState<TitleServiceListFields>;

function parseExtra(raw: unknown): ExtraFilters {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_TITLE_SERVICE_EXTRA };
  const extra = raw as Partial<ExtraFilters>;
  return {
    need: extra.need ?? 'all',
    progress: extra.progress ?? 'all',
    money: extra.money ?? 'all',
    docs: extra.docs ?? 'all',
  };
}

const store = createListStateStore<TitleServiceListFields>({
  key: TITLE_SERVICE_LIST_STATE_KEY,
  parseFields: (raw) => ({
    searchKeyword: typeof raw.searchKeyword === 'string' ? raw.searchKeyword : '',
    status: typeof raw.status === 'string' ? raw.status : '',
    employeeId: typeof raw.employeeId === 'string' ? raw.employeeId : '',
    extra: parseExtra(raw.extra),
  }),
});

export function peekTitleServiceListState(): TitleServiceListSavedState | null {
  return store.peek();
}

export function saveTitleServiceListState(
  root: HTMLElement | null,
  fields: TitleServiceListFields & { selectedId: string | null },
) {
  store.save(root, fields);
}

export function clearTitleServiceListState() {
  store.clear();
}

export { getActiveListScrollEl };

export function restoreTitleServiceListScroll(
  root: HTMLElement | null,
  snapshot: ListScrollSnapshot,
) {
  store.restoreScroll(root, snapshot);
}
