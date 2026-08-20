'use client';

import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  renameCustomerSchema,
  type CustomerListItem,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';

type Props = {
  customer: CustomerListItem | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (fullName: string) => Promise<void>;
};

export function RenameCustomerModal({
  customer,
  busy,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [fullName, setFullName] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fbName = customer?.facebook?.facebookName?.trim() ?? '';
  const crmName = customer?.fullName?.trim() ?? '';
  const showFbHint = Boolean(fbName && fbName !== crmName);

  useEffect(() => {
    if (!customer) return;
    setFullName(customer.fullName);
    setParseError(null);
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
    return () => window.clearTimeout(t);
  }, [customer]);

  return (
    <CrmDialog
      open={Boolean(customer)}
      title="Sửa tên khách"
      icon={Pencil}
      onClose={onClose}
      busy={busy}
    >
      {customer ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = renameCustomerSchema.safeParse({ fullName });
            if (!parsed.success) {
              setParseError(
                parsed.error.issues[0]?.message ?? 'Tên khách không được để trống.',
              );
              inputRef.current?.focus();
              return;
            }
            if (parsed.data.fullName === crmName) {
              onClose();
              return;
            }
            setParseError(null);
            void onSubmit(parsed.data.fullName);
          }}
        >
          {showFbHint ? (
            <p className="crm-form-hint">
              Tên trên Facebook: <strong>{fbName}</strong> — chỉ đổi tên hiển thị trong CRM.
            </p>
          ) : (
            <p className="crm-form-hint">
              Tên này dùng trong danh sách và khi chăm sóc khách.
            </p>
          )}
          <label>
            Tên khách
            <input
              ref={inputRef}
              value={fullName}
              maxLength={120}
              disabled={busy}
              autoComplete="off"
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
          {parseError || error ? (
            <p className="crm-form-error">{parseError || error}</p>
          ) : null}
          <div className="crm-dialog-actions">
            <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="crm-btn primary" disabled={busy}>
              {busy ? 'Đang lưu…' : 'Lưu'}
            </button>
          </div>
        </form>
      ) : null}
    </CrmDialog>
  );
}
