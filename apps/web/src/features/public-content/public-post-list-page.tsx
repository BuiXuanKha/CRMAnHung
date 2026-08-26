'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FilePlus } from 'lucide-react';
import { PublicPostStatus, type PublicWebPostRow } from '@crmanhung/shared';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { CrmSearchField } from '@/shared/ui/search-field';
import { Icon } from '@/shared/ui/icon';
import { createPublicPost, listPublicWebPosts, setPublicPostStatus } from './api';
import { ComposePostDialog } from './components/compose-post-dialog';
import { DashboardPostCards } from './components/dashboard-post-cards';
import { DashboardPostTable } from './components/dashboard-post-table';
import { PostStatusConfirm } from './components/post-status-confirm';
import { matchPostSearch } from './display';
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
  const [selectedId, setSelectedId] = useState<string | null>(peeked?.selectedId ?? null);
  const [postConfirm, setPostConfirm] = useState<PublicWebPostRow | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: publicWebKeys.posts,
    queryFn: listPublicWebPosts,
  });

  const items = query.data ?? [];
  const filtered = useMemo(
    () => items.filter((row) => matchPostSearch(row, search)),
    [items, search],
  );

  function persist(nextSelected: string | null, nextSearch = search) {
    publicPostListState.save(scrollRef.current, {
      searchKeyword: nextSearch,
      selectedId: nextSelected,
    });
  }

  const onSearch = (value: string) => {
    setSearch(value);
    persist(selectedId, value);
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

      <section className="pw-filter-wrap" aria-label="Tìm bài viết">
        <div className="pw-filter">
          <CrmSearchField
            className="pw-search"
            value={search}
            onValueChange={onSearch}
            placeholder="Tìm tiêu đề, chuyên mục..."
            aria-label="Tìm bài viết"
          />
          <button
            type="button"
            className="crm-btn primary"
            onClick={() => {
              setFormError(null);
              setComposeOpen(true);
            }}
          >
            <Icon icon={FilePlus} size="sm" /> Soạn bài
          </button>
        </div>
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

      <PostStatusConfirm
        post={postConfirm}
        busy={postMut.isPending}
        onCancel={() => setPostConfirm(null)}
        onConfirm={() => {
          if (postConfirm && !postMut.isPending) void postMut.mutateAsync(postConfirm);
        }}
      />
      <ComposePostDialog
        open={composeOpen}
        busy={composeMut.isPending}
        error={formError}
        onClose={() => {
          if (!composeMut.isPending) setComposeOpen(false);
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
