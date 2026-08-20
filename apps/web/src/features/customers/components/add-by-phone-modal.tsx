'use client';

import { Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  createCustomerSchema,
  type CreateCustomerInput,
  type EmployeeHotline,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';

type Props = {
  open: boolean;
  busy: boolean;
  error: string | null;
  hotlines: EmployeeHotline[];
  hotlinesLoading: boolean;
  onClose: () => void;
  onOpenHotlines: () => void;
  onSubmit: (input: CreateCustomerInput) => Promise<void>;
};

const LAST_HOTLINE_KEY = 'crmanhung_last_source_hotline_id';

export function AddByPhoneModal({
  open,
  busy,
  error,
  hotlines,
  hotlinesLoading,
  onClose,
  onOpenHotlines,
  onSubmit,
}: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [sourceHotlineId, setSourceHotlineId] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const active = hotlines.filter((h) => h.isActive);
  const noHotlines = !hotlinesLoading && active.length === 0;

  useEffect(() => {
    if (!open) return;
    setFullName('');
    setPhone('');
    setNote('');
    setParseError(null);
    setSourceHotlineId('');
    const t = window.setTimeout(() => nameRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || sourceHotlineId) return;
    const live = hotlines.filter((h) => h.isActive);
    if (live.length === 0) return;
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem(LAST_HOTLINE_KEY) : null;
    setSourceHotlineId(live.find((h) => h.id === stored)?.id ?? live[0].id);
  }, [open, hotlines, sourceHotlineId]);

  return (
    <CrmDialog
      open={open}
      title="Thêm khách hàng bằng số điện"
      icon={Phone}
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = createCustomerSchema.safeParse({
            fullName,
            phone,
            sourceHotlineId,
            note,
          });
          if (!parsed.success) {
            setParseError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');
            return;
          }
          setParseError(null);
          if (parsed.data.sourceHotlineId) {
            localStorage.setItem(LAST_HOTLINE_KEY, parsed.data.sourceHotlineId);
          }
          void onSubmit(parsed.data);
        }}
      >
        {noHotlines ? (
          <p className="crm-form-hint-box">
            Bạn chưa có hotline đang bật. Vào{' '}
            <button type="button" className="crm-link-btn" onClick={onOpenHotlines}>
              Cài đặt → Quản lý SĐT
            </button>{' '}
            để thêm số trước.
          </p>
        ) : null}
        <label>
          Khách liên hệ qua
          <select
            value={sourceHotlineId}
            onChange={(e) => setSourceHotlineId(e.target.value)}
            disabled={busy || hotlinesLoading || noHotlines}
            required
          >
            <option value="">
              {hotlinesLoading ? 'Đang tải hotline…' : '— Chọn hotline —'}
            </option>
            {active.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label} ({h.phone})
              </option>
            ))}
          </select>
        </label>
        <label>
          Tên khách
          <input
            ref={nameRef}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="VD: Anh Nam (Bình Thạnh)"
            maxLength={120}
            disabled={busy || noHotlines}
            required
          />
        </label>
        <label>
          Số điện thoại khách
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            maxLength={10}
            placeholder="0xxxxxxxxx"
            disabled={busy || noHotlines}
            required
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
        </label>
        <label>
          Ghi chú
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nguồn khách, nhu cầu sơ bộ..."
            maxLength={500}
            disabled={busy || noHotlines}
          />
        </label>
        {parseError || error ? (
          <p className="crm-form-error">{parseError || error}</p>
        ) : null}
        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
            Huỷ
          </button>
          <button
            type="submit"
            className="crm-btn primary"
            disabled={busy || hotlinesLoading || noHotlines}
          >
            {busy ? 'Đang lưu…' : 'Thêm khách'}
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
