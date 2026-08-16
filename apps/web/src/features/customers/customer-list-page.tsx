'use client';

import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CUSTOMER_STATUS_LABELS,
  CustomerStatus,
  createCustomerSchema,
  type CustomerListItem,
} from '@crmanhung/shared';
import { createCustomer, getCustomer, listCustomers, updateCustomer } from './api';
import {
  MOCK_CONTACT_CHANNEL_OPTIONS,
  contactChannelOf,
} from './mock-data';
import type { CustomerDetail } from '@crmanhung/shared';
import './customers.css';

type SidePanel = 'none' | 'chat' | 'care' | 'lodat';
type BudgetFilter = '' | 'none' | 'has' | 'lt_1b' | '1b_2b' | 'gt_2b';

function formatBudget(min?: number | null, max?: number | null) {
  if (min == null && max == null) return '—';
  const fmt = (n: number) => {
    const ty = n / 1_000_000_000;
    if (ty >= 1) {
      const rounded = Math.round(ty * 10) / 10;
      return `${String(rounded).replace('.', ',')} tỷ`;
    }
    return `${Math.round(n / 1_000_000)} tr`;
  };
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `≥ ${fmt(min)}`;
  return `≤ ${fmt(max!)}`;
}

function statusClass(status: CustomerStatus) {
  switch (status) {
    case CustomerStatus.KHACH_MOI:
      return 'cm-badge cm-badge-moi';
    case CustomerStatus.KHACH_NET:
      return 'cm-badge cm-badge-net';
    case CustomerStatus.KHACH_CAN_CHAM_SOC:
      return 'cm-badge cm-badge-care';
    default:
      return 'cm-badge cm-badge-other';
  }
}

function parseSearch(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('@@')) {
    return { keyword: trimmed.slice(2).trim(), hiddenOnly: true as const, mode: 'hidden' as const };
  }
  if (trimmed.startsWith('@')) {
    return {
      keyword: trimmed.slice(1).trim(),
      includeHidden: true as const,
      mode: 'include' as const,
    };
  }
  return { keyword: trimmed, mode: 'active' as const };
}

