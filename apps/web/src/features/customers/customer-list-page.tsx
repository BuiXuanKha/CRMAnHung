'use client';

import { FormEvent, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  CUSTOMER_STATUS_LABELS,
  CustomerStatus,
  createCustomerSchema,
  type CustomerListItem,
} from '@crmanhung/shared';
import { createCustomer, listCustomers, updateCustomer } from './api';
import './customers.css';

function formatBudget(min?: number | null, max?: number | null) {
  if (min == null && max == null) return '—';
  const fmt = (n: number) =>
    n >= 1_000_000_000
      ? `${(n / 1_000_000_000).toFixed(1)} tỷ`
      : `${Math.round(n / 1_000_000)} tr`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `≥ ${fmt(min)}`;
  return `≤ ${fmt(max!)}`;
}

export function CustomerListPage() {
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [includeHidden, setIncludeHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pending, startTransition] = useTransition();

  const load = (opts?: {
    keyword?: string;
    status?: CustomerStatus | '';
    includeHidden?: boolean;
  }) => {
    startTransition(async () => {
      setError(null);
      try {
        const res = await listCustomers({
          keyword: opts?.keyword ?? keyword,
          status: (opts?.status ?? status) || undefined,
          includeHidden: opts?.includeHidden ?? includeHidden,
        });
        setItems(res.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được danh sách');
      }
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial mount
  }, []);

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      try {
        const parsed = createCustomerSchema.parse({ fullName, phone });
        await createCustomer(parsed);
        setShowCreate(false);
        setFullName('');
        setPhone('');
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tạo khách thất bại');
      }
    });
  };

  const togglePin = (item: CustomerListItem) => {
    startTransition(async () => {
      try {
        await updateCustomer(item.id, { isPinned: !item.isPinned });
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không ghim được');
      }
    });
  };

  return (
    <div className="customers-page">
      <header className="customers-header">
        <div>
          <h1>Khách hàng</h1>
          <p>Danh sách khách đang chăm sóc (mock — chưa nối API).</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>
          Thêm khách
        </button>
      </header>

      <div className="customers-toolbar">
        <input
          placeholder="Tìm tên / SĐT / Facebook…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') load();
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            const v = e.target.value as CustomerStatus | '';
            setStatus(v);
            load({ status: v });
          }}
        >
          <option value="">Mọi trạng thái</option>
          {Object.values(CustomerStatus).map((s) => (
            <option key={s} value={s}>
              {CUSTOMER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <label className="check">
          <input
            type="checkbox"
            checked={includeHidden}
            onChange={(e) => {
              setIncludeHidden(e.target.checked);
              load({ includeHidden: e.target.checked });
            }}
          />
          Hiện khách ẩn
        </label>
        <button type="button" className="btn-ghost" onClick={() => load()} disabled={pending}>
          Lọc
        </button>
      </div>

      {error ? <p className="customers-error">{error}</p> : null}

      <div className="customers-table-wrap">
        <table className="customers-table">
          <thead>
            <tr>
              <th />
              <th>Tên</th>
              <th>SĐT</th>
              <th>Trạng thái</th>
              <th>Nhu cầu</th>
              <th>Ngân sách</th>
              <th>NV</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty">
                  {pending ? 'Đang tải…' : 'Không có khách phù hợp bộ lọc.'}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className={item.isHidden ? 'is-hidden' : undefined}>
                  <td>
                    <button
                      type="button"
                      className={item.isPinned ? 'pin on' : 'pin'}
                      title={item.isPinned ? 'Bỏ ghim' : 'Ghim'}
                      onClick={() => togglePin(item)}
                    >
                      ★
                    </button>
                  </td>
                  <td>
                    <Link href={`/khach-hang/${item.id}`} className="name-link">
                      {item.fullName}
                      {item.isHidden ? <span className="badge">Đã ẩn</span> : null}
                      {item.facebook?.facebookName ? (
                        <span className="sub">{item.facebook.facebookName}</span>
                      ) : null}
                    </Link>
                  </td>
                  <td>{item.primaryPhone ?? '—'}</td>
                  <td>{CUSTOMER_STATUS_LABELS[item.status]}</td>
                  <td className="muted">{item.latestCareNote ?? '—'}</td>
                  <td>{formatBudget(item.budgetMinVnd, item.budgetMaxVnd)}</td>
                  <td className="muted">{item.employeeName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowCreate(false)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={onCreate}
          >
            <h2>Thêm khách thủ công</h2>
            <label>
              Họ tên
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              Số điện thoại
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0xxxxxxxxx"
                required
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>
                Huỷ
              </button>
              <button type="submit" className="btn-primary" disabled={pending}>
                Lưu
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
