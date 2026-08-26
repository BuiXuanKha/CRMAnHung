import { createListStateStore, type ListSavedState } from '@/shared/list-state';

export type PublicDashListFields = {
  searchKeyword: string;
};

export type PublicDashListSavedState = ListSavedState<PublicDashListFields>;

function parseFields(raw: Record<string, unknown>): PublicDashListFields {
  return {
    searchKeyword: typeof raw.searchKeyword === 'string' ? raw.searchKeyword : '',
  };
}

export const publicLotListState = createListStateStore<PublicDashListFields>({
  key: 'crmanhung:public-lot-list-state',
  parseFields,
});

export const publicPostListState = createListStateStore<PublicDashListFields>({
  key: 'crmanhung:public-post-list-state',
  parseFields,
});
