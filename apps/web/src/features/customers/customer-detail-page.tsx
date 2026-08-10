'use client';

import { FormEvent, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CUSTOMER_STATUS_LABELS,
  CustomerStatus,
  type CustomerDetail,
} from '@crmanhung/shared';
import { addCareNote, getCustomer, updateCustomer } from './api';
import './customers.css';

export function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [careText, setCareText] = useState('');
  const [pending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      setError(null);
      try {
        setCustomer(await getCustomer(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được khách');
        setCustomer(null);
      }
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const patch = (input: Parameters<typeof updateCustomer>[1]) => {
    startTransition(async () => {
      try {
        setCustomer(await updateCustomer(id, input));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    });
  };

  const onCare = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        setCustomer(await addCareNote(id, { note: careText }));
        setCareText('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thêm được ghi chú');
      }
    });
  };

  if (error && !customer) {
    return (
      <div className="customers-page">
        <p className="customers-error">{error}</p>
        <Link href="/khach-hang">← Quay lại danh sách</Link>
      </div>
    );
  }

  if (!customer) {
    return <div className="customers-page">Đang tải…</div>;
  }

  return (
    <div className="customers-page">
      <p className="back">
        <Link href="/khach-hang">← Khách hàng</Link>
      </p>

      <header className="customers-header">
        <div>
          <h1>{customer.fullName}</h1>
          <p>
            {CUSTOMER_STATUS_LABELS[customer.status]}
            {customer.isHidden ? ' · Đã ẩn' : ''}
            {customer.isPinned ? ' · Đang ghim' : ''}
          </p>
        </div>
        <div className="detail-actions">
          <button
            type="button"
            className="btn-ghost"
            disabled={pending}
            onClick={() => patch({ isPinned: !customer.isPinned })}
          >
            {customer.isPinned ? 'Bỏ ghim' : 'Ghim'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={pending}
            onClick={() => patch({ isHidden: !customer.isHidden })}
          >
            {customer.isHidden ? 'Khôi phục' : 'Ẩn khách'}
          </button>
        </div>
      </header>

      {error ? <p className="customers-error">{error}</p> : null}

      <section className="detail-grid">
        <div className="detail-block">
          <h2>Thông tin</h2>
          <dl>
            <div>
              <dt>Trạng thái</dt>
              <dd>
                <select
                  value={customer.status}
                  disabled={pending}
                  onChange={(e) =>
                    patch({ status: e.target.value as CustomerStatus })
                  }
                >
                  {Object.values(CustomerStatus).map((s) => (
                    <option key={s} value={s}>
                      {CUSTOMER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
            <div>
              <dt>SĐT</dt>
              <dd>
                {customer.phones.length
                  ? customer.phones.map((p) => p.phone).join(', ')
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Facebook</dt>
              <dd>{customer.facebook?.facebookName ?? '—'}</dd>
            </div>
            <div>
              <dt>Nhân viên</dt>
              <dd>{customer.employeeName}</dd>
            </div>
            <div>
              <dt>Lô đất gắn</dt>
              <dd>{customer.lodatCount}</dd>
            </div>
            <div>
              <dt>Ghi chú</dt>
              <dd>{customer.note ?? '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="detail-block">
          <h2>Chăm sóc</h2>
          <form className="care-form" onSubmit={onCare}>
            <textarea
              value={careText}
              onChange={(e) => setCareText(e.target.value)}
              placeholder="Thêm ghi chú chăm sóc…"
              rows={3}
              required
            />
            <button type="submit" className="btn-primary" disabled={pending}>
              Thêm ghi chú
            </button>
          </form>
          <ul className="care-list">
            {customer.careNotes.length === 0 ? (
              <li className="muted">Chưa có ghi chú.</li>
            ) : (
              customer.careNotes.map((n) => (
                <li key={n.id}>
                  <strong>{n.employeeName}</strong>
                  <span className="muted">
                    {' '}
                    · {new Date(n.createdAt).toLocaleString('vi-VN')}
                  </span>
                  <p>{n.note}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
