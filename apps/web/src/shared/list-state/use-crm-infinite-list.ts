'use client';

import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

/** Mặc định list CRM: tải 50 dòng/trang, cuộn gần đáy 160px thì nối thêm. */
export const CRM_LIST_PAGE_SIZE = 50;
export const CRM_LIST_LOAD_MORE_PX = 160;

export type CrmListPage<T> = { items: T[]; total: number };

type Options<T> = {
  queryKey: readonly unknown[];
  /** Gọi API một trang — nhận limit/offset. */
  fetchPage: (page: { limit: number; offset: number }) => Promise<CrmListPage<T>>;
  enabled?: boolean;
  pageSize?: number;
  loadMorePx?: number;
};

/**
 * Hook chung cho list CRM «tải 50 dòng, cuộn thì nối thêm»
 * (customers.md / lodats.md §12.1.5). Trang dùng:
 *
 * - `rawItems` / `total` để render + footer «Hiển thị N / Tổng M»
 * - `loadMoreIfNearEnd(el)` trong onScroll + effect auto-fill khi list ngắn
 * - `query` (useInfiniteQuery) cho isLoading / isFetchingNextPage / hasNextPage
 */
export function useCrmInfiniteList<T>({
  queryKey,
  fetchPage,
  enabled = true,
  pageSize = CRM_LIST_PAGE_SIZE,
  loadMorePx = CRM_LIST_LOAD_MORE_PX,
}: Options<T>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchPage({ limit: pageSize, offset: pageParam as number }),
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage: CrmListPage<T>, allPages: CrmListPage<T>[]) => {
      const loaded = allPages.reduce((n, page) => n + page.items.length, 0);
      if (loaded >= lastPage.total || lastPage.items.length === 0) return undefined;
      return loaded;
    },
  });

  const rawItems = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );
  const total = query.data?.pages[0]?.total ?? 0;

  const { hasNextPage, isFetchingNextPage, isLoading, fetchNextPage } = query;

  const loadMoreIfNearEnd = useCallback(
    (root: HTMLElement | null) => {
      if (!root || !hasNextPage || isFetchingNextPage || isLoading) return;
      const nearBottom =
        root.scrollHeight - root.scrollTop - root.clientHeight < loadMorePx;
      const notScrollable = root.scrollHeight <= root.clientHeight + 2;
      if (nearBottom || notScrollable) {
        void fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, loadMorePx],
  );

  return { query, rawItems, total, loadMoreIfNearEnd };
}
