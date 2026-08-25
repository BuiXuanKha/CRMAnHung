'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import { LodatKind, LodatSaleStatus, type LodatListItem, type LodatListingStatus } from '@crmanhung/shared';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { listLodats, updateLodatSaleStatus } from './api';
import {
  COMING_SOON_CONFIRM,
  COMING_SOON_ICON,
  COMING_SOON_TITLE,
  comingSoonMessage,
} from './coming-soon';
import { type LodatAction } from './components/action-menu';
import { FilterBar } from './components/filter-bar';
import { LodatCardList } from './components/lodat-card-list';
import { LodatTable } from './components/lodat-table';
import {
  applyExtraFilters,
  applyPriceBracket,
  countMobileLodatFilters,
  parseSearchKeyword,
  type ExtraFilters,
  type PriceBracket,
} from './display';
import './lodats.css';
import './lodats-table.css';
import './lodats-mobile.css';
import '@/shared/ui/money.css';

const DEFAULT_EXTRA: ExtraFilters = {
  photo: 'all',
  address: 'all',
  area: 'all',
  direction: 'all',
  price: 'all',
};

type AlertState = {
  title: string;
  message: string;
  icon?: LucideIcon;
  confirmLabel?: string;
} | null;

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

  const search = parseSearchKeyword(keyword);
  const listQuery = {
    ...search,
    status: (status || undefined) as LodatListingStatus | undefined,
    kind: (kind || undefined) as LodatKind | undefined,
  };

  const list = useQuery({
    queryKey: ['lodats', listQuery],
    queryFn: () => listLodats(listQuery),
  });

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

  function handleAction(id: string, action: LodatAction, title: string) {
    setMenuId(null);
    setSelectedId(id);
    if (action === 'detail') {
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
    router.push(`/lo-dat/${id}/sua`);
  }

  function handleToggleSale(plot: LodatListItem) {
    if (toggleMut.isPending) return;
    setMenuId(null);
    void toggleMut.mutateAsync(plot);
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

        {list.isLoading ? <p className="ld-status">Đang tải danh sách…</p> : null}
        {list.error ? (
          <p className="ld-status error">{(list.error as Error).message}</p>
        ) : null}

        {!list.isLoading && !list.error ? (
          <section className="ld-table-shell" aria-label="Danh sách lô đất">
            <LodatTable
              items={filtered}
              total={list.data?.total ?? filtered.length}
              selectedId={selectedId}
              menuId={menuId}
              status={status}
              kind={kind}
              extra={extra}
              togglingId={toggleMut.isPending ? (toggleMut.variables?.id ?? null) : null}
              onStatus={setStatus}
              onKind={setKind}
              onExtra={setExtra}
              onSelect={setSelectedId}
              onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
              onCloseMenu={() => setMenuId(null)}
              onAction={(p, a) => handleAction(p.id, a, p.title)}
              onToggleSale={handleToggleSale}
            />
          </section>
        ) : null}

        {!list.isLoading && !list.error ? (
          <LodatCardList
            items={filtered}
            total={list.data?.total ?? filtered.length}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onOpen={(id) => router.push(`/lo-dat/${id}`)}
          />
        ) : null}
      </div>

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
