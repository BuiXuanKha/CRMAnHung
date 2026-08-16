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
import { createCustomer, listCustomers, updateCustomer } from './api';
import './customers.css';

function formatBudget(min?: number | null, max?: number | null) {
  if (min == null && max == null) return 'Chưa có tài chính';
  const fmt = (n: number) =>
    n >= 1_000_000_000
      ? `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)} tỷ`
      : `${Math.round(n / 1_000_000)} tr`;
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

/** Giống CRM cũ: @ gồm đã ẩn, @@ chỉ đã ẩn. */
function parseSearch(raw: string): {
  keyword: string;
  includeHidden?: boolean;
  hiddenOnly?: boolean;
  mode: 'active' | 'include' | 'hidden';
} {
  const trimmed = raw.trim();
  if (trimmed.startsWith('@@')) {
    return {
      keyword: trimmed.slice(2).trim(),
      hiddenOnly: true,
      mode: 'hidden',
    };
  }
  if (trimmed.startsWith('@')) {
    return {
      keyword: trimmed.slice(1).trim(),
      includeHidden: true,
      mode: 'include',
    };
  }
  return { keyword: trimmed, mode: 'active' };
}

export function CustomerListPage() {
  const router = useRouter();
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  const load = (opts?: { search?: string; status?: CustomerStatus | '' }) => {
    const raw = opts?.search ?? searchInput;
    const parsed = parseSearch(raw);
    const st = opts?.status ?? status;
    startTransition(async () => {
      setError(null);
      try {
        const res = await listCustomers({
          keyword: parsed.keyword || undefined,
          status: st || undefined,
          includeHidden: parsed.includeHidden,
          hiddenOnly: parsed.hiddenOnly,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial mount
  }, []);

  useEffect(() => {
    const close = () => setMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const searchMode = parseSearch(searchInput).mode;

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
        load({ search: '', status: '' });
        setSelectedId(created.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tạo khách thất bại');
      }
    });
  };

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

  const openMobileDetail = (id: string) => {
    router.push(`/khach-hang/${id}`);
  };

  return (
    <div className="cm">
      <header className="cm-header">
        <div>
          <h1>Quản lý khách hàng</h1>
          <p>
            {pending ? 'Đang tải…' : `${total} khách`}
            {searchMode === 'include' ? ' · gồm đã ẩn' : null}
            {searchMode === 'hidden' ? ' · chỉ đã ẩn' : null}
          </p>
        </div>
        <button type="button" className="cm-btn cm-btn-primary" onClick={() => setShowCreate(true)}>
          Thêm khách bằng SĐT
        </button>
      </header>

      <div className="cm-toolbar">
        <div className="cm-search-row">
          <input
            className="cm-search"
            placeholder="Tìm tên, SĐT… (@ gồm đã ẩn, @@ chỉ đã ẩn)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') load();
            }}
          />
          <button type="button" className="cm-btn cm-btn-ghost" onClick={() => load()} disabled={pending}>
            Tìm
          </button>
          <button
            type="button"
            className="cm-btn cm-btn-ghost cm-mobile-only"
            onClick={() => setShowFilters((v) => !v)}
          >
            Bộ lọc
          </button>
        </div>

        <div className={showFilters ? 'cm-filters is-open' : 'cm-filters'}>
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
          {(status || searchInput.trim()) && (
            <button
              type="button"
              className="cm-btn cm-btn-ghost"
              onClick={() => {
                setSearchInput('');
                setStatus('');
                load({ search: '', status: '' });
              }}
            >
              Xoá lọc
            </button>
          )}
        </div>
      </div>

      {error ? <p className="cm-error">{error}</p> : null}

      <div className="cm-workspace">
        <section className="cm-list-pane" aria-label="Danh sách khách hàng">
          {/* Desktop rows */}
          <div className="cm-table cm-desktop-only" role="table">
            <div className="cm-table-head" role="row">
              <div role="columnheader">#</div>
              <div role="columnheader">Tên khách</div>
              <div role="columnheader">Nhu cầu / ghi chú</div>
              <div role="columnheader">Tài chính</div>
              <div role="columnheader">Thao tác</div>
            </div>
            <div className="cm-table-body">
              {items.length === 0 ? (
                <p className="cm-empty">
                  {pending
                    ? 'Đang tải…'
                    : 'Chưa có khách. Thêm bằng SĐT hoặc dùng Extension quét Messenger.'}
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
                    onDoubleClick={() => router.push(`/khach-hang/${item.id}`)}
                  >
                    <div className="cm-cell cm-cell-idx">{index + 1}</div>
                    <div className="cm-cell cm-cell-name">
                      <div className="cm-name-main">
                        <span className="cm-name">{item.fullName}</span>
                        <span className={statusClass(item.status)}>
                          {CUSTOMER_STATUS_LABELS[item.status]}
                        </span>
                        {item.isHidden ? <span className="cm-badge cm-badge-hidden">Đã ẩn</span> : null}
                        {item.isPinned ? <span className="cm-pin-mark" title="Đang ghim">★</span> : null}
                      </div>
                      <div className="cm-name-sub">
                        {item.primaryPhone ? (
                          <a
                            href={`tel:${item.primaryPhone}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.primaryPhone}
                          </a>
                        ) : (
                          <span>Chưa có SĐT</span>
                        )}
                        {item.facebook?.facebookName ? (
                          <span>· FB: {item.facebook.facebookName}</span>
                        ) : null}
                        {item.lodatCount > 0 ? <span>· {item.lodatCount} lô</span> : null}
                      </div>
                    </div>
                    <div className="cm-cell cm-cell-need">
                      {item.latestCareNote || item.note || '—'}
                    </div>
                    <div className="cm-cell cm-cell-budget">
                      {formatBudget(item.budgetMinVnd, item.budgetMaxVnd)}
                    </div>
                    <div className="cm-cell cm-cell-actions">
                      <div className="cm-actions">
                        <button
                          type="button"
                          className="cm-icon-btn"
                          title={item.isPinned ? 'Bỏ ghim' : 'Ghim khách'}
                          onClick={(e) => {
                            e.stopPropagation();
                            patchItem(item, { isPinned: !item.isPinned });
                          }}
                        >
                          {item.isPinned ? '★' : '☆'}
                        </button>
                        <div className="cm-menu-wrap">
                          <button
                            type="button"
                            className="cm-icon-btn"
                            aria-label="Thao tác"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuId((id) => (id === item.id ? null : item.id));
                            }}
                          >
                            ⋮
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
                                Xem chi tiết
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
                                {item.isHidden ? 'Khôi phục khách' : 'Ẩn khách'}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mobile cards */}
          <ul className="cm-cards cm-mobile-only">
            {items.length === 0 ? (
              <li className="cm-empty">
                {pending
                  ? 'Đang tải…'
                  : 'Chưa có khách. Bấm Thêm khách bằng SĐT để tạo mới.'}
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
                    onClick={() => openMobileDetail(item.id)}
                  >
                    <div className="cm-card-top">
                      <strong>{item.fullName}</strong>
                      <span className={statusClass(item.status)}>
                        {CUSTOMER_STATUS_LABELS[item.status]}
                      </span>
                    </div>
                    <div className="cm-card-meta">
                      {item.primaryPhone ?? 'Chưa có SĐT'}
                      {item.lodatCount > 0 ? ` · ${item.lodatCount} lô` : ''}
                    </div>
                    <div className="cm-card-need">
                      {item.latestCareNote || item.note || formatBudget(item.budgetMinVnd, item.budgetMaxVnd)}
                    </div>
                    {item.isHidden ? <span className="cm-badge cm-badge-hidden">Đã ẩn</span> : null}
                  </button>
                  <div className="cm-card-actions">
                    {item.primaryPhone ? (
                      <a className="cm-btn cm-btn-ghost" href={`tel:${item.primaryPhone}`}>
                        Gọi
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="cm-btn cm-btn-ghost"
                      onClick={() => patchItem(item, { isPinned: !item.isPinned })}
                    >
                      {item.isPinned ? 'Bỏ ghim' : 'Ghim'}
                    </button>
                    <Link className="cm-btn cm-btn-ghost" href={`/khach-hang/${item.id}`}>
                      Chi tiết
                    </Link>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <aside className="cm-preview cm-desktop-only" aria-label="Xem nhanh khách">
          {!selected ? (
            <div className="cm-preview-empty">
              <p>Chọn một khách ở danh sách để xem nhanh.</p>
              <p className="cm-preview-hint">Double-click dòng khách để mở trang chi tiết.</p>
            </div>
          ) : (
            <div className="cm-preview-body">
              <div className="cm-preview-head">
                <div>
                  <h2>{selected.fullName}</h2>
                  <p>
                    <span className={statusClass(selected.status)}>
                      {CUSTOMER_STATUS_LABELS[selected.status]}
                    </span>
                    {selected.isPinned ? ' · Đang ghim' : ''}
                    {selected.isHidden ? ' · Đã ẩn' : ''}
                  </p>
                </div>
                <Link className="cm-btn cm-btn-primary" href={`/khach-hang/${selected.id}`}>
                  Mở chi tiết
                </Link>
              </div>

              <dl className="cm-preview-dl">
                <div>
                  <dt>Số điện thoại</dt>
                  <dd>
                    {selected.primaryPhone ? (
                      <a href={`tel:${selected.primaryPhone}`}>{selected.primaryPhone}</a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Facebook</dt>
                  <dd>{selected.facebook?.facebookName ?? '—'}</dd>
                </div>
                <div>
                  <dt>Tài chính</dt>
                  <dd>{formatBudget(selected.budgetMinVnd, selected.budgetMaxVnd)}</dd>
                </div>
                <div>
                  <dt>Lô đất gắn</dt>
                  <dd>{selected.lodatCount}</dd>
                </div>
                <div>
                  <dt>Ghi chú / nhu cầu</dt>
                  <dd>{selected.note || '—'}</dd>
                </div>
                <div>
                  <dt>Chăm sóc gần nhất</dt>
                  <dd>{selected.latestCareNote || '—'}</dd>
                </div>
              </dl>

              <div className="cm-preview-actions">
                <button
                  type="button"
                  className="cm-btn cm-btn-ghost"
                  disabled={pending}
                  onClick={() => patchItem(selected, { isPinned: !selected.isPinned })}
                >
                  {selected.isPinned ? 'Bỏ ghim' : 'Ghim khách'}
                </button>
                <button
                  type="button"
                  className="cm-btn cm-btn-ghost"
                  disabled={pending}
                  onClick={() => patchItem(selected, { isHidden: !selected.isHidden })}
                >
                  {selected.isHidden ? 'Khôi phục' : 'Ẩn khách'}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {showCreate ? (
        <div className="cm-modal-backdrop" role="presentation" onClick={() => setShowCreate(false)}>
          <form
            className="cm-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={onCreate}
          >
            <h2>Thêm khách bằng số điện thoại</h2>
            <p className="cm-modal-sub">Nhập tên và SĐT khách liên hệ với bạn.</p>
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
              Ghi chú (tuỳ chọn)
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
