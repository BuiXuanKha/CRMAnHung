'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  TitleServiceMoneyKind,
  TitleServiceStatus,
  UserRole,
  type TitleServiceListItem,
} from '@crmanhung/shared';
import { CrmAlertDialog, CrmConfirmDialog, CrmToast } from '@/shared/ui/dialog';
import { useAuth } from '@/features/auth/auth-context';
import { listUserDirectory } from '@/features/users/api';
import {
  addTitleServiceAttachment,
  addTitleServiceMoney,
  addTitleServiceProgress,
  deleteTitleService,
  getTitleService,
  getTitleServiceAttachmentUrl,
  listTitleServices,
  pinTitleService,
  updateTitleService,
} from './api';
import { ActionDialogs, type DialogKind } from './components/action-dialogs';
import { type TitleServiceAction } from './components/action-menu';
import { DetailPanel } from './components/detail-panel';
import { FilterBar } from './components/filter-bar';
import { TitleServiceCardList } from './components/title-service-card-list';
import { TitleServiceTable } from './components/title-service-table';
import { applyExtraFilters, countMobileTitleServiceFilters, type ExtraFilters } from './display';
import './title-services.css';
import './title-services-table.css';
import './title-services-panel.css';
import './title-services-mobile.css';
import '@/shared/ui/money.css';

const DEFAULT_EXTRA: ExtraFilters = {
  need: 'all',
  progress: 'all',
  money: 'all',
  docs: 'all',
};

type AlertState = { title: string; message: string } | null;

