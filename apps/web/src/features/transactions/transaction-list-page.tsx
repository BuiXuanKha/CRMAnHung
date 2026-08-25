'use client';

import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  TransactionStatus,
  TransactionType,
  type TransactionListItem,
} from '@crmanhung/shared';
import { CrmAlertDialog, CrmConfirmDialog, CrmToast } from '@/shared/ui/dialog';
import { deleteTransaction, listTransactions, statsFromItems } from './api';
import { type TransactionAction } from './components/action-menu';
import { FilterBar } from './components/filter-bar';
import { TransactionStats } from './components/stats';
import { TransactionCardList } from './components/transaction-card-list';
import { TransactionTable } from './components/transaction-table';
import { applyExtraFilters, countMobileTransactionFilters, type ExtraFilters } from './display';
import { peekTransactionListState, saveTransactionListState } from './list-state';
import './transactions.css';
import './transactions-table.css';
import './transactions-mobile.css';
import '@/shared/ui/money.css';

const DEFAULT_EXTRA: ExtraFilters = {
  lodat: 'all',
  seller: 'all',
  buyer: 'all',
  price: 'all',
  commission: 'all',
  notary: 'all',
  note: 'all',
};

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
  const [extra, setExtra] = useState<ExtraFilters>(DEFAULT_EXTRA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<AlertState>(null);
  const [confirmDelete, setConfirmDelete] = useState<TransactionListItem | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useLayoutEffect(() => {
    const snap = peekTransactionListState();
    if (!snap) return;
    setKeyword(snap.searchKeyword);
    setType(snap.type);
    setStatus(snap.status);
    setExtra(snap.extra);
    setSelectedId(snap.selectedId);
  }, []);

  useEffect(() => {
    saveTransactionListState(null, {
      searchKeyword: keyword,
      type,
      status,
      extra,
      selectedId,
    });
  }, [keyword, type, status, extra, selectedId]);

  const listQuery = {
    keyword: keyword.trim() || undefined,
    type: (type || undefined) as TransactionType | undefined,
    status: (status || undefined) as TransactionStatus | undefined,
  };

  const list = useQuery({
    queryKey: ['transactions', listQuery],
    queryFn: () => listTransactions(listQuery),
  });

  const filtered = useMemo(
    () => applyExtraFilters(list.data?.items ?? [], extra),
    [list.data?.items, extra],
  );

  const stats = useMemo(() => statsFromItems(filtered), [filtered]);
  const mobileFilterCount = countMobileTransactionFilters(type, status);

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  function handleAction(item: TransactionListItem, action: TransactionAction) {
    setMenuId(null);
    setSelectedId(item.id);
    if (action === 'detail') {
      saveTransactionListState(null, {
        searchKeyword: keyword,
        type,
        status,
        extra,
        selectedId: item.id,
      });
      router.push(`/giao-dich/${item.id}`);
      return;
    }
    if (action === 'edit') {
      saveTransactionListState(null, {
        searchKeyword: keyword,
        type,
        status,
        extra,
        selectedId: item.id,
      });
      router.push(`/giao-dich/${item.id}/sua`);
      return;
    }
    setConfirmDelete(item);
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
      setAlertBox({
        title: 'Không xóa được giao dịch',
        message: (err as Error).message,
      });
    }
  }

  return (
    <div className="tx-page">
      <div className="tx-main">
        <TransactionStats
          count={filtered.length}
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

        {list.isLoading ? <p className="tx-status">Đang tải danh sách…</p> : null}
        {list.error ? (
          <p className="tx-status error">{(list.error as Error).message}</p>
        ) : null}

        {!list.isLoading && !list.error ? (
          <section className="tx-table-shell" aria-label="Danh sách giao dịch">
            <TransactionTable
              items={filtered}
              total={list.data?.total ?? filtered.length}
              selectedId={selectedId}
              menuId={menuId}
              type={type}
              status={status}
              extra={extra}
              onType={setType}
              onStatus={setStatus}
              onExtra={setExtra}
              onSelect={setSelectedId}
              onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
              onCloseMenu={() => setMenuId(null)}
              onAction={handleAction}
            />
          </section>
        ) : null}

        {!list.isLoading && !list.error ? (
          <TransactionCardList
            items={filtered}
            total={list.data?.total ?? filtered.length}
            selectedId={selectedId}
            menuId={menuId}
            onSelect={setSelectedId}
            onOpen={(id) => {
              setSelectedId(id);
              router.push(`/giao-dich/${id}`);
            }}
            onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
            onCloseMenu={() => setMenuId(null)}
            onAction={handleAction}
          />
        ) : null}
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
        onClose={() => setAlertBox(null)}
      />

      <CrmToast message={toast} />
    </div>
  );
}
