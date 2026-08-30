'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PublicPostStatus, type PublicWebPostRow } from '@crmanhung/shared';
import { getActiveListScrollEl } from '@/shared/list-state';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { createPublicPost, listPublicWebPosts, setPublicPostStatus } from './api';
import { ComposePostDialog, type ComposePostPrefill } from './components/compose-post-dialog';
import { PostGptContentDialog } from './components/post-gpt-content-dialog';
import { DashboardPostCards } from './components/dashboard-post-cards';
import { DashboardPostTable } from './components/dashboard-post-table';
import { PostFilterBar } from './components/post-filter-bar';
import { PostStatusConfirm } from './components/post-status-confirm';
import {
  applyPostFilters,
  countActivePostFilters,
  matchPostSearch,
} from './display';
import { publicPostListState } from './list-state';
import { invalidatePublicWebQueries, publicWebKeys } from './query';
import { useFlash } from './use-flash';
import './public-web-dashboard.css';
import '@/shared/ui/dialog.css';

export function PublicPostListPage() {
  const qc = useQueryClient();
  const { toast, flash } = useFlash();
  const peeked = publicPostListState.peek();
  const [search, setSearch] = useState(peeked?.searchKeyword ?? '');
  const [category, setCategory] = useState(peeked?.category ?? '');
  const [status, setStatus] = useState(peeked?.status ?? '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(peeked?.selectedId ?? null);
  const [postConfirm, setPostConfirm] = useState<PublicWebPostRow | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composePrefill, setComposePrefill] = useState<ComposePostPrefill | null>(null);
  const [gptOpen, setGptOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const cardsScrollRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: publicWebKeys.posts,
    queryFn: listPublicWebPosts,
  });

  const items = query.data ?? [];
  const filtered = useMemo(
    () =>
      applyPostFilters(
        items.filter((row) => matchPostSearch(row, search)),
        { category, status },
      ),
    [items, search, category, status],
  );
  const activeFilterCount = countActivePostFilters({ category, status });
  const hasActiveFilters = activeFilterCount > 0 || Boolean(search.trim());

  function getScrollEl() {
    return getActiveListScrollEl(tableScrollRef.current, cardsScrollRef.current);
  }

  function persist(
    nextSelected: string | null,
    patch?: Partial<{ searchKeyword: string; category: string; status: string }>,
  ) {
    publicPostListState.save(getScrollEl(), {
      searchKeyword: patch?.searchKeyword ?? search,
      category: patch?.category ?? category,
      status: patch?.status ?? status,
      selectedId: nextSelected,
    });
  }

  useLayoutEffect(() => {
    const root = getScrollEl();
    if (root) root.scrollTop = 0;
  }, [search, category, status]);

  useEffect(() => {
    function onHide() {
      persist(selectedId);
    }
    window.addEventListener('pagehide', onHide);
    return () => {
      onHide();
      window.removeEventListener('pagehide', onHide);
    };
  }, [search, category, status, selectedId]);

  const onSearch = (value: string) => {
    setSearch(value);
    persist(selectedId, { searchKeyword: value });
  };

  const onSelect = (id: string) => {
    const row = items.find((item) => item.id === id) ?? null;
    setSelectedId(id);
    persist(id);
    if (row) setPostConfirm(row);
  };

  const postMut = useMutation({
    mutationFn: (post: PublicWebPostRow) =>
      setPublicPostStatus(post.id, {
        status:
          post.status === PublicPostStatus.PUBLISHED
            ? PublicPostStatus.DRAFT
            : PublicPostStatus.PUBLISHED,
      }),
    onSuccess: async (updated) => {
      await invalidatePublicWebQueries(qc);
      setPostConfirm(null);
      flash(
        updated.status === PublicPostStatus.PUBLISHED
          ? `Đã xuất bản «${updated.title}».`
          : `Đã gỡ «${updated.title}» về nháp.`,
      );
    },
    onError: (err: Error) => {
      setAlertBox({ title: 'Không đổi được bài', message: err.message });
    },
  });

  const composeMut = useMutation({
    mutationFn: createPublicPost,
    onSuccess: async (created) => {
      await invalidatePublicWebQueries(qc);
      setComposeOpen(false);
      setComposePrefill(null);
      setFormError(null);
      setSelectedId(created.id);
      persist(created.id);
      flash(
        created.status === PublicPostStatus.PUBLISHED
          ? `Đã xuất bản «${created.title}».`
          : `Đã lưu nháp «${created.title}».`,
      );
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  return (
    <div className="pw-page">
      <header className="pw-head">
        <div>
          <h1>Bài viết</h1>
          <p>Dự án, kiến thức, liên hệ, chính sách bảo mật, tin tức…</p>
        </div>
      </header>

      <section className="pw-filter-wrap" aria-label="Thanh tìm và soạn bài">
        <PostFilterBar
          keyword={search}
          onKeyword={onSearch}
          filtersOpen={filterOpen}
          onToggleFilters={() => setFilterOpen((v) => !v)}
          category={category}
          onCategory={(v) => {
            setCategory(v);
            persist(selectedId, { category: v });
          }}
          status={status}
          onStatus={(v) => {
            setStatus(v);
            persist(selectedId, { status: v });
          }}
          hasActiveFilters={activeFilterCount > 0}
          onResetFilters={() => {
            setCategory('');
            setStatus('');
            persist(selectedId, { category: '', status: '' });
          }}
          onCompose={() => {
            setFormError(null);
            setComposePrefill(null);
            setComposeOpen(true);
          }}
          onComposeGpt={() => {
            setFormError(null);
            setGptOpen(true);
          }}
        />
      </section>

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
              scrollRef={tableScrollRef}
              onScroll={() => persist(selectedId)}
              enableFilters
              category={category}
              status={status}
              onCategory={(v) => {
                setCategory(v);
                persist(selectedId, { category: v });
              }}
              onStatus={(v) => {
                setStatus(v);
                persist(selectedId, { status: v });
              }}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
          <div className="pw-list-mobile">
            <DashboardPostCards
              items={filtered}
              total={items.length}
              selectedId={selectedId}
              onSelect={onSelect}
              heading={null}
              scrollRef={cardsScrollRef}
              onScroll={() => persist(selectedId)}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </>
      )}

      <PostStatusConfirm
        post={postConfirm}
        busy={postMut.isPending}
        onCancel={() => setPostConfirm(null)}
        onConfirm={() => {
          if (postConfirm && !postMut.isPending) void postMut.mutateAsync(postConfirm);
        }}
      />
      <PostGptContentDialog
        open={gptOpen}
        onClose={() => {
          if (!gptOpen) return;
          setGptOpen(false);
        }}
        onFlash={flash}
        onApplyToCompose={(prefill) => {
          setGptOpen(false);
          setFormError(null);
          setComposePrefill(prefill);
          setComposeOpen(true);
        }}
      />
      <ComposePostDialog
        open={composeOpen}
        busy={composeMut.isPending}
        error={formError}
        prefill={composePrefill}
        onClose={() => {
          if (composeMut.isPending) return;
          setComposeOpen(false);
          setComposePrefill(null);
        }}
        onSubmit={async (input) => {
          await composeMut.mutateAsync(input);
        }}
      />
      <CrmAlertDialog
        open={Boolean(alertBox)}
        title={alertBox?.title ?? ''}
        message={alertBox?.message ?? ''}
        onClose={() => setAlertBox(null)}
      />
      <CrmToast message={toast} />
    </div>
  );
}
