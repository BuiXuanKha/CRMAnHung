'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import {
  LodatKind,
  LodatSaleStatus,
  TaskTargetType,
  UserRole,
  type LodatDetail,
  type LodatImage,
  type LodatListItem,
  type LodatListQuery,
  type LodatListingStatus,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import { needsMoreListScrollHeight, resetListScrollIfFiltersChanged, useCrmInfiniteList } from '@/shared/list-state';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { useAuth } from '@/features/auth/auth-context';
import { useCreateTaskModal } from '@/features/tasks/use-create-task-modal';
import { LotGptContentDialog } from '@/features/public-content/components/lot-gpt-content-dialog';
import { getLodat, listLodats, updateLodatImageRotation, updateLodatSaleStatus } from './api';
import { type LodatAction } from './components/action-menu';
import { createTransactionHref } from './transaction-href';
import { FilterBar } from './components/filter-bar';
import { LodatCardList } from './components/lodat-card-list';
import { LodatImageGallery } from './components/lodat-image-gallery';
import { LodatTable } from './components/lodat-table';
import { lodatListItemToGptLot } from './lodat-to-gpt-lot';
import {
  DEFAULT_STATUS_COL_FILTERS,
  countMobileLodatFilters,
  mobileStatusFromCols,
  parseSearchKeyword,
  resolveStatusColFilters,
  statusColsFromMobileStatus,
  type ExtraFilters,
  type PriceBracket,
  type StatusColFilters,
} from './display';
import {
  getActiveListScrollEl,
  peekLodatListState,
  restoreLodatListScroll,
  saveLodatListState,
  type LodatListSavedState,
} from './list-state';
import './lodats.css';
import './lodats-table.css';
import './lodats-mobile.css';
import '@/shared/ui/money.css';

const DEFAULT_EXTRA: ExtraFilters = {
  photo: 'all',
  address: 'all',
  webBody: 'all',
  area: 'all',
  direction: 'all',
};

type AlertState = {
  title: string;
  message: string;
  icon?: LucideIcon;
  confirmLabel?: string;
} | null;

function galleryImagesFromDetail(detail: LodatDetail): LodatImage[] {
  if (detail.images?.length) return detail.images;
  if (detail.imageUrls?.length) {
    return detail.imageUrls.map((url) => ({
      id: null,
      url,
      rotationDeg: 0,
      source: 'lodat' as const,
    }));
  }
  if (detail.coverImageUrl) {
    return [
      {
        id: null,
        url: detail.coverImageUrl,
        rotationDeg: 0,
        source: 'lodat' as const,
      },
    ];
  }
  return [];
}

