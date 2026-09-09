'use client';

import { GitMerge, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  CustomerCareNote,
  CustomerDetail,
  CustomerLodatBrief,
  PhoneDuplicateExisting,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { CrmBadge } from '@/shared/ui/badge';
import { getCustomer, listCustomerLodats } from '../api';
import {
  channelLabel,
  demandLabel,
  formatBudget,
  initials,
  statusLabel,
  statusTone,
} from '../display';
import './phone-duplicate-modal.css';

type Mode = 'create' | 'merge' | 'info';

type Props = {
  open: boolean;
  mode: Mode;
  existing: PhoneDuplicateExisting | null;
  phone?: string;
  fullName?: string;
  sourceName?: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

function formatCareWhen(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}

function ExistingCustomerCard({
  detail,
  lots,
  loading,
}: {
  detail: CustomerDetail | null;
  lots: CustomerLodatBrief[];
  loading: boolean;
}) {
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    setAvatarBroken(false);
  }, [detail?.id, detail?.facebook?.avatarUrl]);

  if (loading) {
    return <p className="crm-form-hint">Đang tải hồ sơ khách…</p>;
  }
  if (!detail) {
    return <p className="crm-form-hint">Không tải được hồ sơ khách.</p>;
  }

  const avatarUrl = detail.facebook?.avatarUrl?.trim() || '';
  const showPhoto = Boolean(avatarUrl) && !avatarBroken;
  const facebookName = detail.facebook?.facebookName?.trim() || '';
  const phones =
    detail.phones.length > 0
      ? detail.phones.map((p) => p.phone).join(', ')
      : detail.primaryPhone || '—';
  const shownLots = lots.slice(0, 3);
  const extraLots = Math.max(0, lots.length - shownLots.length);
  const notes = (detail.careNotes ?? []).slice(0, 5);

  return (
    <article className="phone-dup-card">
      <div className="phone-dup-hero">
        <span className="phone-dup-avatar" aria-hidden>
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            initials(detail.fullName)
          )}
        </span>
        <div className="phone-dup-identity">
          <strong className="phone-dup-name">{detail.fullName}</strong>
          {facebookName && facebookName !== detail.fullName ? (
            <span className="phone-dup-fb">{facebookName}</span>
          ) : null}
          <div className="phone-dup-tags">
            <CrmBadge tone={statusTone(detail.status)}>{statusLabel(detail.status)}</CrmBadge>
            {detail.isHidden ? <CrmBadge tone="gray">Đã ẩn</CrmBadge> : null}
          </div>
        </div>
      </div>

      <dl className="phone-dup-facts">
        <dt>SĐT</dt>
        <dd>{phones}</dd>
        <dt>Kênh</dt>
        <dd>{channelLabel(detail)}</dd>
        <dt>Nhu cầu</dt>
        <dd>{demandLabel(detail)}</dd>
        <dt>Tài chính</dt>
        <dd className="crm-money">{formatBudget(detail.budgetMinVnd, detail.budgetMaxVnd)}</dd>
        <dt>Lô đất</dt>
        <dd>{detail.lodatCount > 0 ? `${detail.lodatCount} lô` : 'Chưa gắn lô'}</dd>
        <dt>Chat đã lưu</dt>
        <dd>{detail.messageCount > 0 ? `${detail.messageCount} tin` : 'Chưa có tin'}</dd>
      </dl>

      {shownLots.length > 0 ? (
        <div className="phone-dup-block">
          <h3>Lô đã gắn</h3>
          <ul className="phone-dup-lots">
            {shownLots.map((lot) => (
              <li key={lot.id}>
                <span className="phone-dup-lot-title">{lot.title}</span>
                {lot.address ? <span className="phone-dup-lot-meta">{lot.address}</span> : null}
              </li>
            ))}
          </ul>
          {extraLots > 0 ? (
            <p className="crm-form-hint">Còn {extraLots} lô nữa trên hồ sơ.</p>
          ) : null}
        </div>
      ) : null}

      <div className="phone-dup-block">
        <h3>Lịch sử chăm sóc ({detail.careNoteCount || notes.length})</h3>
        {notes.length === 0 ? (
          <p className="crm-form-hint">Chưa có lần chăm sóc.</p>
        ) : (
          <ul className="phone-dup-care">
            {notes.map((n: CustomerCareNote) => (
              <li key={n.id}>
                <div className="phone-dup-care-meta">
                  {formatCareWhen(n.createdAt)} · {n.employeeName}
                </div>
                {n.needSummary ? (
                  <div>
                    <span className="phone-dup-k">Nhu cầu</span> {n.needSummary}
                  </div>
                ) : null}
                {n.note ? (
                  <div>
                    <span className="phone-dup-k">Ghi chú</span> {n.note}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function PhoneDuplicateModal({
  open,
  mode,
  existing,
  phone,
  fullName,
  sourceName,
  busy,
  error,
  onClose,
  onConfirm,
}: Props) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [lots, setLots] = useState<CustomerLodatBrief[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !existing?.id) {
      setDetail(null);
      setLots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void Promise.all([getCustomer(existing.id), listCustomerLodats(existing.id)])
      .then(([nextDetail, lodatList]) => {
        if (cancelled) return;
        setDetail(nextDetail);
        setLots(lodatList.items ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setDetail(null);
        setLots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, existing?.id]);

  if (!open || !existing) return null;

  const title =
    mode === 'merge'
      ? 'Gộp khách Facebook vào hồ sơ có SĐT'
      : mode === 'info'
        ? 'Số điện thoại đã thuộc khách khác'
        : 'Số điện thoại đã có trên hồ sơ khách';

  const confirmLabel =
    mode === 'merge' ? 'Gộp khách' : mode === 'info' ? 'Về danh sách' : 'Cập nhật tên';

  const newName = fullName?.trim() || existing.fullName;

  return (
    <CrmDialog
      open={open}
      title={title}
      icon={mode === 'merge' ? GitMerge : UserRound}
      onClose={onClose}
      busy={busy}
      className="phone-dup-dialog"
    >
      <div className="crm-dialog-section phone-dup-body">
        {mode === 'create' ? (
          <p className="crm-form-hint">
            Số <strong>{phone || '—'}</strong> đã thuộc hồ sơ dưới. Không tạo khách mới.
          </p>
        ) : mode === 'merge' ? (
          <p className="crm-form-hint">
            Số <strong>{phone || '—'}</strong> đã thuộc khách có số điện thoại. Gộp khách
            Facebook <strong>{sourceName || 'hồ sơ Facebook'}</strong> vào hồ sơ đó?
          </p>
        ) : (
          <p className="crm-form-hint">
            Số <strong>{phone || '—'}</strong> đã thuộc khách có liên hệ Facebook. Không
            thêm số vào <strong>{sourceName || 'hồ sơ này'}</strong>.
          </p>
        )}

        <ExistingCustomerCard detail={detail} lots={lots} loading={loading} />

        {mode === 'create' ? (
          <p className="crm-form-hint phone-dup-action">
            Bấm <strong>Cập nhật tên</strong> sẽ đổi tên thành <strong>{newName}</strong>
            , lưu hồ sơ
            {existing.isHidden ? ', và mở lại khách đang ẩn' : ''}.
          </p>
        ) : null}

        {error ? <p className="crm-form-error">{error}</p> : null}
      </div>
      <div className="crm-dialog-actions">
        <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
          Đóng
        </button>
        <button
          type="button"
          className="crm-btn primary"
          disabled={busy || loading}
          onClick={() => {
            void onConfirm();
          }}
        >
          {busy ? 'Đang xử lý…' : confirmLabel}
        </button>
      </div>
    </CrmDialog>
  );
}
