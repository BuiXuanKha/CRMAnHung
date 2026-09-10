import { createListStateStore, type ListSavedState } from '@/shared/list-state';
import { PublicPostCategory, PublicPostStatus } from '@crmanhung/shared';
import type { ExtraFilters, PriceBracket } from '@/features/lodats/display';
import {
  DEFAULT_STAFF_LOT_EXTRA,
  type StaffLotWebFilter,
} from './display';

export type PublicPostListFields = {
  searchKeyword: string;
  category: string;
  status: string;
};

export type PublicLotListFields = {
  searchKeyword: string;
  kind: string;
  extra: ExtraFilters;
  priceBracket: PriceBracket;
  staffName: string;
  web: StaffLotWebFilter;
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

function parseExtra(raw: unknown): ExtraFilters {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STAFF_LOT_EXTRA };
  const extra = raw as Partial<ExtraFilters>;
  return {
    photo: extra.photo ?? 'all',
    address: extra.address ?? 'all',
    webBody: extra.webBody ?? 'all',
    area: extra.area ?? 'all',
    direction: extra.direction ?? 'all',
  };
}

function parseWeb(raw: unknown): StaffLotWebFilter {
  if (raw === 'published' || raw === 'pending') return raw;
  return 'all';
}

function parsePriceBracket(raw: unknown): PriceBracket {
  return typeof raw === 'string' ? (raw as PriceBracket) : '';
}

export const publicLotListState = createListStateStore<PublicLotListFields>({
  key: 'crmanhung:public-lot-list-state',
  parseFields: (raw) => ({
    searchKeyword: typeof raw.searchKeyword === 'string' ? raw.searchKeyword : '',
    kind: typeof raw.kind === 'string' ? raw.kind : '',
    extra: parseExtra(raw.extra),
    priceBracket: parsePriceBracket(raw.priceBracket),
    staffName: typeof raw.staffName === 'string' ? raw.staffName : '',
    web: parseWeb(raw.web),
  }),
});

export const publicPostListState = createListStateStore<PublicPostListFields>({
  key: 'crmanhung:public-post-list-state',
  parseFields: (raw) => ({
    searchKeyword: typeof raw.searchKeyword === 'string' ? raw.searchKeyword : '',
    category: parsePostCategory(raw.category),
    status: parsePostStatus(raw.status),
  }),
});
