'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  TRANSACTION_LIST_PAGE_SIZE,
  TransactionStatus,
  TransactionType,
  type TransactionListItem,
  type TransactionListStats,
} from '@crmanhung/shared';
import { CrmAlertDialog, CrmConfirmDialog, CrmToast } from '@/shared/ui/dialog';
import {
  needsMoreListScrollHeight,
  resetListScrollIfFiltersChanged,
  useCrmInfiniteList,
} from '@/shared/list-state';
import { deleteTransaction, listTransactions } from './api';
import { type TransactionAction } from './components/action-menu';
import { FilterBar } from './components/filter-bar';
import { TransactionStats } from './components/stats';
import { TransactionCardList } from './components/transaction-card-list';
import { TransactionTable } from './components/transaction-table';
import {
  applyExtraFilters,
  countMobileTransactionFilters,
  DEFAULT_EXTRA_FILTERS,
  hasTransactionListFilters,
  type ExtraFilters,
} from './display';
import {
  getActiveListScrollEl,
  peekTransactionListState,
  restoreTransactionListScroll,
  saveTransactionListState,
  type TransactionListSavedState,
} from './list-state';
import './transactions.css';
import './transactions-table.css';
import './transactions-mobile.css';
import '@/shared/ui/money.css';

type AlertState = {
  title: string;
  message: string;
} | null;

