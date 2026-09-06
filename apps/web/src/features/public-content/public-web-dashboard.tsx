'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FilePlus } from 'lucide-react';
import { PublicPostStatus, type PublicWebPostRow } from '@crmanhung/shared';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import '@/shared/ui/dialog.css';
import { Icon } from '@/shared/ui/icon';
import { createPublicPost, getPublicWebDashboard, setPublicPostStatus } from './api';
import { ComposePostDialog } from './components/compose-post-dialog';
import { DashboardLotCards } from './components/dashboard-lot-cards';
import { DashboardLotTable } from './components/dashboard-lot-table';
import { DashboardPostCards } from './components/dashboard-post-cards';
import { DashboardPostTable } from './components/dashboard-post-table';
import { DashboardStats } from './components/dashboard-stats';
import { PostStatusConfirm } from './components/post-status-confirm';
import { invalidatePublicWebQueries, publicWebKeys } from './query';
import { useFlash } from './use-flash';
import './public-web-dashboard.css';
import '@/shared/ui/money.css';

export function PublicWebDashboard() {
  const qc = useQueryClient();
  const { toast, flash } = useFlash();
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postConfirm, setPostConfirm] = useState<PublicWebPostRow | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(null);

  const query = useQuery({
    queryKey: publicWebKeys.dashboard,
    queryFn: getPublicWebDashboard,
  });

  const data = query.data;
  const lotTotal = data ? data.publishedLotCount + data.pendingLotCount : 0;
  const postTotal = data ? data.publishedPostCount + data.draftPostCount : 0;

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
      setSelectedPostId(created.id);
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
          <h1>Dashboard</h1>
          <p>Khách trên anhungland.com chỉ thấy lô và bài đã đăng.</p>
        </div>
        <div className="pw-head-actions">
          <Link href="/" className="crm-btn" target="_blank" rel="noreferrer">
            <Icon icon={ExternalLink} size="sm" /> Xem trang khách
          </Link>
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
      </header>

      {query.isLoading || !data ? (
        <p className="pw-loading">Đang tải…</p>
      ) : (
        <>
          <DashboardStats
            publishedLotCount={data.publishedLotCount}
            pendingLotCount={data.pendingLotCount}
            publishedPostCount={data.publishedPostCount}
            draftPostCount={data.draftPostCount}
          />

          <div className="pw-panels pw-panels-desktop">
            <DashboardLotTable
              items={data.recentLots}
              total={lotTotal}
              selectedId={selectedLotId}
              onSelect={setSelectedLotId}
            />
            <DashboardPostTable
              items={data.recentPosts}
              total={postTotal}
              selectedId={selectedPostId}
              onSelect={(id) => {
                const row = data.recentPosts.find((item) => item.id === id);
                setSelectedPostId(id);
                if (row) setPostConfirm(row);
              }}
            />
          </div>

          <div className="pw-panels pw-panels-mobile">
            <DashboardLotCards
              items={data.recentLots}
              total={lotTotal}
              onSelect={setSelectedLotId}
            />
            <DashboardPostCards
              items={data.recentPosts}
              total={postTotal}
              onSelect={(id) => {
                const row = data.recentPosts.find((item) => item.id === id);
                setSelectedPostId(id);
                if (row) setPostConfirm(row);
              }}
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
