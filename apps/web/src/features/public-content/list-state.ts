import { createListStateStore, type ListSavedState } from '@/shared/list-state';
import { PublicPostCategory, PublicPostStatus } from '@crmanhung/shared';

export type PublicPostListFields = {
  searchKeyword: string;
  category: string;
  status: string;
};

export type PublicPostListSavedState = ListSavedState<PublicPostListFields>;

const POST_CATEGORIES = new Set<string>(Object.values(PublicPostCategory));

function parsePostCategory(raw: unknown): string {
  return typeof raw === 'string' && POST_CATEGORIES.has(raw) ? raw : '';
}

function parsePostStatus(raw: unknown): string {
  if (raw === PublicPostStatus.PUBLISHED || raw === PublicPostStatus.DRAFT) return raw;
  return '';
}

export const publicPostListState = createListStateStore<PublicPostListFields>({
  key: 'crmanhung:public-post-list-state',
  parseFields: (raw) => ({
    searchKeyword: typeof raw.searchKeyword === 'string' ? raw.searchKeyword : '',
    category: parsePostCategory(raw.category),
    status: parsePostStatus(raw.status),
  }),
});