export function TransactionListPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [extra, setExtra] = useState<ExtraFilters>(DEFAULT_EXTRA_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [alertBox, setAlertState] = useState<AlertState>(null);
  const [confirmDelete, setConfirmDelete] = useState<TransactionListItem | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [restoreReady, setRestoreReady] = useState(false);
  const [listConcealed, setListConcealed] = useState(false);
  const restoreSnap = useRef<TransactionListSavedState | null>(null);
  const restoreDone = useRef(false);
  const restoredFiltersKey = useRef<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const cardsScrollRef = useRef<HTMLDivElement>(null);
  const persistRef = useRef({
    searchKeyword: keyword,
    type,
    status,
    extra,
    selectedId,
  });
  persistRef.current = {
    searchKeyword: keyword,
    type,
    status,
    extra,
    selectedId,
  };

  const listQuery = {
    keyword: keyword.trim() || undefined,
    type: (type || undefined) as TransactionType | undefined,
    status: (status || undefined) as TransactionStatus | undefined,
  };

  const {
    query: list,
    rawItems,
    total,
    loadMoreIfNearEnd,
  } = useCrmInfiniteList<TransactionListItem>({
    queryKey: ['transactions', listQuery],
    enabled: restoreReady,
    pageSize: TRANSACTION_LIST_PAGE_SIZE,
    fetchPage: ({ limit, offset }) => listTransactions({ ...listQuery, limit, offset }),
  });

  const filtered = useMemo(() => applyExtraFilters(rawItems, extra), [rawItems, extra]);

  const apiStats = (list.data?.pages[0] as { stats?: TransactionListStats } | undefined)?.stats;
  const stats = apiStats ?? { totalRevenueVnd: 0, totalCommissionVnd: 0 };
  const mobileFilterCount = countMobileTransactionFilters(type, status);
  const filterKey = [
    keyword,
    type,
    status,
    extra.lodat,
    extra.seller,
    extra.buyer,
    extra.price,
    extra.commission,
    extra.notary,
    extra.note,
  ].join('\0');
  const filteredEmpty = hasTransactionListFilters(keyword, type, status, extra);

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  useLayoutEffect(() => {
    const snap = peekTransactionListState();
    restoreSnap.current = snap;
    if (snap) {
      setKeyword(snap.searchKeyword);
      setType(snap.type);
      setStatus(snap.status);
      setExtra(snap.extra);
      setSelectedId(snap.selectedId);
      setListConcealed(true);
    }
    setRestoreReady(true);
  }, []);

  useEffect(() => {
    if (!listConcealed) return undefined;
    const timer = window.setTimeout(() => {
      restoreDone.current = true;
      restoreSnap.current = null;
      setListConcealed(false);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [listConcealed]);

  function getListScrollEl() {
    return getActiveListScrollEl(tableScrollRef.current, cardsScrollRef.current);
  }

  function persistListState(selectedOverride?: string | null) {
    if (!restoreDone.current) return;
    saveTransactionListState(getListScrollEl(), {
      ...persistRef.current,
      selectedId: selectedOverride ?? persistRef.current.selectedId,
    });
  }

  function onListScroll() {
    loadMoreIfNearEnd(getListScrollEl());
    persistListState();
  }

  useLayoutEffect(() => {
    if (!restoreReady || list.isLoading || list.isFetchingNextPage) return;
    if (restoreDone.current) return;
    const snap = restoreSnap.current;
    if (!snap) {
      restoreDone.current = true;
      restoredFiltersKey.current = filterKey;
      return;
    }
    if (filtered.length === 0) {
      restoreDone.current = true;
      restoreSnap.current = null;
      restoredFiltersKey.current = filterKey;
      setListConcealed(false);
      return;
    }
    const root = getListScrollEl();
    const missingAnchor = snap.anchorId
      ? !root?.querySelector(`[data-list-row-id="${CSS.escape(snap.anchorId)}"]`)
      : false;
    if (
      filtered.length < total &&
      list.hasNextPage &&
      (needsMoreListScrollHeight(root, snap.scrollTop) || missingAnchor)
    ) {
      void list.fetchNextPage();
      return;
    }
    restoreTransactionListScroll(root, snap);
    restoreDone.current = true;
    restoredFiltersKey.current = filterKey;
    restoreSnap.current = null;
    setListConcealed(false);
  }, [
    restoreReady,
    filtered.length,
    total,
    list.isLoading,
    list.isFetchingNextPage,
    list.hasNextPage,
    filterKey,
  ]);

  useEffect(() => {
    if (!restoreReady || listConcealed || list.isLoading) return;
    loadMoreIfNearEnd(getListScrollEl());
  }, [restoreReady, listConcealed, list.isLoading, filtered.length, list.hasNextPage]);

  useLayoutEffect(() => {
    resetListScrollIfFiltersChanged(
      getListScrollEl(),
      restoredFiltersKey,
      filterKey,
      restoreReady && restoreDone.current && !restoreSnap.current,
    );
  }, [filterKey, restoreReady]);

  useEffect(() => {
    if (!restoreReady || listConcealed || !restoreDone.current) return;
    persistListState();
  }, [keyword, type, status, extra, selectedId, restoreReady, listConcealed]);

  useEffect(() => {
    function persist() {
      persistListState();
    }
    window.addEventListener('pagehide', persist);
    return () => {
      persist();
      window.removeEventListener('pagehide', persist);
    };
  }, []);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  function saveListBeforeLeave(id: string) {
    restoreDone.current = true;
    persistListState(id);
  }

  function handleAction(item: TransactionListItem, action: TransactionAction) {
    setMenuId(null);
    setSelectedId(item.id);
    saveListBeforeLeave(item.id);
    if (action === 'detail') {
      router.push(`/giao-dich/${item.id}`);
      return;
    }
    if (action === 'edit') {
      router.push(`/giao-dich/${item.id}/sua`);
      return;
    }
    setConfirmDelete(item);
  }

  function openDetail(id: string) {
    setSelectedId(id);
    saveListBeforeLeave(id);
    router.push(`/giao-dich/${id}`);
  }

  async function confirmRemove() {
    if (!confirmDelete) return;
    const code = confirmDelete.code;
    try {
      await deleteMut.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
      if (selectedId === confirmDelete.id) setSelectedId(null);
      flash(`Đã xóa giao dịch ${code}.`);
    } catch (err) {
      setConfirmDelete(null);
      setAlertState({
        title: 'Không xóa được giao dịch',
        message: (err as Error).message,
      });
    }
  }

  return (
    <div className="tx-page">
      <div className="tx-main">
        <TransactionStats
          count={total}
          totalRevenueVnd={stats.totalRevenueVnd}
          totalCommissionVnd={stats.totalCommissionVnd}
        />

        <section className="tx-filter-wrap" aria-label="Tìm kiếm giao dịch">
          <FilterBar
            keyword={keyword}
            onKeyword={setKeyword}
            filtersOpen={filterOpen}
            onToggleFilters={() => setFilterOpen((v) => !v)}
            type={type}
            onType={setType}
            status={status}
            onStatus={setStatus}
            hasActiveFilters={mobileFilterCount > 0}
            onResetFilters={() => {
              setType('');
              setStatus('');
            }}
          />
        </section>

        {!restoreReady || list.isLoading ? <p className="tx-status">Đang tải danh sách…</p> : null}
        {list.error ? (
          <p className="tx-status error">{(list.error as Error).message}</p>
        ) : null}

        <div className={listConcealed ? 'tx-list-restore is-restoring' : 'tx-list-restore'}>
          {restoreReady && !list.isLoading && !list.error ? (
            <section className="tx-table-shell" aria-label="Danh sách giao dịch">
              <TransactionTable
                items={filtered}
                total={total}
                selectedId={selectedId}
                menuId={menuId}
                type={type}
                status={status}
                extra={extra}
                filteredEmpty={filteredEmpty}
                loadingMore={list.isFetchingNextPage}
                onType={setType}
                onStatus={setStatus}
                onExtra={setExtra}
                onSelect={setSelectedId}
                onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
                onCloseMenu={() => setMenuId(null)}
                onAction={handleAction}
                scrollRef={tableScrollRef}
                onScroll={onListScroll}
              />
            </section>
          ) : null}

          {restoreReady && !list.isLoading && !list.error ? (
            <TransactionCardList
              items={filtered}
              total={total}
              selectedId={selectedId}
              menuId={menuId}
              filteredEmpty={filteredEmpty}
              loadingMore={list.isFetchingNextPage}
              onSelect={setSelectedId}
              onOpen={openDetail}
              onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
              onCloseMenu={() => setMenuId(null)}
              onAction={handleAction}
              scrollRef={cardsScrollRef}
              onScroll={onListScroll}
            />
          ) : null}
        </div>
      </div>

      <CrmConfirmDialog
        open={Boolean(confirmDelete)}
        title="Xóa giao dịch"
        icon={Trash2}
        message={
          confirmDelete
            ? `Bạn có chắc muốn xóa giao dịch ${confirmDelete.code}?`
            : ''
        }
        confirmLabel="Xóa"
        danger
        busy={deleteMut.isPending}
        onCancel={() => {
          if (!deleteMut.isPending) setConfirmDelete(null);
        }}
        onConfirm={() => {
          void confirmRemove();
        }}
      />

      <CrmAlertDialog
        open={Boolean(alertBox)}
        title={alertBox?.title ?? ''}
        icon={AlertTriangle}
        message={alertBox?.message ?? ''}
        onClose={() => setAlertState(null)}
      />

      <CrmToast message={toast} />
    </div>
  );
}
