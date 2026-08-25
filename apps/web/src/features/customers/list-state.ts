import {
  createListStateStore,
  getActiveListScrollEl,
  needsMoreListScrollHeight,
  restoreListScroll,
  type ListSavedState,
} from '@/shared/list-state';
import type { ExtraFilters } from './display';

export const CUSTOMER_LIST_STATE_KEY = 'crmanhung:customer-list-state';

export type CustomerListFields = {
  searchKeyword: string;
  statusFilter: string;
  extra: ExtraFilters;
};

export type CustomerListSavedState = ListSavedState<CustomerListFields>;

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

const store = createListStateStore<CustomerListFields>({
  key: CUSTOMER_LIST_STATE_KEY,
  parseFields: (raw) => ({
    searchKeyword: typeof raw.searchKeyword === 'string' ? raw.searchKeyword : '',
    statusFilter: typeof raw.statusFilter === 'string' ? raw.statusFilter : '',
    extra: parseExtra(raw.extra),
  }),
});

export function peekCustomerListState(): CustomerListSavedState | null {
  return store.peek();
}

export function saveCustomerListState(
  root: HTMLElement | null,
  filters: CustomerListFields & { selectedId: string | null },
) {
  store.save(root, filters);
}

export function clearCustomerListState() {
  store.clear();
}

export {
  getActiveListScrollEl,
  needsMoreListScrollHeight,
  restoreListScroll,
};
