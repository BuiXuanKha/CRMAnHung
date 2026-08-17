'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { LodatSaleStatus } from '@crmanhung/shared';
import { CrmToast } from '@/shared/ui/dialog';
import { listLodats } from './api';
import { type LodatAction } from './components/action-menu';
import { FilterBar } from './components/filter-bar';
import { LodatTable } from './components/lodat-table';
import { applyExtraFilters, parseSearchKeyword, type ExtraFilters } from './display';
import './lodats.css';
import './lodats-table.css';
import '@/shared/ui/money.css';

const DEFAULT_EXTRA: ExtraFilters = {
  photo: 'all',
  address: 'all',
  specs: 'all',
  price: 'all',
};

export function LodatListPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [extra, setExtra] = useState<ExtraFilters>(DEFAULT_EXTRA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const search = parseSearchKeyword(keyword);
  const listQuery = {
    ...search,
    status: (status || undefined) as LodatSaleStatus | undefined,
  };

  const list = useQuery({
    queryKey: ['lodats', listQuery],
    queryFn: () => listLodats(listQuery),
  });

  const filtered = useMemo(
    () => applyExtraFilters(list.data?.items ?? [], extra),
    [list.data?.items, extra],
  );

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  function handleAction(id: string, action: LodatAction, title: string) {
    setMenuId(null);
    setSelectedId(id);
    if (action === 'detail') {
      router.push(`/lo-dat/${id}`);
      return;
    }
    if (action === 'deal') {
      flash(`Giao dịch «${title}» — sẽ làm ở màn giao dịch.`);
      return;
    }
    flash(`Sửa «${title}» — form sửa sẽ làm sau.`);
  }

  return (
    <div className="ld-page">
      <div className="ld-main">
        <section className="ld-filter-wrap" aria-label="Tìm kiếm lô đất">
          <FilterBar keyword={keyword} onKeyword={setKeyword} />
        </section>

        {list.isLoading ? <p className="ld-status">Đang tải danh sách…</p> : null}
        {list.error ? (
          <p className="ld-status error">{(list.error as Error).message}</p>
        ) : null}

        {!list.isLoading && !list.error ? (
          <section className="ld-table-shell" aria-label="Danh sách lô đất">
            <LodatTable
              items={filtered}
              total={list.data?.total ?? filtered.length}
              selectedId={selectedId}
              menuId={menuId}
              status={status}
              extra={extra}
              onStatus={setStatus}
              onExtra={setExtra}
              onSelect={setSelectedId}
              onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
              onCloseMenu={() => setMenuId(null)}
              onAction={(p, a) => handleAction(p.id, a, p.title)}
            />
          </section>
        ) : null}
      </div>

      <CrmToast message={toast} />
    </div>
  );
}