export function LodatListPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [statusCols, setStatusCols] = useState<StatusColFilters>({
    ...DEFAULT_STATUS_COL_FILTERS,
  });
  const [kind, setKind] = useState('');
  const [extra, setExtra] = useState<ExtraFilters>(DEFAULT_EXTRA);
  const [priceBracket, setPriceBracket] = useState<PriceBracket>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<AlertState>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [galleryLodatId, setGalleryLodatId] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [gptLot, setGptLot] = useState<PublicWebStaffLotRow | null>(null);
  const [restoreReady, setRestoreReady] = useState(false);
  const [listConcealed, setListConcealed] = useState(false);
  const restoreSnap = useRef<LodatListSavedState | null>(null);
  const restoreDone = useRef(false);
  const restoredFiltersKey = useRef<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const cardsScrollRef = useRef<HTMLDivElement>(null);
  const persistRef = useRef({
    searchKeyword: keyword,
    statusCols,
    kind,
    extra,
    priceBracket,
    selectedId,
  });
  persistRef.current = {
    searchKeyword: keyword,
    statusCols,
    kind,
    extra,
    priceBracket,
    selectedId,
  };

  const search = parseSearchKeyword(keyword);
  const searchOverridesStatus = Boolean(search.includePaused || search.pausedOnly);
  const statusResolved = resolveStatusColFilters(statusCols);
  // Lọc cột đẩy xuống API để phân trang đúng (§12.1.2)
  const listQuery: LodatListQuery = {
    ...search,
    status: undefined,
    statusIn: searchOverridesStatus
      ? undefined
      : statusResolved === 'all'
        ? undefined
        : statusResolved === 'empty'
          ? []
          : statusResolved,
    includePaused:
      searchOverridesStatus
        ? Boolean(search.includePaused)
        : statusResolved === 'all',
    kind: (kind || undefined) as LodatKind | undefined,
    priceBracket: priceBracket || undefined,
    areaBracket: extra.area !== 'all' ? extra.area : undefined,
    direction: extra.direction !== 'all' ? extra.direction : undefined,
    photo: extra.photo !== 'all' ? extra.photo : undefined,
    addressFilter: extra.address !== 'all' ? extra.address : undefined,
    webBody: extra.webBody !== 'all' ? extra.webBody : undefined,
  };

  const {
    query: list,
    rawItems,
    total,
    loadMoreIfNearEnd,
  } = useCrmInfiniteList<LodatListItem>({
    queryKey: ['lodats', listQuery],
    enabled: restoreReady,
    fetchPage: ({ limit, offset }) => listLodats({ ...listQuery, limit, offset }),
  });

  const galleryQ = useQuery({
    queryKey: ['lodat', galleryLodatId],
    queryFn: () => getLodat(galleryLodatId!),
    enabled: Boolean(galleryLodatId),
  });

  const galleryImages = useMemo(
    () => (galleryQ.data ? galleryImagesFromDetail(galleryQ.data) : []),
    [galleryQ.data],
  );

  useEffect(() => {
    if (!galleryLodatId || !galleryQ.isError) return;
    setAlertBox({
      title: 'Không mở được ảnh',
      message: (galleryQ.error as Error).message || 'Không tải được ảnh lô đất.',
    });
    setGalleryLodatId(null);
  }, [galleryLodatId, galleryQ.isError, galleryQ.error]);

  useEffect(() => {
    if (!galleryLodatId || galleryQ.isLoading || galleryQ.isError) return;
    if (galleryImages.length === 0) {
      setAlertBox({
        title: 'Chưa có ảnh',
        message: 'Lô đất này chưa có hình ảnh để xem.',
      });
      setGalleryLodatId(null);
    }
  }, [galleryLodatId, galleryQ.isLoading, galleryQ.isError, galleryImages.length]);

  const items = rawItems;
  const mobileFilterCount = countMobileLodatFilters(statusCols, priceBracket);
  const filterKey = [
    keyword,
    statusCols.open,
    statusCols.paused,
    statusCols.off,
    kind,
    extra.photo,
    extra.address,
    extra.webBody,
    extra.area,
    extra.direction,
    priceBracket,
  ].join('\0');
  const mobileStatus = mobileStatusFromCols(statusCols);

  const toggleMut = useMutation({
    mutationFn: ({
      plot,
      next,
    }: {
      plot: LodatListItem;
      next: LodatListingStatus;
    }) => updateLodatSaleStatus(plot.id, { status: next }),
    onSuccess: async (updated) => {
      await qc.invalidateQueries({ queryKey: ['lodats'] });
      if (updated.status === LodatSaleStatus.TAM_DUNG) {
        flash(`Đã dừng bán «${updated.title}».`);
      } else if (updated.status === LodatSaleStatus.KHONG_BAN) {
        flash(`Đã chuyển «${updated.title}» sang Không bán.`);
      } else {
        flash(`Đã mở bán «${updated.title}».`);
      }
    },
    onError: (err: Error) => {
      setAlertBox({
        title: 'Không đổi được trạng thái',
        message: err.message,
      });
    },
  });

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  const { openTaskModal, dialog: createTaskDialog } = useCreateTaskModal(() =>
    flash('Đã thêm công việc.'),
  );

  useLayoutEffect(() => {
    const snap = peekLodatListState();
    restoreSnap.current = snap;
    if (snap) {
      setKeyword(snap.searchKeyword);
      setStatusCols(snap.statusCols);
      setKind(snap.kind);
      setExtra(snap.extra);
      setPriceBracket(snap.priceBracket);
      setSelectedId(snap.selectedId);
      setListConcealed(true);
    }
    setRestoreReady(true);
  }, []);

  useEffect(() => {
    if (!listConcealed) return undefined;
    const timer = window.setTimeout(() => {
      restoreDone.current = true;
      restoreSnap.current = null;
      setListConcealed(false);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [listConcealed]);

  function getListScrollEl() {
    return getActiveListScrollEl(tableScrollRef.current, cardsScrollRef.current);
  }

  function persistListState(selectedOverride?: string | null) {
    if (!restoreDone.current) return;
    saveLodatListState(getListScrollEl(), {
      ...persistRef.current,
      selectedId: selectedOverride ?? persistRef.current.selectedId,
    });
  }

  function onListScroll() {
    loadMoreIfNearEnd(getListScrollEl());
    persistListState();
  }

  useLayoutEffect(() => {
    if (!restoreReady || list.isLoading || list.isFetchingNextPage) return;
    if (restoreDone.current) return;
    const snap = restoreSnap.current;
    if (!snap) {
      restoreDone.current = true;
      restoredFiltersKey.current = filterKey;
      return;
    }
    if (items.length === 0) {
      restoreDone.current = true;
      restoreSnap.current = null;
      restoredFiltersKey.current = filterKey;
      setListConcealed(false);
      return;
    }
    const root = getListScrollEl();
    const missingAnchor = snap.anchorId
      ? !root?.querySelector(`[data-list-row-id="${CSS.escape(snap.anchorId)}"]`)
      : false;
    // Chưa đủ chiều cao / chưa có thẻ đã nhớ → nạp thêm trang rồi mới đặt scroll
    if (
      items.length < total &&
      list.hasNextPage &&
      (needsMoreListScrollHeight(root, snap.scrollTop) || missingAnchor)
    ) {
      void list.fetchNextPage();
      return;
    }
    restoreLodatListScroll(root, snap);
    restoreDone.current = true;
    restoredFiltersKey.current = filterKey;
    restoreSnap.current = null;
    setListConcealed(false);
  }, [
    restoreReady,
    items.length,
    total,
    list.isLoading,
    list.isFetchingNextPage,
    list.hasNextPage,
    filterKey,
  ]);

  // List ngắn hơn khung (màn cao / lọc chặt) → tự nạp thêm cho đủ cuộn
  useEffect(() => {
    if (!restoreReady || listConcealed || list.isLoading) return;
    loadMoreIfNearEnd(getListScrollEl());
  }, [restoreReady, listConcealed, list.isLoading, items.length, list.hasNextPage]);

  function saveListBeforeLeave(selectedOverride?: string | null) {
    restoreDone.current = true;
    persistListState(selectedOverride);
  }

  useLayoutEffect(() => {
    resetListScrollIfFiltersChanged(
      getListScrollEl(),
      restoredFiltersKey,
      filterKey,
      restoreReady && restoreDone.current && !restoreSnap.current,
    );
  }, [filterKey, restoreReady]);

  useEffect(() => {
    if (!restoreReady || listConcealed || !restoreDone.current) return;
    persistListState();
  }, [keyword, statusCols, kind, extra, priceBracket, selectedId, restoreReady, listConcealed]);

  useEffect(() => {
    function persist() {
      persistListState();
    }
    window.addEventListener('pagehide', persist);
    return () => {
      persist();
      window.removeEventListener('pagehide', persist);
    };
  }, []);

  function handleAction(id: string, action: LodatAction) {
    setMenuId(null);
    setSelectedId(id);
    if (action === 'task') {
      const plot = rawItems.find((p) => p.id === id);
      openTaskModal({
        type: TaskTargetType.LODAT,
        id,
        label: plot?.title?.trim() || 'Lô đất',
      });
      return;
    }
    saveListBeforeLeave(id);
    if (action === 'detail') {
      router.push(`/lo-dat/${id}`);
      return;
    }
    if (action === 'deal') {
      if (user?.role === UserRole.ADMIN) {
        setAlertBox({
          title: 'Không tạo giao dịch',
          message: 'Admin không tạo giao dịch. Nhân viên tạo giao dịch từ lô của mình.',
        });
        return;
      }
      router.push(createTransactionHref(id));
      return;
    }
    router.push(`/lo-dat/${id}/sua`);
  }

  function handleSetSaleStatus(plot: LodatListItem, next: LodatListingStatus) {
    if (toggleMut.isPending) return;
    if (plot.status === next) return;
    setMenuId(null);
    void toggleMut.mutateAsync({ plot, next });
  }

  function openGallery(plot: LodatListItem) {
    setMenuId(null);
    setSelectedId(plot.id);
    setGalleryIndex(0);
    setGalleryLodatId(plot.id);
  }

  function openLodat(id: string) {
    saveListBeforeLeave(id);
    router.push(`/lo-dat/${id}`);
  }

  return (
    <div className="ld-page">
      <div className="ld-main">
        <section className="ld-filter-wrap" aria-label="Tìm kiếm lô đất">
          <FilterBar
            keyword={keyword}
            onKeyword={setKeyword}
            filtersOpen={filterOpen}
            onToggleFilters={() => setFilterOpen((v) => !v)}
            status={mobileStatus}
            onStatus={(v) => setStatusCols(statusColsFromMobileStatus(v))}
            priceBracket={priceBracket}
            onPriceBracket={setPriceBracket}
            hasActiveFilters={mobileFilterCount > 0}
            onResetFilters={() => {
              setStatusCols({ ...DEFAULT_STATUS_COL_FILTERS });
              setPriceBracket('');
            }}
          />
        </section>

        {!restoreReady || list.isLoading ? <p className="ld-status">Đang tải danh sách…</p> : null}
        {list.error ? (
          <p className="ld-status error">{(list.error as Error).message}</p>
        ) : null}

        <div className={listConcealed ? 'ld-list-restore is-restoring' : 'ld-list-restore'}>
          {restoreReady && !list.isLoading && !list.error ? (
            <section className="ld-table-shell" aria-label="Danh sách lô đất">
              <LodatTable
                items={items}
                total={total || items.length}
                loadingMore={list.isFetchingNextPage}
                selectedId={selectedId}
                menuId={menuId}
                statusCols={statusCols}
                kind={kind}
                extra={extra}
                priceBracket={priceBracket}
                togglingId={toggleMut.isPending ? (toggleMut.variables?.plot.id ?? null) : null}
                onStatusCols={setStatusCols}
                onKind={setKind}
                onExtra={setExtra}
                onPriceBracket={setPriceBracket}
                onSelect={setSelectedId}
                onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
                onCloseMenu={() => setMenuId(null)}
                onAction={(p, a) => handleAction(p.id, a)}
                onSetSaleStatus={handleSetSaleStatus}
                onOpenGallery={openGallery}
                onGptContent={(plot) => {
                  setSelectedId(plot.id);
                  setMenuId(null);
                  setGptLot(lodatListItemToGptLot(plot));
                }}
                onNeedsWebUpdate={(plot) => {
                  setAlertBox({
                    title: 'Lô CRM đã cập nhật',
                    message:
                      `«${plot.title}» đã đổi trên CRM sau lần lưu bài web. Mở Đăng bài để cập nhật lại nội dung công khai.`,
                  });
                }}
                scrollRef={tableScrollRef}
                onScroll={onListScroll}
              />
            </section>
          ) : null}

          {restoreReady && !list.isLoading && !list.error ? (
            <LodatCardList
              items={items}
              total={total || items.length}
              loadingMore={list.isFetchingNextPage}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpen={openLodat}
              onOpenGallery={openGallery}
              scrollRef={cardsScrollRef}
              onScroll={onListScroll}
            />
          ) : null}
        </div>
      </div>

      {galleryLodatId && galleryImages.length ? (
        <LodatImageGallery
          title={galleryQ.data?.title?.trim() || 'Ảnh lô đất'}
          images={galleryImages}
          startIndex={galleryIndex}
          onClose={() => setGalleryLodatId(null)}
          onIndexChange={setGalleryIndex}
          onRotate={async (image, nextDeg) => {
            if (!image.id || image.source !== 'lodat') {
              throw new Error('Ảnh dự án chung không lưu xoay tại đây.');
            }
            const updated = await updateLodatImageRotation(galleryLodatId, image.id, {
              rotationDeg: nextDeg,
            });
            qc.setQueryData(['lodat', galleryLodatId], updated);
            await qc.invalidateQueries({ queryKey: ['lodats'] });
            const saved = updated.images.find((i) => i.id === image.id);
            return saved?.rotationDeg ?? nextDeg;
          }}
          onToast={flash}
          onError={(msg) =>
            setAlertBox({ title: 'Không thực hiện được', message: msg })
          }
        />
      ) : null}

      <CrmAlertDialog
        open={Boolean(alertBox)}
        title={alertBox?.title ?? ''}
        icon={alertBox?.icon ?? AlertTriangle}
        message={alertBox?.message ?? ''}
        confirmLabel={alertBox?.confirmLabel}
        onClose={() => setAlertBox(null)}
      />

      <CrmToast message={toast} />
      {createTaskDialog}

      <LotGptContentDialog
        lot={gptLot}
        onClose={() => setGptLot(null)}
        onFlash={flash}
        onApplyToEditor={() => {
          setGptLot(null);
          flash('Mở Đăng bài để dán / lưu nội dung GPT lên web khách.');
          router.push('/dang-bai');
        }}
      />
    </div>
  );
}
