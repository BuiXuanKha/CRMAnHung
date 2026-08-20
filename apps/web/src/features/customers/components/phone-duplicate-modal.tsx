'use client';

import { GitMerge } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CustomerCareNote, PhoneDuplicateExisting } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { CrmBadge } from '@/shared/ui/badge';
import { getCustomer } from '../api';
import { statusLabel, statusTone } from '../display';

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
  const [notes, setNotes] = useState<CustomerCareNote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !existing?.id) {
      setNotes([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getCustomer(existing.id)
      .then((detail) => {
        if (!cancelled) setNotes(detail.careNotes ?? []);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
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
    mode === 'merge' ? 'Gộp khách' : mode === 'info' ? 'Về danh sách' : 'OK';

  return (
    <CrmDialog open={open} title={title} icon={GitMerge} onClose={onClose} busy={busy}>
      <div className="crm-dialog-section">
        {mode === 'create' ? (
          <p className="crm-form-hint">
            Số <strong>{phone || '—'}</strong> đã thuộc khách{' '}
            <strong>{existing.fullName}</strong>
            {existing.isHidden ? ' (đã ẩn)' : ''}. Không tạo khách mới — bấm{' '}
            <strong>OK</strong> để cập nhật tên
            {fullName ? (
              <>
                {' '}
                thành <strong>{fullName}</strong>
              </>
            ) : null}{' '}
            và quay về danh sách.
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
        <p className="crm-form-hint" style={{ marginTop: 8 }}>
          <strong>{existing.fullName}</strong>
          {existing.facebookName ? ` · ${existing.facebookName}` : ''}
          {existing.primaryPhone ? ` · ${existing.primaryPhone}` : ''}{' '}
          <CrmBadge tone={statusTone(existing.status)}>{statusLabel(existing.status)}</CrmBadge>
        </p>
        {loading ? <p className="crm-form-hint">Đang tải thông tin…</p> : null}
        {error ? <p className="crm-form-error">{error}</p> : null}
        {!loading && notes.length > 0 ? (
          <div className="crm-dialog-section" style={{ marginTop: 12 }}>
            <h3>Lịch sử chăm sóc ({notes.length})</h3>
            <ul>
              {notes.slice(0, 5).map((n) => (
                <li key={n.id} className="crm-care-mini">
                  <div className="meta">
                    {new Date(n.createdAt).toLocaleString('vi-VN')} · {n.employeeName}
                  </div>
                  {n.needSummary ? <div>Nhu cầu: {n.needSummary}</div> : null}
                  {n.note ? <div>Ghi chú: {n.note}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
