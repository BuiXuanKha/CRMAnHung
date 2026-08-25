'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import {
  LodatKind,
  LodatSaleStatus,
  type LodatDetail,
  type LodatImage,
  type LodatListItem,
  type LodatListingStatus,
} from '@crmanhung/shared';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { getLodat, listLodats, updateLodatImageRotation, updateLodatSaleStatus } from './api';
import {
  COMING_SOON_CONFIRM,
  COMING_SOON_ICON,
  COMING_SOON_TITLE,
  comingSoonMessage,
} from './coming-soon';
import { type LodatAction } from './components/action-menu';
import { FilterBar } from './components/filter-bar';
import { LodatCardList } from './components/lodat-card-list';
import { LodatImageGallery } from './components/lodat-image-gallery';
import { LodatTable } from './components/lodat-table';
import {
  applyExtraFilters,
  applyPriceBracket,
  countMobileLodatFilters,
  parseSearchKeyword,
  type ExtraFilters,
  type PriceBracket,
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
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
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
  const [restoreReady, setRestoreReady] = useState(false);
  const [listConcealed, setListConcealed] = useState(false);
  const restoreSnap = useRef<LodatListSavedState | null>(null);
  const restoreDone = useRef(false);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const cardsScrollRef = useRef<HTMLDivElement>(null);
  const persistRef = useRef({
    searchKeyword: keyword,
    status,
    kind,
    extra,
    priceBracket,
    selectedId,
  });
  persistRef.current = {
    searchKeyword: keyword,
    status,
    kind,
    extra,
    priceBracket,
    selectedId,
  };

  const search = parseSearchKeyword(keyword);
  const listQuery = {
    ...search,
    status: (status || undefined) as LodatListingStatus | undefined,
    kind: (kind || undefined) as LodatKind | undefined,
  };

  const list = useQuery({
    queryKey: ['lodats', listQuery],
    queryFn: () => listLodats(listQuery),
    enabled: restoreReady,
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

  const filtered = useMemo(
    () => applyPriceBracket(applyExtraFilters(list.data?.items ?? [], extra), priceBracket),
    [list.data?.items, extra, priceBracket],
  );

  const mobileFilterCount = countMobileLodatFilters(status, priceBracket);

  const toggleMut = useMutation({
    mutationFn: (plot: LodatListItem) => {
      const next =
        plot.status === LodatSaleStatus.DANG_BAN
          ? LodatSaleStatus.TAM_DUNG
          : LodatSaleStatus.DANG_BAN;
      return updateLodatSaleStatus(plot.id, { status: next });
    },
    onSuccess: async (updated) => {
      await qc.invalidateQueries({ queryKey: ['lodats'] });
      if (updated.status === LodatSaleStatus.TAM_DUNG) {
        flash(`Đã tạm dừng «${updated.title}». Gõ @ trên ô tìm để xem lại.`);
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

  useLayoutEffect(() => {
    const snap = peekLodatListState();
    restoreSnap.current = snap;
    if (snap) {
      setKeyword(snap.searchKeyword);
      setStatus(snap.status);
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
    persistListState();
  }

  useLayoutEffect(() => {
    if (!restoreReady || list.isLoading) return;
    if (restoreDone.current) return;
    const snap = restoreSnap.current;
    if (!snap) {
      restoreDone.current = true;
      return;
    }
    if (filtered.length === 0) {
      restoreDone.current = true;
      restoreSnap.current = null;
      setListConcealed(false);
      return;
    }
    const root = getListScrollEl();
    restoreLodatListScroll(root, snap);
    restoreDone.current = true;
    restoreSnap.current = null;
    setListConcealed(false);
  }, [restoreReady, filtered.length, list.isLoading]);

  function saveListBeforeLeave(selectedOverride?: string | null) {
    restoreDone.current = true;
    persistListState(selectedOverride);
  }

  useLayoutEffect(() => {
    if (!restoreReady || restoreSnap.current || !restoreDone.current) return;
    const root = getListScrollEl();
    if (root) root.scrollTop = 0;
  }, [
    keyword,
    status,
    kind,
    extra.photo,
    extra.address,
    extra.area,
    extra.direction,
    priceBracket,
    restoreReady,
  ]);

  useEffect(() => {
    if (!restoreReady || listConcealed || !restoreDone.current) return;
    persistListState();
  }, [keyword, status, kind, extra, priceBracket, selectedId, restoreReady, listConcealed]);

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

  function handleAction(id: string, action: LodatAction, title: string) {
    setMenuId(null);
    setSelectedId(id);
    if (action === 'detail') {
      saveListBeforeLeave(id);
      router.push(`/lo-dat/${id}`);
      return;
    }
    if (action === 'deal') {
      setAlertBox({
        title: COMING_SOON_TITLE,
        message: comingSoonMessage(`Giao dịch «${title}»`),
        icon: COMING_SOON_ICON,
        confirmLabel: COMING_SOON_CONFIRM,
      });
      return;
    }
    saveListBeforeLeave(id);
    router.push(`/lo-dat/${id}/sua`);
  }

  function handleToggleSale(plot: LodatListItem) {
    if (toggleMut.isPending) return;
    setMenuId(null);
    void toggleMut.mutateAsync(plot);
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
            status={status}
            onStatus={setStatus}
            priceBracket={priceBracket}
            onPriceBracket={setPriceBracket}
            hasActiveFilters={mobileFilterCount > 0}
            onResetFilters={() => {
              setStatus('');
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
                items={filtered}
                total={list.data?.total ?? filtered.length}
                selectedId={selectedId}
                menuId={menuId}
                status={status}
                kind={kind}
                extra={extra}
                priceBracket={priceBracket}
                togglingId={toggleMut.isPending ? (toggleMut.variables?.id ?? null) : null}
                onStatus={setStatus}
                onKind={setKind}
                onExtra={setExtra}
                onPriceBracket={setPriceBracket}
                onSelect={setSelectedId}
                onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
                onCloseMenu={() => setMenuId(null)}
                onAction={(p, a) => handleAction(p.id, a, p.title)}
                onToggleSale={handleToggleSale}
                onOpenGallery={openGallery}
                scrollRef={tableScrollRef}
                onScroll={onListScroll}
              />
            </section>
          ) : null}

          {restoreReady && !list.isLoading && !list.error ? (
            <LodatCardList
              items={filtered}
              total={list.data?.total ?? filtered.length}
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
    </div>
  );
}
