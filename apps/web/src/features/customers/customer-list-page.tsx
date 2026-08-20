'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { CustomerStatus, type CustomerListItem, type UpdateCustomerCareInput } from '@crmanhung/shared';
import { CrmAlertDialog, CrmConfirmDialog, CrmToast } from '@/shared/ui/dialog';
import {
  consumeCareToast,
  createCustomer,
  getCustomer,
  listCustomerMessages,
  listCustomers,
  updateCustomer,
  updateCustomerCare,
} from './api';
import { AddByPhoneModal } from './components/add-by-phone-modal';
import { CustomerCareEditModal } from './components/care-edit-modal';
import { type CustomerAction } from './components/action-menu';
import { CustomerTable } from './components/customer-table';
import { FilterBar } from './components/filter-bar';
import { CustomerCardList } from './components/customer-card-list';
import { RightRail, type RailKey } from './components/right-rail';
import { applyExtraFilters, countCustomerStats, countMobileCustomerFilters, parseSearchKeyword, type ExtraFilters } from './display';
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

type AlertState = {
  title: string;
  message: string;
} | null;

export function CustomerListPage() {
  const router = useRouter();
  const qc = useQueryClient();
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
  const [alertBox, setAlertBox] = useState<AlertState>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [careBusy, setCareBusy] = useState(false);
  const [careError, setCareError] = useState<string | null>(null);

  const search = parseSearchKeyword(keyword);
  const listQuery = {
    ...search,
    status: (status || undefined) as CustomerStatus | undefined,
  };

  const list = useQuery({
    queryKey: ['customers', listQuery],
    queryFn: () => listCustomers(listQuery),
  });

  const filtered = useMemo(
    () => applyExtraFilters(list.data?.items ?? [], extra),
    [list.data?.items, extra],
  );

  const selected = filtered.find((c) => c.id === selectedId) ?? null;
  const mobileFilterCount = countMobileCustomerFilters(status, extra);
  const stats = useMemo(() => countCustomerStats(filtered), [filtered]);

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

  const createMut = useMutation({
    mutationFn: (input: { fullName: string; phone: string }) => createCustomer(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['customers'] });
      setAddOpen(false);
      setAddError(null);
      flash('Đã thêm khách hàng.');
    },
    onError: (err: Error) => setAddError(err.message),
  });

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    const msg = consumeCareToast();
    if (!msg) return;
    setToast(msg);
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, []);

  function isMobileCare() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function openCareEdit(customer: CustomerListItem) {
    if (customer.isHidden) return;
    if (isMobileCare()) {
      router.push(`/khach-hang/${customer.id}/cham-soc`);
      return;
    }
    setCareError(null);
    setCareEdit({ customer });
  }

  async function handleAction(customer: CustomerListItem, action: CustomerAction) {
    setMenuId(null);
    setSelectedId(customer.id);
    if (action === 'chat') {
      setRail('chat');
      return;
    }
    if (action === 'messenger') {
      const thread = customer.facebook?.threadId;
      if (thread) {
        window.open(`https://www.facebook.com/messages/t/${thread}`, '_blank', 'noopener,noreferrer');
      } else {
        setAlertBox({
          title: 'Không mở được Messenger',
          message: 'Khách này chưa có thread Messenger.',
        });
      }
      return;
    }
    if (action === 'care') {
      openCareEdit(customer);
      return;
    }
    if (action === 'lodat') {
      flash('Tạo lô đất — sẽ làm ở màn lô đất.');
      return;
    }
    if (action === 'sodo') {
      router.push('/dich-vu-so-do');
      return;
    }
    if (action === 'pin') {
      await updateCustomer(customer.id, { isPinned: !customer.isPinned });
      await qc.invalidateQueries({ queryKey: ['customers'] });
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

  return (
    <div className="kh-page">
      <div className={`kh-s32${rail ? ' is-rail-open' : ''}`}>
        {/* §3.2.1 */}
        <div className="kh-s321">
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
              hasActiveFilters={mobileFilterCount > 0}
              onResetFilters={() => {
                setStatus('');
                setExtra(DEFAULT_EXTRA);
              }}
            />
          </section>

          {list.isLoading ? <p className="kh-status">Đang tải danh sách…</p> : null}
          {list.error ? (
            <p className="kh-status error">{(list.error as Error).message}</p>
          ) : null}

          {/* §3.2.1.2 */}
          {!list.isLoading && !list.error ? (
            <section className="kh-s3212" aria-label="Danh sách khách hàng">
              <CustomerTable
                items={filtered}
                total={list.data?.total ?? filtered.length}
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
              />
            </section>
          ) : null}

          {!list.isLoading && !list.error ? (
            <CustomerCardList
              items={filtered}
              total={list.data?.total ?? filtered.length}
              selectedId={selectedId}
              menuId={menuId}
              stats={stats}
              onSelect={setSelectedId}
              onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
              onCloseMenu={() => setMenuId(null)}
              onAction={(c, a) => {
                void handleAction(c, a);
              }}
              onAdd={() => setAddOpen(true)}
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
        />
      </div>

      <AddByPhoneModal
        open={addOpen}
        busy={createMut.isPending}
        error={addError}
        onClose={() => {
          setAddOpen(false);
          setAddError(null);
        }}
        onSubmit={async (fullName, phone) => {
          setAddError(null);
          await createMut.mutateAsync({ fullName, phone });
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
