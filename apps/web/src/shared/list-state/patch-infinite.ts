import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { captureListScroll, restoreListScroll } from './scroll';
import type { CrmListPage } from './use-crm-infinite-list';

/**
 * Update one row inside infinite-list pages without refetching.
 * Prefix-matches `queryKey` (e.g. `['customers']` → every customer list).
 */
export function patchInfiniteListItem<T extends { id: string }>(
  qc: QueryClient,
  queryKey: readonly unknown[],
  id: string,
  patch: (item: T) => T,
) {
  qc.setQueriesData<InfiniteData<CrmListPage<T>>>(
    { queryKey },
    (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === id ? patch(item) : item)),
        })),
      };
    },
  );
}

/** Capture list scroll, run work (which may re-render the table), then put scroll back. */
export async function withPreservedListScroll(
  getRoot: () => HTMLElement | null,
  work: () => void | Promise<void>,
): Promise<void> {
  const snap = captureListScroll(getRoot());
  await work();
  restoreListScroll(getRoot(), snap);
}
