'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, type LucideIcon, Trash2 } from 'lucide-react';
import {
  CUSTOMER_LIST_LOAD_MORE_PX,
  CUSTOMER_LIST_PAGE_SIZE,
  CustomerStatus,
  UserRole,
  type CreateCustomerInput,
  type CustomerListItem,
  type PhoneDuplicateExisting,
  type UpdateCustomerCareInput,
} from '@crmanhung/shared';
import { CrmAlertDialog, CrmConfirmDialog, CrmToast } from '@/shared/ui/dialog';
import { useAuth } from '@/features/auth/auth-context';
import { HotlinesSettingsDialog } from '@/features/settings/hotlines-dialog';
import {
  consumeCareToast,
  acknowledgePhoneDuplicate,
  addCustomerPhone,
  createCustomer,
  getCustomer,
  isPhoneDuplicateError,
  listContactChannels,
  listCustomerLodats,
  listCustomerMessages,
  listCustomers,
  listMyHotlines,
  mergeFacebookIntoPhoneHolder,
  updateCustomer,
  updateCustomerCare,
} from './api';
import { AddByPhoneModal } from './components/add-by-phone-modal';
import { AddCustomerPhoneModal } from './components/add-customer-phone-modal';
import { PhoneDuplicateModal } from './components/phone-duplicate-modal';
import { RenameCustomerModal } from './components/rename-customer-modal';
import { CustomerCareEditModal } from './components/care-edit-modal';
import { type CustomerAction } from './components/action-menu';
import { CustomerTable } from './components/customer-table';
import { FilterBar } from './components/filter-bar';
import { CustomerCardList } from './components/customer-card-list';
import { RightRail, type RailKey } from './components/right-rail';
import { applyExtraFilters, countCustomerStats, countMobileCustomerFilters, parseSearchKeyword, type ExtraFilters } from './display';
import {
  COMING_SOON_CONFIRM,
  COMING_SOON_ICON,
  COMING_SOON_TITLE,
  comingSoonMessage,
} from './coming-soon';
import { openExternalUrl, facebookInboxChatUrl, messengerComUrl } from './messenger';
import {
  getActiveListScrollEl,
  needsMoreListScrollHeight,
  peekCustomerListState,
  restoreListScroll,
  saveCustomerListState,
  type CustomerListSavedState,
} from './list-state';
import './customers.css';
import './customers-table.css';
import './customers-chrome.css';
import './customers-mobile.css';
import '@/shared/ui/money.css';

const DEFAULT_EXTRA: ExtraFilters = {
  finance: 'all',
  channel: 'all',
  lodat: 'all',
  demand: 'all',
};

type ConfirmState = {
  customer: CustomerListItem;
} | null;

type CareState = {
  customer: CustomerListItem;
} | null;

type DupState = {
  mode: 'create' | 'merge' | 'info';
  existing: PhoneDuplicateExisting;
  phone?: string;
  fullName?: string;
  sourceId?: string;
  sourceName?: string;
} | null;

type AlertState = {
  title: string;
  message: string;
  icon?: LucideIcon;
  confirmLabel?: string;
} | null;

