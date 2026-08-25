import {
  createListStateStore,
  getActiveListScrollEl,
  type ListSavedState,
} from '@/shared/list-state';
import type { ExtraFilters } from './display';

export const TRANSACTION_LIST_STATE_KEY = 'crmanhung:transaction-list-state';

export type TransactionListFields = {
  searchKeyword: string;
  type: string;
  status: string;
  extra: ExtraFilters;
};

export type TransactionListSavedState = ListSavedState<TransactionListFields>;

const DEFAULT_EXTRA: ExtraFilters = {
  lodat: 'all',
  seller: 'all',
  buyer: 'all',
  price: 'all',
  commission: 'all',
  notary: 'all',
  note: 'all',
};

function parseExtra(raw: unknown): ExtraFilters {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_EXTRA };
  const extra = raw as Partial<ExtraFilters>;
  return {
    lodat: extra.lodat ?? 'all',
    seller: extra.seller ?? 'all',
    buyer: extra.buyer ?? 'all',
    price: extra.price ?? 'all',
    commission: extra.commission ?? 'all',
    notary: extra.notary ?? 'all',
    note: extra.note ?? 'all',
  };
}

const store = createListStateStore<TransactionListFields>({
  key: TRANSACTION_LIST_STATE_KEY,
  parseFields: (raw) => ({
    searchKeyword: typeof raw.searchKeyword === 'string' ? raw.searchKeyword : '',
    type: typeof raw.type === 'string' ? raw.type : '',
    status: typeof raw.status === 'string' ? raw.status : '',
    extra: parseExtra(raw.extra),
  }),
});

export function peekTransactionListState(): TransactionListSavedState | null {
  return store.peek();
}

export function saveTransactionListState(
  root: HTMLElement | null,
  fields: TransactionListFields & { selectedId: string | null },
) {
  store.save(root, fields);
}

export { getActiveListScrollEl };
