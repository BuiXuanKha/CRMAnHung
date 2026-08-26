'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CrmAlertDialog } from '@/shared/ui/dialog';
import { CrmSearchField } from '@/shared/ui/search-field';
import { listPublicWebLots } from './api';
import { DashboardLotCards } from './components/dashboard-lot-cards';
import { DashboardLotTable } from './components/dashboard-lot-table';
import { matchLotSearch } from './display';
import { publicLotListState } from './list-state';
import './public-web-dashboard.css';
import '@/shared/ui/money.css';

export function PublicLotListPage() {
  const peeked = publicLotListState.peek();
  const [search, setSearch] = useState(peeked?.searchKeyword ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(peeked?.selectedId ?? null);
  const [alertOpen, setAlertOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: ['public-web-lots'],
    queryFn: listPublicWebLots,
  });

  const items = query.data ?? [];
  const filtered = useMemo(
    () => items.filter((row) => matchLotSearch(row, search)),
    [items, search],
  );

  const onSearch = (value: string) => {
    setSearch(value);
    publicLotListState.save(scrollRef.current, {
      searchKeyword: value,
      selectedId,
    });
  };

  const onSelect = (id: string) => {
    setSelectedId(id);
    setAlertOpen(true);
    publicLotListState.save(scrollRef.current, {
      searchKeyword: search,
      selectedId: id,
    });
  };

  return (
    <div className="pw-page">
      <header className="pw-head">
        <div>
          <h1>Lô đất public mở bán</h1>
          <p>Lô khách thấy trên anhungland.com khi admin đã Đăng web.</p>
        </div>
      </header>

      <div className="pw-search-bar">
        <CrmSearchField
          value={search}
          onValueChange={onSearch}
          placeholder="Tìm tiêu đề, địa chỉ..."
          aria-label="Tìm lô public"
        />
      </div>

      {query.isLoading ? (
        <p className="pw-loading">Đang tải…</p>
      ) : (
        <>
          <div className="pw-list-desktop">
            <DashboardLotTable
              items={filtered}
              total={items.length}
              selectedId={selectedId}
              onSelect={onSelect}
              heading={null}
              scrollRef={scrollRef}
            />
          </div>
          <div className="pw-list-mobile">
            <DashboardLotCards
              items={filtered}
              total={items.length}
              onSelect={onSelect}
              heading={null}
            />
          </div>
        </>
      )}

      <CrmAlertDialog
        open={alertOpen}
        title="Lô đất public"
        message="Sửa copy, hiện giá hoặc Liên hệ, Đăng / Gỡ web — làm ở slice sau."
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
}
