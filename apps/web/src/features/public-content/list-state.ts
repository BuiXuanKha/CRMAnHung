import { createListStateStore, type ListSavedState } from '@/shared/list-state';
import type { ExtraFilters, PriceBracket } from '@/features/lodats/display';
import {
  DEFAULT_STAFF_LOT_EXTRA,
  type StaffLotWebFilter,
} from './display';

export type PublicDashListFields = {
  searchKeyword: string;
};

export type PublicLotListFields = {
  searchKeyword: string;
  kind: string;
  extra: ExtraFilters;
  priceBracket: PriceBracket;
  staffName: string;
  web: StaffLotWebFilter;
};

export type PublicDashListSavedState = ListSavedState<PublicDashListFields>;

function parseFields(raw: Record<string, unknown>): PublicDashListFields {
  return {
    searchKeyword: typeof raw.searchKeyword === 'string' ? raw.searchKeyword : '',
  };
}

function parseExtra(raw: unknown): ExtraFilters {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STAFF_LOT_EXTRA };
  const extra = raw as Partial<ExtraFilters>;
  return {
    photo: extra.photo ?? 'all',
    address: extra.address ?? 'all',
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

export const publicPostListState = createListStateStore<PublicDashListFields>({
  key: 'crmanhung:public-post-list-state',
  parseFields,
});
