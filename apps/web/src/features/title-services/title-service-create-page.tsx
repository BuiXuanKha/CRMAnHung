'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TitleServiceStatus, UserRole, type CreateTitleServiceInput } from '@crmanhung/shared';
import { getCustomer } from '@/features/customers/api';
import { useAuth } from '@/features/auth/auth-context';
import { CrmBadge } from '@/shared/ui/badge';
import { createTitleService } from './api';
import { formatMoneyInput, parseMoneyInput, statusLabel, statusTone, todayInputValue } from './display';
import { DEFAULT_TITLE_SERVICE_EXTRA, saveTitleServiceListState } from './list-state';
import '@/features/lodats/lodat-edit.css';

/** Form tạo hồ sơ sổ đỏ từ khách — title-services.md §12.4. */
export function TitleServiceCreatePage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const adminBlocked = user?.role === UserRole.ADMIN;

  const [feeText, setFeeText] = useState('');
  const [needSummary, setNeedSummary] = useState('');
  const [note, setNote] = useState('');
  const [startedAt, setStartedAt] = useState(todayInputValue());
  const [expectedDoneAt, setExpectedDoneAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const customerQ = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomer(customerId),
    enabled: !adminBlocked && Boolean(customerId),
  });
  const customer = customerQ.data;
  const hidden = Boolean(customer?.isHidden);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || hidden || adminBlocked) return;
    setFormError(null);
    if (!customerId) {
      setFormError('Thiếu khách hàng.');
      return;
    }
    const input: CreateTitleServiceInput = {
      customerId,
      agreedFeeVnd: parseMoneyInput(feeText),
      needSummary: needSummary.trim() || undefined,
      note: note.trim() || undefined,
      startedAt: startedAt || undefined,
      expectedDoneAt: expectedDoneAt || null,
    };
    setSaving(true);
    try {
      const created = await createTitleService(input);
      saveTitleServiceListState(null, {
        searchKeyword: '',
        status: '',
        employeeId: '',
        extra: DEFAULT_TITLE_SERVICE_EXTRA,
        selectedId: created.id,
      });
      router.push(`/dich-vu-so-do?id=${encodeURIComponent(created.id)}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không tạo được hồ sơ sổ đỏ.');
      setSaving(false);
    }
  }

  if (adminBlocked) {
    return (
      <div className="ld-edit-page">
        <div className="ld-edit-head">
          <Link href="/khach-hang" className="ld-edit-back">
            ← Khách hàng
          </Link>
          <h1>Tạo hồ sơ sổ đỏ</h1>
        </div>
        <p className="ld-edit-error">
          Admin không tạo dịch vụ sổ đỏ. Nhân viên tạo hồ sơ từ khách của mình.
        </p>
      </div>
    );
  }

  return (
    <div className="ld-edit-page">
      <div className="ld-edit-head">
        <Link href="/khach-hang" className="ld-edit-back">
          ← Khách hàng
        </Link>
        <h1>Tạo hồ sơ sổ đỏ</h1>
        {customer?.fullName ? (
          <span className="ld-edit-kind-badge">Khách: {customer.fullName}</span>
        ) : null}
      </div>

      {customerQ.isLoading ? <p className="ld-edit-state">Đang tải…</p> : null}
      {customerQ.error ? (
        <p className="ld-edit-error">{(customerQ.error as Error).message}</p>
      ) : null}
      {hidden ? (
        <p className="ld-edit-error">Không tạo hồ sơ cho khách đang ẩn.</p>
      ) : null}
      {formError ? <p className="ld-edit-error">{formError}</p> : null}

      {customer && !hidden ? (
        <form className="ld-edit-form" onSubmit={handleSubmit}>
          <section className="ld-edit-card">
            <h2 className="ld-edit-section-title">Khách hàng</h2>
            <div className="ld-edit-row2">
              <label className="ld-edit-field">
                <span>Tên khách</span>
                <input value={customer.fullName} disabled readOnly />
              </label>
              <label className="ld-edit-field">
                <span>Số điện thoại</span>
                <input value={customer.primaryPhone ?? '—'} disabled readOnly />
              </label>
            </div>
            <p className="ld-edit-hint muted">
              Trạng thái lúc tạo:{' '}
              <CrmBadge tone={statusTone(TitleServiceStatus.DANG_LAM)}>
                {statusLabel(TitleServiceStatus.DANG_LAM)}
              </CrmBadge>
              . Tài liệu, tiến độ và thu/chi thêm sau trên danh sách hồ sơ.
            </p>
          </section>

          <section className="ld-edit-card">
            <h2 className="ld-edit-section-title">Hồ sơ</h2>
            <label className="ld-edit-field">
              <span>Phí thỏa thuận (VND)</span>
              <input
                value={feeText}
                placeholder="VD: 15.000.000"
                onChange={(e) => setFeeText(formatMoneyInput(e.target.value))}
                disabled={saving}
                inputMode="numeric"
              />
            </label>
            <label className="ld-edit-field">
              <span>Nhu cầu</span>
              <textarea
                value={needSummary}
                onChange={(e) => setNeedSummary(e.target.value)}
                disabled={saving}
                rows={3}
                placeholder="Ví dụ: đo đạc, cấp đổi sổ, tách thửa…"
              />
            </label>
            <label className="ld-edit-field">
              <span>Ghi chú</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={saving}
                rows={3}
              />
            </label>
            <div className="ld-edit-row2">
              <label className="ld-edit-field">
                <span>Ngày bắt đầu</span>
                <input
                  type="date"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                  disabled={saving}
                />
              </label>
              <label className="ld-edit-field">
                <span>Dự kiến xong</span>
                <input
                  type="date"
                  value={expectedDoneAt}
                  onChange={(e) => setExpectedDoneAt(e.target.value)}
                  disabled={saving}
                />
              </label>
            </div>
          </section>

          <footer className="ld-edit-actions">
            <button
              type="button"
              className="ld-edit-cancel"
              disabled={saving}
              onClick={() => router.push('/khach-hang')}
            >
              Hủy
            </button>
            <button type="submit" className="ld-edit-save" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Lưu'}
            </button>
          </footer>
        </form>
      ) : null}
    </div>
  );
}
