import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { captureListScroll, restoreListScroll, type ListScrollSnapshot } from './scroll';
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

/**
 * Capture list scroll, run work (which may re-render the table / close a modal),
 * then put scroll back on the **same** element.
 *
 * Pass `snapshot` when scroll was captured *before* a dialog opened — opening
 * `CrmDialog` used to zero the table `scrollTop`, so capturing at save time
 * would restore 0.
 */
export async function withPreservedListScroll(
  getRoot: () => HTMLElement | null,
  work: () => void | Promise<void>,
  snapshot?: ListScrollSnapshot | null,
): Promise<void> {
  const root = getRoot();
  const snap = snapshot ?? captureListScroll(root);
  await work();
  const el =
    root && typeof document !== 'undefined' && document.contains(root) ? root : getRoot();
  restoreListScroll(el, snap);
}
