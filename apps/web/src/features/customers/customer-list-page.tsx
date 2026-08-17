'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CustomerStatus, type CustomerListItem } from '@crmanhung/shared';
import { addCareNote, createCustomer, getCustomer, listCustomers, updateCustomer } from './api';
import { AddByPhoneModal } from './components/add-by-phone-modal';
import { type CustomerAction } from './components/action-menu';
import { CustomerTable } from './components/customer-table';
import { FilterBar } from './components/filter-bar';
import { RightRail, type RailKey } from './components/right-rail';
import { applyExtraFilters, parseSearchKeyword, type ExtraFilters } from './display';
import './customers.css';
import './customers-chrome.css';

const DEFAULT_EXTRA: ExtraFilters = {
  finance: 'all',
  channel: 'all',
  lodat: 'all',
  demand: 'all',
};

export function CustomerListPage() {
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [extra, setExtra] = useState<ExtraFilters>(DEFAULT_EXTRA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [rail, setRail] = useState<RailKey | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  const detail = useQuery({
    queryKey: ['customer', selectedId],
    queryFn: () => getCustomer(selectedId as string),
    enabled: Boolean(selectedId) && rail === 'care',
  });

  const createMut = useMutation({
    mutationFn: (input: { fullName: string; phone: string }) => createCustomer(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['customers'] });
      setAddOpen(false);
      setAddError(null);
      flash('Đã thêm khách hàng (mock).');
    },
    onError: (err: Error) => setAddError(err.message),
  });

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
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
        flash('Khách này chưa có thread Messenger.');
      }
      return;
    }
    if (action === 'care') {
      const note = window.prompt('Cập nhật chăm sóc', customer.latestCareNote ?? '');
      if (note?.trim()) {
        await addCareNote(customer.id, { note: note.trim() });
        await qc.invalidateQueries({ queryKey: ['customers'] });
        await qc.invalidateQueries({ queryKey: ['customer', customer.id] });
        setRail('care');
        flash('Đã thêm ghi chú chăm sóc.');
      }
      return;
    }
    if (action === 'lodat') {
      flash('Tạo lô đất — sẽ làm ở màn lô đất.');
      return;
    }
    if (action === 'sodo') {
      flash('Dịch vụ sổ đỏ — sẽ làm ở màn sổ đỏ.');
      return;
    }
    if (action === 'pin') {
      await updateCustomer(customer.id, { isPinned: !customer.isPinned });
      await qc.invalidateQueries({ queryKey: ['customers'] });
      return;
    }
    if (action === 'delete') {
      if (!window.confirm(`Ẩn khách «${customer.fullName}»?`)) return;
      await updateCustomer(customer.id, { isHidden: true });
      await qc.invalidateQueries({ queryKey: ['customers'] });
      flash('Đã ẩn khách (xóa mềm).');
    }
  }

  return (
    <div className="kh-page">
      {/* §3.1 */}
      <header className="kh-s31">
        <h1>Quản lý khách hàng</h1>
        <button type="button" className="kh-add" onClick={() => setAddOpen(true)}>
          + Thêm khách hàng bằng số điện thoại
        </button>
      </header>

      {/* §3.2 */}
      <div className={`kh-s32${rail ? ' is-rail-open' : ''}`}>
        {/* §3.2.1 */}
        <div className="kh-s321">
          {/* §3.2.1.1 */}
          <section className="kh-s3211" aria-label="Tìm kiếm và lọc">
            <FilterBar
              keyword={keyword}
              onKeyword={setKeyword}
              status={status}
              onStatus={setStatus}
              extra={extra}
              onExtra={setExtra}
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
                onSelect={setSelectedId}
                onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
                onCloseMenu={() => setMenuId(null)}
                onAction={(c, a) => {
                  void handleAction(c, a);
                }}
              />
            </section>
          ) : null}
        </div>

        {/* §3.2.2 */}
        <RightRail
          open={rail}
          onToggle={(key) => setRail((cur) => (cur === key ? null : key))}
          customer={selected}
          detail={detail.data ?? null}
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
      {toast ? <div className="kh-toast">{toast}</div> : null}
    </div>
  );
}
