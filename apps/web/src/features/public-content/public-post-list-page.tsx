'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CrmAlertDialog } from '@/shared/ui/dialog';
import { CrmSearchField } from '@/shared/ui/search-field';
import { listPublicWebPosts } from './api';
import { DashboardPostCards } from './components/dashboard-post-cards';
import { DashboardPostTable } from './components/dashboard-post-table';
import { matchPostSearch } from './display';
import { publicPostListState } from './list-state';
import './public-web-dashboard.css';

export function PublicPostListPage() {
  const peeked = publicPostListState.peek();
  const [search, setSearch] = useState(peeked?.searchKeyword ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(peeked?.selectedId ?? null);
  const [alertOpen, setAlertOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: ['public-web-posts'],
    queryFn: listPublicWebPosts,
  });

  const items = query.data ?? [];
  const filtered = useMemo(
    () => items.filter((row) => matchPostSearch(row, search)),
    [items, search],
  );

  const onSearch = (value: string) => {
    setSearch(value);
    publicPostListState.save(scrollRef.current, {
      searchKeyword: value,
      selectedId,
    });
  };

  const onSelect = (id: string) => {
    setSelectedId(id);
    setAlertOpen(true);
    publicPostListState.save(scrollRef.current, {
      searchKeyword: search,
      selectedId: id,
    });
  };

  return (
    <div className="pw-page">
      <header className="pw-head">
        <div>
          <h1>Bài viết</h1>
          <p>Dự án, kiến thức, liên hệ, chính sách bảo mật, tin tức…</p>
        </div>
      </header>

      <div className="pw-search-bar">
        <CrmSearchField
          value={search}
          onValueChange={onSearch}
          placeholder="Tìm tiêu đề, chuyên mục..."
          aria-label="Tìm bài viết"
        />
      </div>

      {query.isLoading ? (
        <p className="pw-loading">Đang tải…</p>
      ) : (
        <>
          <div className="pw-list-desktop">
            <DashboardPostTable
              items={filtered}
              total={items.length}
              selectedId={selectedId}
              onSelect={onSelect}
              heading={null}
              scrollRef={scrollRef}
            />
          </div>
          <div className="pw-list-mobile">
            <DashboardPostCards
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
        title="Bài viết"
        message="Soạn / xuất bản / gỡ nháp — làm ở slice sau."
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
}
