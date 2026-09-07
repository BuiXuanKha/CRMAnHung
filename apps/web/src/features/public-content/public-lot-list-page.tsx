'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicWebStaffLotRow, UpdatePublicListingDraftInput } from '@crmanhung/shared';
import type { ExtraFilters, PriceBracket } from '@/features/lodats/display';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { listStaffOpenLots, setPublicLotPublished, updatePublicListingDraft } from './api';
import { LotGptContentDialog } from './components/lot-gpt-content-dialog';
import { LotListingEditorDialog } from './components/lot-listing-editor-dialog';
import type { LotGptEditorPrefill } from './lot-gpt-apply';
import { LotListingPreview } from './components/lot-listing-preview';
import { LotWebConfirm } from './components/lot-web-confirm';
import { StaffLotFilterBar } from './components/staff-lot-filter-bar';
import { StaffOpenLotCards } from './components/staff-open-lot-cards';
import { StaffOpenLotTable } from './components/staff-open-lot-table';
import {
  DEFAULT_STAFF_LOT_EXTRA,
  applyStaffLotFilters,
  countActiveStaffLotFilters,
  matchLotSearch,
  staffNameFilterOptions,
  type StaffLotWebFilter,
} from './display';
import { formatListingCrmDriftMessage } from './listing-crm-drift';
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
  const [kind, setKind] = useState(peeked?.kind ?? '');
  const [extra, setExtra] = useState<ExtraFilters>(peeked?.extra ?? DEFAULT_STAFF_LOT_EXTRA);
  const [priceBracket, setPriceBracket] = useState<PriceBracket>(peeked?.priceBracket ?? '');
  const [staffName, setStaffName] = useState(peeked?.staffName ?? '');
  const [web, setWeb] = useState<StaffLotWebFilter>(peeked?.web ?? 'all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(peeked?.selectedId ?? null);
  const [lotConfirm, setLotConfirm] = useState<PublicWebStaffLotRow | null>(null);
  const [editorLot, setEditorLot] = useState<PublicWebStaffLotRow | null>(null);
  const [editorGptPrefill, setEditorGptPrefill] = useState<LotGptEditorPrefill | null>(null);
  const [editorGptApplyId, setEditorGptApplyId] = useState(0);
  const [gptLot, setGptLot] = useState<PublicWebStaffLotRow | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: publicWebKeys.staffLots,
    queryFn: listStaffOpenLots,
  });

  const items = query.data ?? [];
  const staffOptions = useMemo(() => staffNameFilterOptions(items), [items]);
  const filtered = useMemo(
    () =>
      applyStaffLotFilters(
        items.filter((row) => matchLotSearch(row, search)),
        { kind, extra, priceBracket, staffName, web },
      ),
    [items, search, kind, extra, priceBracket, staffName, web],
  );
  const selected = items.find((row) => row.lodatId === selectedId) ?? null;
  const activeFilterCount = countActiveStaffLotFilters({
    kind,
    extra,
    priceBracket,
    staffName,
    web,
  });

  function persist(
    nextSelected: string | null,
    patch?: Partial<{
      searchKeyword: string;
      kind: string;
      extra: ExtraFilters;
      priceBracket: PriceBracket;
      staffName: string;
      web: StaffLotWebFilter;
    }>,
  ) {
    publicLotListState.save(scrollRef.current, {
      searchKeyword: patch?.searchKeyword ?? search,
      kind: patch?.kind ?? kind,
      extra: patch?.extra ?? extra,
      priceBracket: patch?.priceBracket ?? priceBracket,
      staffName: patch?.staffName ?? staffName,
      web: patch?.web ?? web,
      selectedId: nextSelected,
    });
  }

  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (root) root.scrollTop = 0;
  }, [search, kind, extra.photo, extra.address, extra.area, extra.direction, priceBracket, staffName, web]);

  const onSearch = (value: string) => {
    setSearch(value);
    persist(selectedId, { searchKeyword: value });
  };

  const onSelect = (lodatId: string) => {
    setSelectedId(lodatId);
    persist(lodatId);
  };

  const onEdit = (lodatId: string) => {
    const row = items.find((item) => item.lodatId === lodatId) ?? null;
    if (!row) return;
    setSelectedId(lodatId);
    persist(lodatId);
    setEditorError(null);
    setEditorGptPrefill(null);
    setEditorLot(row);
  };

  const onGptContent = (lodatId: string) => {
    const row = items.find((item) => item.lodatId === lodatId) ?? null;
    if (!row) return;
    setSelectedId(lodatId);
    persist(lodatId);
    setGptLot(row);
  };

  const onCrmDrift = (row: PublicWebStaffLotRow) => {
    setAlertBox({
      title: 'CRM khác bản Đăng web',
      message: `${formatListingCrmDriftMessage(row.crmDrift ?? [])}\n\nCập nhật lại bài trên Soạn đăng web nếu cần khớp CRM.`,
    });
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
      setAlertBox({ title: 'Không đăng được lô', message: err.message });
    },
  });

  const draftMut = useMutation({
    mutationFn: ({ lodatId, input }: { lodatId: string; input: UpdatePublicListingDraftInput }) =>
      updatePublicListingDraft(lodatId, input),
    onSuccess: async (updated) => {
      await invalidatePublicWebQueries(qc);
      setSelectedId(updated.lodatId);
      persist(updated.lodatId);
    },
  });

  async function saveDraft(input: UpdatePublicListingDraftInput) {
    if (!editorLot) return;
    setEditorError(null);
    try {
      const updated = await draftMut.mutateAsync({ lodatId: editorLot.lodatId, input });
      setEditorLot(null);
      flash(
        updated.isPublished
          ? `Đã cập nhật «${updated.title}» trên web khách.`
          : `Đã lưu nháp «${updated.title}».`,
      );
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Không lưu được bài đăng.');
    }
  }

  async function saveAndPublish(input: UpdatePublicListingDraftInput) {
    if (!editorLot) return;
    setEditorError(null);
    try {
      const updated = await draftMut.mutateAsync({ lodatId: editorLot.lodatId, input });
      setEditorLot(null);
      if (updated.isPublished) {
        flash(`Đã cập nhật «${updated.title}» trên web khách.`);
        return;
      }
      setLotConfirm({ ...editorLot, ...updated });
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Không lưu được bài đăng.');
    }
  }

  const editorBusy = draftMut.isPending;

  return (
    <div className="pw-page">
      <section className="pw-filter-wrap" aria-label="Tìm lô đang mở bán">
        <StaffLotFilterBar
          keyword={search}
          onKeyword={onSearch}
          filtersOpen={filterOpen}
          onToggleFilters={() => setFilterOpen((v) => !v)}
          kind={kind}
          onKind={(v) => {
            setKind(v);
            persist(selectedId, { kind: v });
          }}
          priceBracket={priceBracket}
          onPriceBracket={(v) => {
            setPriceBracket(v);
            persist(selectedId, { priceBracket: v });
          }}
          web={web}
          onWeb={(v) => {
            setWeb(v);
            persist(selectedId, { web: v });
          }}
          staffName={staffName}
          staffOptions={staffOptions}
          onStaffName={(v) => {
            setStaffName(v);
            persist(selectedId, { staffName: v });
          }}
          hasActiveFilters={activeFilterCount > 0}
          onResetFilters={() => {
            setKind('');
            setPriceBracket('');
            setWeb('all');
            setStaffName('');
            setExtra({ ...DEFAULT_STAFF_LOT_EXTRA });
            persist(selectedId, {
              kind: '',
              priceBracket: '',
              web: 'all',
              staffName: '',
              extra: { ...DEFAULT_STAFF_LOT_EXTRA },
            });
          }}
        />
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
                onEdit={onEdit}
                onGptContent={onGptContent}
                onCrmDrift={onCrmDrift}
                scrollRef={scrollRef}
                kind={kind}
                extra={extra}
                priceBracket={priceBracket}
                staffName={staffName}
                staffOptions={staffOptions}
                web={web}
                onKind={(v) => {
                  setKind(v);
                  persist(selectedId, { kind: v });
                }}
                onExtra={(next) => {
                  setExtra(next);
                  persist(selectedId, { extra: next });
                }}
                onPriceBracket={(v) => {
                  setPriceBracket(v);
                  persist(selectedId, { priceBracket: v });
                }}
                onStaffName={(v) => {
                  setStaffName(v);
                  persist(selectedId, { staffName: v });
                }}
                onWeb={(v) => {
                  setWeb(v);
                  persist(selectedId, { web: v });
                }}
              />
            </div>
            <div className="pw-list-mobile">
              <StaffOpenLotCards
                items={filtered}
                total={items.length}
                selectedId={selectedId}
                onSelect={onSelect}
                onEdit={onEdit}
                onGptContent={onGptContent}
                onCrmDrift={onCrmDrift}
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

      <LotListingEditorDialog
        lot={editorLot}
        gptPrefill={editorGptPrefill}
        gptApplyId={editorGptApplyId}
        busy={editorBusy}
        error={editorError}
        onClose={() => {
          if (!editorBusy) {
            setEditorLot(null);
            setEditorGptPrefill(null);
            setEditorGptApplyId(0);
            setEditorError(null);
          }
        }}
        onSaveDraft={saveDraft}
        onPublish={saveAndPublish}
      />
      <LotGptContentDialog
        lot={gptLot}
        onClose={() => setGptLot(null)}
        onFlash={flash}
        onApplyToEditor={(prefill) => {
          if (!gptLot) return;
          setEditorGptPrefill(prefill);
          setEditorGptApplyId((id) => id + 1);
          setEditorError(null);
          setEditorLot(gptLot);
          setGptLot(null);
          flash('Đã mở Soạn bài đăng với nội dung GPT.');
        }}
      />
      <LotWebConfirm
        lot={lotConfirm}
        busy={lotMut.isPending}
        onCancel={() => setLotConfirm(null)}
        onConfirm={() => {
          if (lotConfirm && !lotMut.isPending) {
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