export function CustomerListPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [extra, setExtra] = useState<ExtraFilters>(DEFAULT_EXTRA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [rail, setRail] = useState<RailKey | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState>(null);
  const [careEdit, setCareEdit] = useState<CareState>(null);
  const [addPhone, setAddPhone] = useState<CareState>(null);
  const [alertBox, setAlertBox] = useState<AlertState>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [careBusy, setCareBusy] = useState(false);
  const [careError, setCareError] = useState<string | null>(null);
  const [addPhoneBusy, setAddPhoneBusy] = useState(false);
  const [addPhoneError, setAddPhoneError] = useState<string | null>(null);
  const [rename, setRename] = useState<CareState>(null);
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [dup, setDup] = useState<DupState>(null);
  const [dupBusy, setDupBusy] = useState(false);
  const [dupError, setDupError] = useState<string | null>(null);
  const [hotlineOpen, setHotlineOpen] = useState(false);
  const [restoreReady, setRestoreReady] = useState(false);
  const [listConcealed, setListConcealed] = useState(false);
  const restoreSnap = useRef<CustomerListSavedState | null>(null);
  const restoreDone = useRef(false);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const cardsScrollRef = useRef<HTMLDivElement>(null);
  const persistRef = useRef({
    searchKeyword: keyword,
    statusFilter: status,
    extra,
    selectedId,
  });
  persistRef.current = {
    searchKeyword: keyword,
    statusFilter: status,
    extra,
    selectedId,
  };

  const search = parseSearchKeyword(keyword);
  const listQuery = {
    ...search,
    status: (status || undefined) as CustomerStatus | undefined,
    budgetFilter: extra.finance === 'all' ? undefined : extra.finance,
    contactChannel: extra.channel === 'all' ? undefined : extra.channel,
    needFilter: extra.demand === 'all' ? undefined : extra.demand,
    lodatFilter: extra.lodat === 'all' ? undefined : extra.lodat,
  };

  const list = useInfiniteQuery({
    queryKey: ['customers', listQuery],
    queryFn: ({ pageParam }) =>
      listCustomers({
        ...listQuery,
        limit: CUSTOMER_LIST_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    enabled: restoreReady,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, page) => n + page.items.length, 0);
      if (loaded >= lastPage.total || lastPage.items.length === 0) return undefined;
      return loaded;
    },
  });

  const items = useMemo(
    () => applyExtraFilters(list.data?.pages.flatMap((page) => page.items) ?? [], extra),
    [list.data?.pages, extra],
  );
  const total = list.data?.pages[0]?.total ?? 0;

  const channels = useQuery({
    queryKey: ['contact-channels'],
    queryFn: listContactChannels,
  });

  const hotlines = useQuery({
    queryKey: ['my-hotlines'],
    queryFn: () => listMyHotlines(true),
    enabled: addOpen || hotlineOpen,
  });

  const selected = items.find((c) => c.id === selectedId) ?? null;
  const mobileFilterCount = countMobileCustomerFilters(status, extra);
  const stats = useMemo(() => countCustomerStats(items), [items]);
  const channelOptions = useMemo(
    () =>
      (channels.data?.items ?? []).map((item) => ({
        value: item.value,
        label: `${item.label} (${item.customerCount})`,
      })),
    [channels.data?.items],
  );

  const detail = useQuery({
    queryKey: ['customer', selectedId],
    queryFn: () => getCustomer(selectedId as string),
    enabled: Boolean(selectedId) && rail === 'care',
  });

  const thread = useQuery({
    queryKey: ['customer-messages', selectedId],
    queryFn: () => listCustomerMessages(selectedId as string),
    enabled: Boolean(selectedId) && rail === 'chat',
  });

  const customerLodats = useQuery({
    queryKey: ['customer-lodats', selectedId],
    queryFn: () => listCustomerLodats(selectedId as string),
    enabled: Boolean(selectedId) && rail === 'lodat',
  });

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  const createMut = useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(input),
    onSuccess: async (created) => {
      await qc.invalidateQueries({ queryKey: ['customers'] });
      await qc.invalidateQueries({ queryKey: ['contact-channels'] });
      setAddOpen(false);
      setAddError(null);
      setSelectedId(created.id);
      flash('Đã thêm khách hàng.');
    },
  });

  useLayoutEffect(() => {
    const snap = peekCustomerListState();
    restoreSnap.current = snap;
    if (snap) {
      setKeyword(snap.searchKeyword);
      setStatus(snap.statusFilter);
      setExtra(snap.extra);
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
    saveCustomerListState(getListScrollEl(), {
      ...persistRef.current,
      selectedId: selectedOverride ?? persistRef.current.selectedId,
    });
  }

  function loadMoreIfNearEnd() {
    if (!list.hasNextPage || list.isFetchingNextPage || list.isLoading) return;
    const root = getListScrollEl();
    if (!root) return;
    const nearBottom =
      root.scrollHeight - root.scrollTop - root.clientHeight < CUSTOMER_LIST_LOAD_MORE_PX;
    const notScrollable = root.scrollHeight <= root.clientHeight + 2;
    if (nearBottom || notScrollable) {
      void list.fetchNextPage();
    }
  }

  function onListScroll() {
    loadMoreIfNearEnd();
    persistListState();
  }

  useLayoutEffect(() => {
    if (!restoreReady || list.isLoading || list.isFetchingNextPage) return;
    if (restoreDone.current) return;
    const snap = restoreSnap.current;
    if (!snap) {
      restoreDone.current = true;
      return;
    }
    if (items.length === 0) {
      restoreDone.current = true;
      restoreSnap.current = null;
      setListConcealed(false);
      return;
    }
    const root = getListScrollEl();
    if (items.length < total && needsMoreListScrollHeight(root, snap.scrollTop)) {
      if (list.hasNextPage) {
        void list.fetchNextPage();
        return;
      }
    }
    restoreListScroll(root, snap);
    restoreDone.current = true;
    restoreSnap.current = null;
    setListConcealed(false);
  }, [restoreReady, items.length, total, list.isLoading, list.isFetchingNextPage, list.hasNextPage]);

  useEffect(() => {
    if (!restoreReady || listConcealed || list.isLoading) return;
    loadMoreIfNearEnd();
  }, [restoreReady, listConcealed, list.isLoading, items.length, list.hasNextPage]);

  function saveListBeforeLeave(selectedOverride?: string | null) {
    restoreDone.current = true;
    persistListState(selectedOverride);
  }

  useLayoutEffect(() => {
    if (!restoreReady || restoreSnap.current || !restoreDone.current) return;
    const root = getListScrollEl();
    if (root) root.scrollTop = 0;
  }, [keyword, status, extra.finance, extra.channel, extra.demand, extra.lodat, restoreReady]);

  useEffect(() => {
    if (!restoreReady || listConcealed || !restoreDone.current) return;
    persistListState();
  }, [keyword, status, extra, selectedId, restoreReady, listConcealed]);

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

  useEffect(() => {
    const msg = consumeCareToast();
    if (!msg) return;
    setToast(msg);
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, []);

  function isMobileList() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function selectCustomer(id: string) {
    setSelectedId(id);
    if (isMobileList()) {
      saveListBeforeLeave(id);
      router.push(`/khach-hang/${id}`);
    }
  }

  function openCareEdit(customer: CustomerListItem) {
    if (customer.isHidden) return;
    if (isMobileList()) {
      saveListBeforeLeave(customer.id);
      router.push(`/khach-hang/${customer.id}/cham-soc`);
      return;
    }
    setCareError(null);
    setCareEdit({ customer });
  }

  function openAddPhone(customer: CustomerListItem) {
    if (customer.isHidden || customer.primaryPhone) return;
    setAddPhoneError(null);
    setAddPhone({ customer });
  }

  function openRename(customer: CustomerListItem) {
    setRenameError(null);
    setRename({ customer });
  }

  async function handleAction(customer: CustomerListItem, action: CustomerAction) {
    setMenuId(null);
    setSelectedId(customer.id);
    if (action === 'chat') {
      // CRM cũ: tab facebook.com/messages (không phải rail tin đã lưu)
      if (!openExternalUrl(facebookInboxChatUrl(customer))) {
        setAlertBox({
          title: 'Không mở được chat',
          message: 'Khách này chưa có thread Facebook Inbox (mã số) để mở hội thoại.',
        });
      }
      return;
    }
    if (action === 'messenger') {
      if (!openExternalUrl(messengerComUrl(customer))) {
        setAlertBox({
          title: 'Không mở được Messenger',
          message: customer.facebook
            ? 'Khách này chưa có thread / UID Messenger (mã số) để mở hội thoại.'
            : 'Khách này chưa gắn Facebook — không mở được Messenger.',
        });
      }
      return;
    }
    if (action === 'care') {
      openCareEdit(customer);
      return;
    }
    if (action === 'lodat') {
      if (user?.role === UserRole.ADMIN) {
        setAlertBox({
          title: 'Không tạo lô từ khách',
          message: 'Admin không tạo lô đất từ menu khách. Nhân viên tạo lô từ hồ sơ khách của mình.',
        });
        return;
      }
      setAlertBox({
        title: COMING_SOON_TITLE,
        message: comingSoonMessage(`Tạo lô đất cho «${customer.fullName}»`),
        icon: COMING_SOON_ICON,
        confirmLabel: COMING_SOON_CONFIRM,
      });
      return;
    }
    if (action === 'sodo') {
      setAlertBox({
        title: COMING_SOON_TITLE,
        message: comingSoonMessage(`Dịch vụ sổ đỏ cho «${customer.fullName}»`),
        icon: COMING_SOON_ICON,
        confirmLabel: COMING_SOON_CONFIRM,
      });
      return;
    }
    if (action === 'pin') {
      await updateCustomer(customer.id, { isPinned: !customer.isPinned });
      await qc.invalidateQueries({ queryKey: ['customers'] });
      flash(customer.isPinned ? 'Đã bỏ ghim khách.' : 'Đã ghim khách.');
      return;
    }
    if (action === 'restore') {
      await updateCustomer(customer.id, { isHidden: false });
      await qc.invalidateQueries({ queryKey: ['customers'] });
      flash('Đã khôi phục khách.');
      return;
    }
    if (action === 'delete') {
      setConfirmDelete({ customer });
    }
  }

  async function confirmHideCustomer() {
    if (!confirmDelete) return;
    setDeleteBusy(true);
    try {
      await updateCustomer(confirmDelete.customer.id, { isHidden: true });
      await qc.invalidateQueries({ queryKey: ['customers'] });
      setConfirmDelete(null);
      flash('Đã ẩn khách (xóa mềm).');
    } finally {
      setDeleteBusy(false);
    }
  }

  async function submitCare(input: UpdateCustomerCareInput) {
    if (!careEdit) return;
    setCareBusy(true);
    setCareError(null);
    try {
      const result = await updateCustomerCare(careEdit.customer.id, input);
      await qc.invalidateQueries({ queryKey: ['customers'] });
      await qc.invalidateQueries({ queryKey: ['customer', careEdit.customer.id] });
      setRail('care');
      setCareEdit(null);
      flash(
        result.unchanged
          ? 'Không có thay đổi. Bỏ qua cập nhật.'
          : 'Đã lưu cập nhật chăm sóc.',
      );
    } catch (err) {
      setCareError(err instanceof Error ? err.message : 'Không lưu được.');
    } finally {
      setCareBusy(false);
    }
  }

  async function submitAddPhone(phone: string) {
    if (!addPhone) return;
    setAddPhoneBusy(true);
    setAddPhoneError(null);
    try {
      await addCustomerPhone(addPhone.customer.id, { phone });
      await qc.invalidateQueries({ queryKey: ['customers'] });
      await qc.invalidateQueries({ queryKey: ['customer', addPhone.customer.id] });
      setAddPhone(null);
      flash('Đã thêm số điện thoại.');
    } catch (err) {
      if (isPhoneDuplicateError(err)) {
        setDup({
          mode: err.mergeAllowed ? 'merge' : 'info',
          existing: err.existing,
          phone: typeof err.phone === 'string' ? err.phone : phone,
          sourceId: addPhone.customer.id,
          sourceName: addPhone.customer.fullName,
        });
        return;
      }
      setAddPhoneError(
        err instanceof Error ? err.message : 'Không lưu được số điện thoại.',
      );
    } finally {
      setAddPhoneBusy(false);
    }
  }

  async function submitRename(fullName: string) {
    if (!rename) return;
    setRenameBusy(true);
    setRenameError(null);
    try {
      await updateCustomer(rename.customer.id, { fullName });
      await qc.invalidateQueries({ queryKey: ['customers'] });
      await qc.invalidateQueries({ queryKey: ['customer', rename.customer.id] });
      setRename(null);
      flash('Đã đổi tên khách.');
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Không đổi được tên khách.');
    } finally {
      setRenameBusy(false);
    }
  }

  async function submitDuplicate() {
    if (!dup) return;
    setDupBusy(true);
    setDupError(null);
    try {
      if (dup.mode === 'create') {
        await acknowledgePhoneDuplicate(dup.existing.id, {
          fullName: dup.fullName?.trim() || dup.existing.fullName,
        });
        setAddOpen(false);
        flash('Đã cập nhật khách.');
      } else if (dup.mode === 'merge' && dup.sourceId && dup.phone) {
        await mergeFacebookIntoPhoneHolder({
          sourceCustomerId: dup.sourceId,
          targetCustomerId: dup.existing.id,
          phone: dup.phone,
        });
        setAddPhone(null);
        flash('Đã gộp khách Facebook vào hồ sơ có số điện thoại.');
      } else {
        setAddPhone(null);
      }
      setSelectedId(dup.existing.id);
      setDup(null);
      await qc.invalidateQueries({ queryKey: ['customers'] });
      await qc.invalidateQueries({ queryKey: ['contact-channels'] });
    } catch (err) {
      setDupError(err instanceof Error ? err.message : 'Không xử lý được.');
    } finally {
      setDupBusy(false);
    }
  }

  return (
    <div className="kh-page">
      <div className={`kh-s32${rail ? ' is-rail-open' : ''}`}>
        {/* §3.2.1 */}
        <div className={`kh-s321${listConcealed ? ' is-restoring' : ''}`}>
          {/* §3.2.1.1 */}
          <section className="kh-s3211" aria-label="Tìm kiếm và lọc">
            <FilterBar
              keyword={keyword}
              onKeyword={setKeyword}
              onAdd={() => setAddOpen(true)}
              filtersOpen={filterOpen}
              onToggleFilters={() => setFilterOpen((v) => !v)}
              status={status}
              onStatus={setStatus}
              extra={extra}
              onExtra={setExtra}
              channelOptions={channelOptions}
              hasActiveFilters={mobileFilterCount > 0}
              onResetFilters={() => {
                setStatus('');
                setExtra(DEFAULT_EXTRA);
              }}
            />
          </section>

          {!restoreReady || list.isLoading ? <p className="kh-status">Đang tải danh sách…</p> : null}
          {list.error ? (
            <p className="kh-status error">{(list.error as Error).message}</p>
          ) : null}

          {/* §3.2.1.2 */}
          {restoreReady && !list.isLoading && !list.error ? (
            <section className="kh-s3212" aria-label="Danh sách khách hàng">
              <CustomerTable
                items={items}
                total={total}
                loadingMore={list.isFetchingNextPage}
                selectedId={selectedId}
                menuId={menuId}
                status={status}
                extra={extra}
                onStatus={setStatus}
                onExtra={setExtra}
                onSelect={setSelectedId}
                onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
                onCloseMenu={() => setMenuId(null)}
                onAction={(c, a) => {
                  void handleAction(c, a);
                }}
                onCare={(c) => openCareEdit(c)}
                onAddPhone={(c) => openAddPhone(c)}
                onRename={(c) => openRename(c)}
                channelOptions={channelOptions}
                scrollRef={tableScrollRef}
                onScroll={onListScroll}
              />
            </section>
          ) : null}

          {restoreReady && !list.isLoading && !list.error ? (
            <CustomerCardList
              items={items}
              total={total}
              loadingMore={list.isFetchingNextPage}
              selectedId={selectedId}
              menuId={menuId}
              stats={stats}
              onSelect={selectCustomer}
              onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
              onCloseMenu={() => setMenuId(null)}
              onAction={(c, a) => {
                void handleAction(c, a);
              }}
              onAdd={() => setAddOpen(true)}
              onAddPhone={(c) => openAddPhone(c)}
              scrollRef={cardsScrollRef}
              onScroll={onListScroll}
            />
          ) : null}
        </div>

        {/* §3.2.2 */}
        <RightRail
          open={rail}
          onToggle={(key) => setRail((cur) => (cur === key ? null : key))}
          customer={selected}
          detail={detail.data ?? null}
          messages={thread.data?.messages ?? []}
          messagesLoading={thread.isLoading}
          lodats={customerLodats.data?.items ?? []}
          lodatsLoading={customerLodats.isLoading}
        />
      </div>

      <AddByPhoneModal
        open={addOpen}
        busy={createMut.isPending}
        error={addError}
        hotlines={hotlines.data?.items ?? []}
        hotlinesLoading={hotlines.isLoading}
        onClose={() => {
          setAddOpen(false);
          setAddError(null);
        }}
        onOpenHotlines={() => {
          setAddOpen(false);
          setHotlineOpen(true);
        }}
        onSubmit={async (input) => {
          setAddError(null);
          try {
            await createMut.mutateAsync(input);
          } catch (err) {
            if (isPhoneDuplicateError(err)) {
              setDup({
                mode: 'create',
                existing: err.existing,
                phone: input.phone,
                fullName: input.fullName,
              });
              return;
            }
            setAddError(err instanceof Error ? err.message : 'Không thêm được khách.');
          }
        }}
      />

      <CrmConfirmDialog
        open={Boolean(confirmDelete)}
        title="Ẩn khách hàng"
        icon={Trash2}
        message={
          confirmDelete
            ? `Ẩn khách «${confirmDelete.customer.fullName}»? Khách sẽ không hiện trong danh sách mặc định.`
            : ''
        }
        confirmLabel="Ẩn khách"
        danger
        busy={deleteBusy}
        onCancel={() => {
          if (!deleteBusy) setConfirmDelete(null);
        }}
        onConfirm={() => {
          void confirmHideCustomer();
        }}
      />

      <CustomerCareEditModal
        customer={careEdit?.customer ?? null}
        busy={careBusy}
        error={careError}
        onClose={() => {
          if (!careBusy) {
            setCareEdit(null);
            setCareError(null);
          }
        }}
        onSubmit={submitCare}
      />

      <AddCustomerPhoneModal
        customer={addPhone?.customer ?? null}
        busy={addPhoneBusy}
        error={addPhoneError}
        onClose={() => {
          if (!addPhoneBusy) {
            setAddPhone(null);
            setAddPhoneError(null);
          }
        }}
        onSubmit={submitAddPhone}
      />

      <RenameCustomerModal
        customer={rename?.customer ?? null}
        busy={renameBusy}
        error={renameError}
        onClose={() => {
          if (!renameBusy) {
            setRename(null);
            setRenameError(null);
          }
        }}
        onSubmit={submitRename}
      />

      <PhoneDuplicateModal
        open={Boolean(dup)}
        mode={dup?.mode ?? 'create'}
        existing={dup?.existing ?? null}
        phone={dup?.phone}
        fullName={dup?.fullName}
        sourceName={dup?.sourceName}
        busy={dupBusy}
        error={dupError}
        onClose={() => {
          if (!dupBusy) {
            setDup(null);
            setDupError(null);
          }
        }}
        onConfirm={submitDuplicate}
      />

      <HotlinesSettingsDialog
        open={hotlineOpen}
        onClose={() => {
          setHotlineOpen(false);
          void qc.invalidateQueries({ queryKey: ['my-hotlines'] });
        }}
      />

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
