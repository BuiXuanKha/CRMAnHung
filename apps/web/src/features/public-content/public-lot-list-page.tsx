'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicWebStaffLotRow } from '@crmanhung/shared';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { CrmSearchField } from '@/shared/ui/search-field';
import { listStaffOpenLots, setPublicLotPublished } from './api';
import { LotListingPreview } from './components/lot-listing-preview';
import { LotWebConfirm } from './components/lot-web-confirm';
import { StaffOpenLotCards } from './components/staff-open-lot-cards';
import { StaffOpenLotTable } from './components/staff-open-lot-table';
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
  const [lotConfirm, setLotConfirm] = useState<PublicWebStaffLotRow | null>(null);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: publicWebKeys.staffLots,
    queryFn: listStaffOpenLots,
  });

  const items = query.data ?? [];
  const filtered = useMemo(
    () => items.filter((row) => matchLotSearch(row, search)),
    [items, search],
  );
  const selected = items.find((row) => row.lodatId === selectedId) ?? null;

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

  const onSelect = (lodatId: string) => {
    setSelectedId(lodatId);
    persist(lodatId);
  };

  const lotMut = useMutation({
    mutationFn: (lot: PublicWebStaffLotRow) =>
      setPublicLotPublished(lot.lodatId, { isPublished: true }),
    onSuccess: async (updated) => {
      await invalidatePublicWebQueries(qc);
      setLotConfirm(null);
      setSelectedId(updated.lodatId);
      persist(updated.lodatId);
      flash(`Đã đăng «${updated.title}» lên web khách.`);
    },
    onError: (err: Error) => {
      setAlertBox({ title: 'Không đổi được lô', message: err.message });
    },
  });

  return (
    <div className="pw-page">
      <section className="pw-filter-wrap" aria-label="Tìm lô đang mở bán">
        <div className="pw-filter">
          <CrmSearchField
            className="pw-search"
            value={search}
            onValueChange={onSearch}
            placeholder="Tìm tiêu đề, địa chỉ, nhân viên..."
            aria-label="Tìm lô đang mở bán"
          />
        </div>
      </section>

      {query.isLoading ? (
        <p className="pw-loading">Đang tải…</p>
      ) : (
        <div className="pw-split">
          <div className="pw-split-list">
            <div className="pw-list-desktop">
              <StaffOpenLotTable
                items={filtered}
                total={items.length}
                selectedId={selectedId}
                onSelect={onSelect}
                scrollRef={scrollRef}
              />
            </div>
            <div className="pw-list-mobile">
              <StaffOpenLotCards
                items={filtered}
                total={items.length}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </div>
          </div>
          <LotListingPreview
            lot={selected}
            busy={lotMut.isPending}
            onPublish={() => {
              if (selected && !selected.isPublished) setLotConfirm(selected);
            }}
          />
        </div>
      )}

      <LotWebConfirm
        lot={lotConfirm}
        busy={lotMut.isPending}
        onCancel={() => setLotConfirm(null)}
        onConfirm={() => {
          if (lotConfirm && !lotConfirm.isPublished && !lotMut.isPending) {
            void lotMut.mutateAsync(lotConfirm);
          }
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
