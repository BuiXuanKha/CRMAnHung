'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import type { PublicWebLotRow } from '@crmanhung/shared';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { CrmSearchField } from '@/shared/ui/search-field';
import { Icon } from '@/shared/ui/icon';
import { listPublicWebLots, setPublicLotPublished } from './api';
import { DashboardLotCards } from './components/dashboard-lot-cards';
import { DashboardLotTable } from './components/dashboard-lot-table';
import { LotWebConfirm } from './components/lot-web-confirm';
import { PublishLotDialog } from './components/publish-lot-dialog';
import { matchLotSearch } from './display';
import { publicLotListState } from './list-state';
import { invalidatePublicWebQueries, publicWebKeys } from './query';
import { useFlash } from './use-flash';
import './public-web-dashboard.css';
import '@/shared/ui/dialog.css';
import '@/shared/ui/money.css';

export function PublicLotListPage() {
  const qc = useQueryClient();
  const { toast, flash } = useFlash();
  const peeked = publicLotListState.peek();
  const [search, setSearch] = useState(peeked?.searchKeyword ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(peeked?.selectedId ?? null);
  const [lotConfirm, setLotConfirm] = useState<PublicWebLotRow | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: publicWebKeys.lots,
    queryFn: listPublicWebLots,
  });

  const items = query.data ?? [];
  const filtered = useMemo(
    () => items.filter((row) => matchLotSearch(row, search)),
    [items, search],
  );
  const pendingLots = items.filter((row) => !row.isPublished);

  function persist(nextSelected: string | null, nextSearch = search) {
    publicLotListState.save(scrollRef.current, {
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
    if (row) setLotConfirm(row);
  };

  const lotMut = useMutation({
    mutationFn: (lot: PublicWebLotRow) =>
      setPublicLotPublished(lot.id, { isPublished: !lot.isPublished }),
    onSuccess: async (updated) => {
      await invalidatePublicWebQueries(qc);
      setLotConfirm(null);
      flash(
        updated.isPublished
          ? `Đã đăng «${updated.title}» lên web khách.`
          : `Đã gỡ «${updated.title}» khỏi web khách.`,
      );
    },
    onError: (err: Error) => {
      setAlertBox({ title: 'Không đổi được lô', message: err.message });
    },
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => setPublicLotPublished(id, { isPublished: true }),
    onSuccess: async (updated) => {
      await invalidatePublicWebQueries(qc);
      setPublishOpen(false);
      setFormError(null);
      setSelectedId(updated.id);
      persist(updated.id);
      flash(`Đã đăng «${updated.title}» lên web khách.`);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

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
        <button
          type="button"
          className="crm-btn primary"
          onClick={() => {
            setFormError(null);
            setPublishOpen(true);
          }}
        >
          <Icon icon={Globe} size="sm" /> Đăng lô
        </button>
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

      <LotWebConfirm
        lot={lotConfirm}
        busy={lotMut.isPending}
        onCancel={() => setLotConfirm(null)}
        onConfirm={() => {
          if (lotConfirm && !lotMut.isPending) void lotMut.mutateAsync(lotConfirm);
        }}
      />
      <PublishLotDialog
        open={publishOpen}
        pendingLots={pendingLots}
        busy={publishMut.isPending}
        error={formError}
        onClose={() => {
          if (!publishMut.isPending) setPublishOpen(false);
        }}
        onPublish={async (id) => {
          await publishMut.mutateAsync(id);
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
