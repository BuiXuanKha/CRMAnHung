'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getCustomer, listCustomerLodats } from './api';
import { DetailLodatList } from './components/detail-lodat-list';
import { DetailMobileFab } from './components/detail-mobile-fab';
import {
  channelLabel,
  formatBudget,
  formatCareTimestamp,
  formatRelativeAgo,
  initials,
  statusLabel,
  statusTone,
} from './display';
import { CrmBadge } from '@/shared/ui/badge';
import './customer-detail.css';
import '@/shared/ui/money.css';

export function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const detail = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
    enabled: Boolean(id),
  });

  const lodats = useQuery({
    queryKey: ['customer-lodats', id],
    queryFn: () => listCustomerLodats(id),
    enabled: Boolean(id),
  });

  function goBack() {
    router.push('/khach-hang', { scroll: false });
  }

  if (detail.isLoading) {
    return (
      <div className="kh-detail">
        <button type="button" className="kh-detail-back" onClick={goBack}>
          ← Danh sách khách
        </button>
        <p className="kh-detail-empty">Đang tải…</p>
      </div>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <div className="kh-detail">
        <button type="button" className="kh-detail-back" onClick={goBack}>
          ← Danh sách khách
        </button>
        <p className="kh-detail-empty kh-detail-error">
          {detail.error instanceof Error ? detail.error.message : 'Không tìm thấy khách hàng'}
        </p>
      </div>
    );
  }

  const customer = detail.data;
  const phones =
    customer.phones.length > 0
      ? customer.phones.map((p) => p.phone)
      : customer.primaryPhone
        ? [customer.primaryPhone]
        : [];
  const uniquePhones = [...new Set(phones.filter(Boolean))];
  const callPhone = customer.primaryPhone?.trim() || uniquePhones[0] || null;
  const need = customer.latestNeedSummary?.trim() ?? '';
  const note = customer.latestCareNote?.trim() ?? '';
  const hasSummary = Boolean(need || note);
  const budget = formatBudget(customer.budgetMinVnd, customer.budgetMaxVnd);
  const lots = lodats.data?.items ?? [];
  const careNotes = customer.careNotes ?? [];
  const hasFab = !customer.isHidden || Boolean(callPhone) || Boolean(customer.facebook);

  return (
    <>
      <div className={`kh-detail${hasFab ? ' has-fab' : ''}`}>
        <button type="button" className="kh-detail-back" onClick={goBack}>
          ← Danh sách khách
        </button>

        <section className="kh-detail-hero">
          <span className="kh-detail-avatar" aria-hidden>
            {customer.facebook?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={customer.facebook.avatarUrl} alt="" />
            ) : (
              initials(customer.fullName)
            )}
          </span>
          <div className="kh-detail-hero-text">
            <div className="kh-detail-name-row">
              <h1>{customer.fullName}</h1>
              <CrmBadge tone={statusTone(customer.status)}>{statusLabel(customer.status)}</CrmBadge>
              {customer.isHidden ? <CrmBadge tone="red">Đã xoá</CrmBadge> : null}
            </div>
            <p className="kh-detail-channel">{channelLabel(customer)}</p>
            <dl className="kh-detail-meta">
              <div>
                <dt>SĐT</dt>
                <dd>
                  {uniquePhones.length === 0 ? (
                    '—'
                  ) : (
                    <span className="kh-detail-phones">
                      {uniquePhones.map((phone) => (
                        <a key={phone} href={`tel:${phone}`}>
                          {phone}
                        </a>
                      ))}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Tài chính</dt>
                <dd className={budget === '—' ? undefined : 'crm-money'}>{budget}</dd>
              </div>
            </dl>
          </div>
        </section>

        {hasSummary ? (
          <section className="kh-detail-section">
            <h2>Thông tin hiện tại</h2>
            {need ? (
              <dl className="kh-detail-summary">
                <dt>Nhu cầu</dt>
                <dd>{need}</dd>
              </dl>
            ) : null}
            {note ? (
              <dl className="kh-detail-summary">
                <dt>Ghi chú</dt>
                <dd>{note}</dd>
              </dl>
            ) : null}
          </section>
        ) : null}

        <section className="kh-detail-section">
          <h2>Danh sách lô đất{lots.length ? ` (${lots.length})` : ''}</h2>
          <DetailLodatList lots={lots} loading={lodats.isLoading} />
        </section>

        <section className="kh-detail-section">
          <h2>Lịch sử chăm sóc{careNotes.length ? ` (${careNotes.length})` : ''}</h2>
          {careNotes.length === 0 ? (
            <p className="kh-detail-empty">Chưa có lịch sử chăm sóc.</p>
          ) : (
            <ul className="kh-detail-timeline">
              {careNotes.map((entry) => {
                const ago = formatRelativeAgo(entry.createdAt);
                return (
                  <li key={entry.id} className="kh-detail-care">
                    <div className="kh-detail-care-meta">
                      <span>
                        {formatCareTimestamp(entry.createdAt)}
                        {ago ? (
                          <>
                            {' '}
                            <span aria-hidden>|</span>{' '}
                            <span className="kh-detail-care-ago">{ago}</span>
                          </>
                        ) : null}
                      </span>
                      <span className="kh-detail-care-nv">{entry.employeeName}</span>
                    </div>
                    {entry.needSummary?.trim() ? (
                      <div className="kh-detail-care-field">
                        <span>Nhu cầu:</span>
                        {entry.needSummary}
                      </div>
                    ) : null}
                    {entry.note.trim() ? (
                      <div className="kh-detail-care-field">
                        <span>Ghi chú:</span>
                        {entry.note}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <DetailMobileFab customer={customer} />
    </>
  );
}