export function CustomerListPage() {
  const router = useRouter();
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [budget, setBudget] = useState<BudgetFilter>('');
  const [channel, setChannel] = useState('');
  const [lodat, setLodat] = useState<'' | 'none'>('');
  const [need, setNeed] = useState<'' | 'none'>('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [sidePanel, setSidePanel] = useState<SidePanel>('none');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  const statusCounts = useMemo(() => {
    const counts = { KN: 0, KM: 0, CCS: 0, KHAC: 0, pinned: 0 };
    for (const item of items) {
      if (item.isPinned) counts.pinned += 1;
      if (item.status === CustomerStatus.KHACH_NET) counts.KN += 1;
      else if (item.status === CustomerStatus.KHACH_MOI) counts.KM += 1;
      else if (item.status === CustomerStatus.KHACH_CAN_CHAM_SOC) counts.CCS += 1;
      else counts.KHAC += 1;
    }
    return counts;
  }, [items]);

  const searchMode = parseSearch(searchInput).mode;
  const hasFilters = Boolean(status || budget || channel || lodat || need || searchInput.trim());

  const load = (overrides?: Partial<{
    search: string;
    status: CustomerStatus | '';
    budget: BudgetFilter;
    channel: string;
    lodat: '' | 'none';
    need: '' | 'none';
  }>) => {
    const raw = overrides?.search ?? searchInput;
    const parsed = parseSearch(raw);
    startTransition(async () => {
      setError(null);
      try {
        const res = await listCustomers({
          keyword: parsed.keyword || undefined,
          status: (overrides?.status ?? status) || undefined,
          includeHidden: 'includeHidden' in parsed ? parsed.includeHidden : undefined,
          hiddenOnly: 'hiddenOnly' in parsed ? parsed.hiddenOnly : undefined,
          budget: overrides?.budget ?? budget,
          channel: (overrides?.channel ?? channel) || undefined,
          lodat: overrides?.lodat ?? lodat,
          need: overrides?.need ?? need,
        });
        setItems(res.items);
        setTotal(res.total);
        setSelectedId((prev) => {
          if (prev && res.items.some((i) => i.id === prev)) return prev;
          return res.items[0]?.id ?? null;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được danh sách');
      }
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    startTransition(async () => {
      try {
        setDetail(await getCustomer(selectedId));
      } catch {
        setDetail(null);
      }
    });
  }, [selectedId]);

  useEffect(() => {
    const close = () => setMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const patchItem = (item: CustomerListItem, input: Parameters<typeof updateCustomer>[1]) => {
    startTransition(async () => {
      try {
        await updateCustomer(item.id, input);
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    });
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      try {
        const parsed = createCustomerSchema.parse({
          fullName,
          phone,
          note: note.trim() || undefined,
        });
        const created = await createCustomer(parsed);
        setShowCreate(false);
        setFullName('');
        setPhone('');
        setNote('');
        setSearchInput('');
        setStatus('');
        setBudget('');
        setChannel('');
        setLodat('');
        setNeed('');
        load({
          search: '',
          status: '',
          budget: '',
          channel: '',
          lodat: '',
          need: '',
        });
        setSelectedId(created.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tạo khách thất bại');
      }
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    setStatus('');
    setBudget('');
    setChannel('');
    setLodat('');
    setNeed('');
    load({ search: '', status: '', budget: '', channel: '', lodat: '', need: '' });
  };

  const toggleSide = (panel: SidePanel) => {
    setSidePanel((cur) => (cur === panel ? 'none' : panel));
  };

  return (
    <div className={`cm layout-${sidePanel}`}>
      <header className="cm-header">
        <h1>Quản lý khách hàng</h1>
        <button type="button" className="cm-btn cm-btn-primary" onClick={() => setShowCreate(true)}>
          + Thêm khách hàng bằng số điện thoại
        </button>
      </header>

      <section className="cm-filter-panel" aria-label="Lọc và tìm kiếm khách hàng">
        <div className="cm-filter-bar">
          <div className="cm-search-wrap">
            <input
              type="search"
              className="cm-search"
              placeholder="Tìm tên, SĐT, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') load();
              }}
            />
            {searchMode === 'include' ? (
              <span className="cm-mode-badge">@ Bao gồm đã xoá</span>
            ) : null}
            {searchMode === 'hidden' ? (
              <span className="cm-mode-badge is-hidden">@@ Chỉ đã xoá</span>
            ) : null}
          </div>

          <button
            type="button"
            className="cm-btn cm-btn-ghost cm-mobile-only"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            Bộ lọc
          </button>
          <button
            type="button"
            className="cm-btn cm-btn-ghost cm-mobile-only"
            onClick={() => load()}
            disabled={pending}
          >
            Tìm
          </button>

          <div className={filtersOpen ? 'cm-filter-advanced is-open' : 'cm-filter-advanced'}>
            <select
              value={status}
              aria-label="Lọc trạng thái"
              onChange={(e) => {
                const v = e.target.value as CustomerStatus | '';
                setStatus(v);
                load({ status: v });
              }}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.values(CustomerStatus).map((s) => (
                <option key={s} value={s}>
                  {CUSTOMER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={budget}
              aria-label="Lọc tài chính"
              onChange={(e) => {
                const v = e.target.value as BudgetFilter;
                setBudget(v);
                load({ budget: v });
              }}
            >
              <option value="">Tất cả tài chính</option>
              <option value="none">Chưa có tài chính</option>
              <option value="has">Đã có tài chính</option>
              <option value="lt_1b">Dưới 1 tỷ</option>
              <option value="1b_2b">1 tỷ – 2 tỷ</option>
              <option value="gt_2b">Trên 2 tỷ</option>
            </select>
            <select
              value={channel}
              aria-label="Lọc kênh liên hệ"
              onChange={(e) => {
                setChannel(e.target.value);
                load({ channel: e.target.value });
              }}
            >
              <option value="">Tất cả kênh liên hệ</option>
              {MOCK_CONTACT_CHANNEL_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={lodat}
              aria-label="Lọc lô đất"
              onChange={(e) => {
                const v = e.target.value as '' | 'none';
                setLodat(v);
                load({ lodat: v });
              }}
            >
              <option value="">Tất cả lô đất</option>
              <option value="none">Chưa gắn lô đất</option>
            </select>
            <select
              value={need}
              aria-label="Lọc nhu cầu"
              onChange={(e) => {
                const v = e.target.value as '' | 'none';
                setNeed(v);
                load({ need: v });
              }}
            >
              <option value="">Tất cả nhu cầu</option>
              <option value="none">Chưa có nhu cầu</option>
            </select>
            {hasFilters ? (
              <button type="button" className="cm-btn cm-btn-ghost" onClick={clearFilters}>
                Xoá lọc
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {error ? <p className="cm-error">{error}</p> : null}

      <div className="cm-workspace">
        <section className="cm-list-pane" aria-label="Danh sách khách hàng">
          <div className="cm-table cm-desktop-only" role="table">
            <div className="cm-table-head" role="row">
              <div role="columnheader">#</div>
              <div role="columnheader">Tên khách</div>
              <div role="columnheader">Nhu cầu</div>
              <div role="columnheader">Tài chính</div>
              <div role="columnheader">Kênh liên hệ</div>
              <div role="columnheader">Thao tác</div>
            </div>
            <div className="cm-table-body">
              {items.length === 0 ? (
                <p className="cm-empty">
                  {pending
                    ? 'Đang tải…'
                    : hasFilters
                      ? 'Không có khách hàng nào khớp với bộ lọc hiện tại.'
                      : 'Chưa có khách hàng. Dùng Extension trên Messenger hoặc thêm bằng SĐT.'}
                </p>
              ) : (
                items.map((item, index) => (
                  <div
                    key={item.id}
                    role="row"
                    className={[
                      'cm-row',
                      selectedId === item.id ? 'is-active' : '',
                      item.isPinned ? 'is-pinned' : '',
                      item.isHidden ? 'is-hidden' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSelectedId(item.id)}
                    onDoubleClick={() => {
                      if (!item.isHidden) router.push(`/khach-hang/${item.id}`);
                    }}
                  >
                    <div className="cm-cell cm-cell-idx">{index + 1}</div>
                    <div className="cm-cell cm-cell-name">
                      <div className="cm-name-main">
                        <span className="cm-avatar" aria-hidden />
                        <span className="cm-name">{item.fullName}</span>
                        <span className={statusClass(item.status)}>
                          {CUSTOMER_STATUS_LABELS[item.status]}
                        </span>
                        {item.isHidden ? (
                          <span className="cm-badge cm-badge-hidden">Đã xoá</span>
                        ) : null}
                        {item.lodatCount > 0 ? (
                          <span className="cm-lodat-count" title={`${item.lodatCount} lô đất`}>
                            📍{item.lodatCount}
                          </span>
                        ) : null}
                      </div>
                      <div className="cm-name-sub">
                        {item.primaryPhone ? (
                          <a href={`tel:${item.primaryPhone}`} onClick={(e) => e.stopPropagation()}>
                            {item.primaryPhone}
                          </a>
                        ) : (
                          <span>Chưa có SĐT</span>
                        )}
                        {item.facebook?.facebookName ? (
                          <span>· {item.facebook.facebookName}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="cm-cell">{item.note || '—'}</div>
                    <div className="cm-cell">
                      {formatBudget(item.budgetMinVnd, item.budgetMaxVnd)}
                    </div>
                    <div className="cm-cell cm-cell-channel">{contactChannelOf(item.id)}</div>
                    <div className="cm-cell cm-cell-actions">
                      <div className="cm-menu-wrap">
                        <button
                          type="button"
                          className="cm-action-trigger"
                          aria-label="Thao tác"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuId((id) => (id === item.id ? null : item.id));
                          }}
                        >
                          ▾
                        </button>
                        {menuId === item.id ? (
                          <div className="cm-menu" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuId(null);
                                router.push(`/khach-hang/${item.id}`);
                              }}
                            >
                              Xem chi tiết / chăm sóc
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuId(null);
                                patchItem(item, { isPinned: !item.isPinned });
                              }}
                            >
                              {item.isPinned ? 'Bỏ ghim khách' : 'Ghim khách'}
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuId(null);
                                patchItem(item, { isHidden: !item.isHidden });
                              }}
                            >
                              {item.isHidden ? 'Khôi phục khách' : 'Xóa khách'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="cm-table-footer">
              {hasFilters ? (
                <span>
                  Khớp lọc <strong>{items.length}</strong>
                  {total > items.length ? (
                    <>
                      {' '}
                      / Tổng <strong>{total}</strong> khách hàng
                    </>
                  ) : null}
                </span>
              ) : (
                <span>
                  Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> khách
                  hàng
                </span>
              )}
            </div>
          </div>

          <ul className="cm-cards cm-mobile-only">
            {items.length === 0 ? (
              <li className="cm-empty">
                {pending ? 'Đang tải…' : 'Chưa có khách. Bấm Thêm khách bằng SĐT.'}
              </li>
            ) : (
              items.map((item) => (
                <li
                  key={item.id}
                  className={[
                    'cm-card',
                    item.isPinned ? 'is-pinned' : '',
                    item.isHidden ? 'is-hidden' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <button
                    type="button"
                    className="cm-card-main"
                    onClick={() => router.push(`/khach-hang/${item.id}`)}
                  >
                    <div className="cm-card-top">
                      <strong>{item.fullName}</strong>
                      <span className={statusClass(item.status)}>
                        {CUSTOMER_STATUS_LABELS[item.status]}
                      </span>
                    </div>
                    <div className="cm-card-meta">
                      {contactChannelOf(item.id)}
                      {item.primaryPhone ? ` · ${item.primaryPhone}` : ''}
                    </div>
                    <div className="cm-card-need">{item.note || '—'}</div>
                    <div className="cm-card-budget">
                      {formatBudget(item.budgetMinVnd, item.budgetMaxVnd)}
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="cm-mobile-stats cm-mobile-only">
            <span>
              All: <strong>{items.length}</strong>
            </span>
            <span>
              KN: <strong>{statusCounts.KN}</strong>
            </span>
            <span>
              KM: <strong>{statusCounts.KM}</strong>
            </span>
            <span>
              CCS: <strong>{statusCounts.CCS}</strong>
            </span>
            <span>
              KH: <strong>{statusCounts.KHAC}</strong>
            </span>
            <span>
              ĐG: <strong>{statusCounts.pinned}</strong>
            </span>
          </div>
        </section>

        <div className="cm-side-rails cm-desktop-only" aria-label="Panel phụ">
          <button
            type="button"
            className={sidePanel === 'chat' ? 'cm-rail is-active' : 'cm-rail'}
            onClick={() => toggleSide('chat')}
          >
            Nội dung chat
          </button>
          <button
            type="button"
            className={sidePanel === 'care' ? 'cm-rail is-active' : 'cm-rail'}
            onClick={() => toggleSide('care')}
          >
            Lịch sử chăm sóc
          </button>
          <button
            type="button"
            className={sidePanel === 'lodat' ? 'cm-rail is-active' : 'cm-rail'}
            onClick={() => toggleSide('lodat')}
          >
            Danh sách lô đất
          </button>
        </div>

        {sidePanel !== 'none' ? (
          <aside className="cm-side-panel cm-desktop-only">
            <div className="cm-side-panel-head">
              <h2>
                {sidePanel === 'chat'
                  ? 'Nội dung chat'
                  : sidePanel === 'care'
                    ? 'Lịch sử chăm sóc'
                    : 'Danh sách lô đất'}
              </h2>
              <button type="button" className="cm-btn cm-btn-ghost" onClick={() => setSidePanel('none')}>
                Đóng
              </button>
            </div>
            {!selected ? (
              <p className="cm-side-empty">Chọn một khách ở danh sách.</p>
            ) : sidePanel === 'chat' ? (
              <div className="cm-side-body">
                <p>
                  <strong>{selected.fullName}</strong>
                </p>
                <p className="cm-muted">
                  {selected.facebook?.facebookName
                    ? `FB: ${selected.facebook.facebookName}`
                    : 'Chưa có dữ liệu chat (mock).'}
                </p>
                <p className="cm-muted">
                  Khi nối API/Extension, hội thoại Messenger sẽ hiện tại đây.
                </p>
              </div>
            ) : sidePanel === 'care' ? (
              <div className="cm-side-body">
                {(detail?.careNotes?.length ?? 0) === 0 ? (
                  <p className="cm-muted">Chưa có lịch sử chăm sóc.</p>
                ) : (
                  <ul className="cm-care-list">
                    {detail?.careNotes.map((n) => (
                      <li key={n.id}>
                        <time>{new Date(n.createdAt).toLocaleString('vi-VN')}</time>
                        <p>{n.note}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <Link className="cm-btn cm-btn-primary" href={`/khach-hang/${selected.id}`}>
                  Cập nhật chăm sóc
                </Link>
              </div>
            ) : (
              <div className="cm-side-body">
                <p>
                  Đang gắn: <strong>{selected.lodatCount}</strong> lô đất
                </p>
                <p className="cm-muted">
                  {selected.lodatCount > 0
                    ? 'Chi tiết lô đất sẽ hiện khi module lô đất mock/API sẵn sàng.'
                    : 'Khách chưa gắn lô đất.'}
                </p>
                <Link className="cm-btn cm-btn-ghost" href="/lo-dat">
                  Mở quản lý lô đất
                </Link>
              </div>
            )}
          </aside>
        ) : null}
      </div>

      <button
        type="button"
        className="cm-fab cm-mobile-only"
        onClick={() => setShowCreate(true)}
      >
        + Thêm khách bằng SĐT
      </button>

      {showCreate ? (
        <div className="cm-modal-backdrop" role="presentation" onClick={() => setShowCreate(false)}>
          <form className="cm-modal" onClick={(e) => e.stopPropagation()} onSubmit={onCreate}>
            <h2>Thêm khách hàng bằng số điện thoại</h2>
            <label>
              Tên khách
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              Số điện thoại khách
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0xxxxxxxxx"
                inputMode="numeric"
                required
              />
            </label>
            <label>
              Ghi chú / nhu cầu (tuỳ chọn)
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="cm-modal-actions">
              <button type="button" className="cm-btn cm-btn-ghost" onClick={() => setShowCreate(false)}>
                Đóng
              </button>
              <button type="submit" className="cm-btn cm-btn-primary" disabled={pending}>
                Thêm khách
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