export function TitleServiceListPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const search = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [extra, setExtra] = useState<ExtraFilters>(DEFAULT_EXTRA);
  const [selectedId, setSelectedId] = useState<string | null>(() => search.get('id'));
  const [menuId, setMenuId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<AlertState>(null);
  const [confirmDelete, setConfirmDelete] = useState<TitleServiceListItem | null>(null);
  const [dialog, setDialog] = useState<{ kind: DialogKind; item: TitleServiceListItem } | null>(
    null,
  );
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const listQuery = {
    keyword: keyword.trim() || undefined,
    status: (status || undefined) as TitleServiceStatus | undefined,
    createdByEmployeeId: isAdmin && employeeId ? employeeId : undefined,
  };

  const list = useQuery({
    queryKey: ['title-services', listQuery],
    queryFn: () => listTitleServices(listQuery),
  });

  const staffDir = useQuery({
    queryKey: ['user-directory'],
    queryFn: listUserDirectory,
    enabled: isAdmin,
  });

  const filtered = useMemo(
    () => applyExtraFilters(list.data?.items ?? [], extra),
    [list.data?.items, extra],
  );

  const selected =
    filtered.find((row) => row.id === selectedId) ??
    list.data?.items.find((row) => row.id === selectedId) ??
    null;
  const mobileFilterCount = countMobileTitleServiceFilters(status, employeeId);

  useEffect(() => {
    if (selectedId || filtered.length === 0) return;
    setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const detail = useQuery({
    queryKey: ['title-service', selectedId],
    queryFn: () => getTitleService(selectedId as string),
    enabled: Boolean(selectedId) && panelOpen,
  });

  const pinMut = useMutation({
    mutationFn: (item: TitleServiceListItem) =>
      pinTitleService(item.id, { pinned: !item.isPinned }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['title-services'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTitleService(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['title-services'] });
    },
  });

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  function selectRow(id: string) {
    setSelectedId(id);
    setPanelOpen(true);
  }

  function openDialog(kind: DialogKind, item: TitleServiceListItem) {
    setDialogError(null);
    setDialog({ kind, item });
  }

  function handleAction(item: TitleServiceListItem, action: TitleServiceAction) {
    setMenuId(null);
    selectRow(item.id);
    if (action === 'detail') return;
    if (action === 'pin') {
      void pinMut.mutateAsync(item).then((updated) => {
        flash(updated.isPinned ? `Đã ghim ${item.code}.` : `Đã bỏ ghim ${item.code}.`);
      });
      return;
    }
    if (action === 'delete') {
      setConfirmDelete(item);
      return;
    }
    openDialog(action, item);
  }

  async function refreshDetail(id: string) {
    await qc.invalidateQueries({ queryKey: ['title-services'] });
    await qc.invalidateQueries({ queryKey: ['title-service', id] });
  }

  async function runDialog(work: () => Promise<void>) {
    setDialogBusy(true);
    setDialogError(null);
    try {
      await work();
    } catch (err) {
      setDialogError((err as Error).message);
    } finally {
      setDialogBusy(false);
    }
  }

  async function openAttachment(attachmentId: string) {
    if (!selectedId) return;
    try {
      const { url } = await getTitleServiceAttachmentUrl(selectedId, attachmentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setAlertBox({
        title: 'Không mở được tài liệu',
        message: (err as Error).message,
      });
    }
  }

  async function confirmRemove() {
    if (!confirmDelete) return;
    const code = confirmDelete.code;
    try {
      await deleteMut.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
      if (selectedId === confirmDelete.id) setSelectedId(null);
      flash(`Đã xóa hồ sơ ${code}.`);
    } catch (err) {
      setConfirmDelete(null);
      setAlertBox({ title: 'Không xóa được hồ sơ', message: (err as Error).message });
    }
  }

  return (
    <div className="sd-page">
      <div className={`sd-layout${panelOpen ? ' is-panel-open' : ''}`}>
        <div className="sd-main">
          <section className="sd-filter-wrap" aria-label="Tìm kiếm hồ sơ sổ đỏ">
            <FilterBar
              keyword={keyword}
              onKeyword={setKeyword}
              filtersOpen={filterOpen}
              onToggleFilters={() => setFilterOpen((v) => !v)}
              status={status}
              onStatus={setStatus}
              hasActiveFilters={mobileFilterCount > 0}
              onResetFilters={() => {
                setStatus('');
                setEmployeeId('');
              }}
              showEmployeeFilter={isAdmin}
              employees={staffDir.data ?? []}
              employeeId={employeeId}
              onEmployee={setEmployeeId}
            />
          </section>

          {list.isLoading ? <p className="sd-status">Đang tải danh sách…</p> : null}
          {list.error ? (
            <p className="sd-status error">{(list.error as Error).message}</p>
          ) : null}

          {!list.isLoading && !list.error ? (
            <section className="sd-table-shell" aria-label="Danh sách hồ sơ sổ đỏ">
              <TitleServiceTable
                items={filtered}
                total={list.data?.total ?? filtered.length}
                selectedId={selectedId}
                menuId={menuId}
                status={status}
                extra={extra}
                onStatus={setStatus}
                onExtra={setExtra}
                onSelect={selectRow}
                onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
                onCloseMenu={() => setMenuId(null)}
                onAction={handleAction}
              />
            </section>
          ) : null}

          {!list.isLoading && !list.error ? (
            <TitleServiceCardList
              items={filtered}
              total={list.data?.total ?? filtered.length}
              selectedId={selectedId}
              menuId={menuId}
              onSelect={selectRow}
              onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
              onCloseMenu={() => setMenuId(null)}
              onAction={handleAction}
            />
          ) : null}
        </div>

        <DetailPanel
          open={panelOpen}
          selected={selected}
          detail={detail.data ?? null}
          loading={detail.isLoading}
          error={detail.error ? (detail.error as Error).message : null}
          onToggle={() => setPanelOpen((v) => !v)}
          onAddProgress={() => selected && openDialog('progress', selected)}
          onAddAttach={() => selected && openDialog('attach', selected)}
          onAddThu={() => selected && openDialog('thu', selected)}
          onAddChi={() => selected && openDialog('chi', selected)}
          onOpenAttachment={(attachmentId) => {
            void openAttachment(attachmentId);
          }}
        />
      </div>

      <ActionDialogs
        kind={dialog?.kind ?? null}
        item={dialog?.item ?? null}
        busy={dialogBusy}
        error={dialogError}
        onClose={() => {
          setDialog(null);
          setDialogError(null);
        }}
        onSubmitProgress={async (stepType, note, happenedAt) => {
          if (!dialog) return;
          await runDialog(async () => {
            await addTitleServiceProgress(dialog.item.id, { stepType, note, happenedAt });
            setDialog(null);
            await refreshDetail(dialog.item.id);
            flash('Đã thêm tiến độ.');
          });
        }}
        onSubmitMoney={async (kind, title, amountVnd, happenedAt) => {
          if (!dialog) return;
          await runDialog(async () => {
            await addTitleServiceMoney(dialog.item.id, { kind, title, amountVnd, happenedAt });
            setDialog(null);
            await refreshDetail(dialog.item.id);
            flash(kind === TitleServiceMoneyKind.THU ? 'Đã nhập thu.' : 'Đã nhập chi phí.');
          });
        }}
        onSubmitAttach={async (kind, file) => {
          if (!dialog) return;
          await runDialog(async () => {
            await addTitleServiceAttachment(dialog.item.id, { kind, file });
            setDialog(null);
            await refreshDetail(dialog.item.id);
            flash('Đã thêm tài liệu.');
          });
        }}
        onSubmitEdit={async (nextStatus, agreedFeeVnd, needSummary, note) => {
          if (!dialog) return;
          await runDialog(async () => {
            await updateTitleService(dialog.item.id, {
              status: nextStatus,
              agreedFeeVnd,
              needSummary,
              note,
            });
            setDialog(null);
            await refreshDetail(dialog.item.id);
            flash('Đã cập nhật hồ sơ.');
          });
        }}
      />

      <CrmConfirmDialog
        open={Boolean(confirmDelete)}
        title="Xóa hồ sơ sổ đỏ"
        icon={Trash2}
        message={
          confirmDelete
            ? `Xóa hồ sơ ${confirmDelete.code}? Toàn bộ tiến độ, thu/chi và tài liệu sẽ bị gỡ.`
            : ''
        }
        confirmLabel="Xóa hồ sơ"
        danger
        busy={deleteMut.isPending}
        onCancel={() => {
          if (!deleteMut.isPending) setConfirmDelete(null);
        }}
        onConfirm={() => {
          void confirmRemove();
        }}
      />

      <CrmAlertDialog
        open={Boolean(alertBox)}
        title={alertBox?.title ?? ''}
        icon={AlertTriangle}
        message={alertBox?.message ?? ''}
        onClose={() => setAlertBox(null)}
      />

      <CrmToast message={toast} />
    </div>
  );
}
