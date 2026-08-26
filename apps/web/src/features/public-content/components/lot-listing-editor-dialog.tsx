'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageOff, PenLine } from 'lucide-react';
import {
  updatePublicListingDraftSchema,
  type PublicListingPriceMode,
  type PublicWebStaffLotRow,
  type UpdatePublicListingDraftInput,
} from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { CrmDialog } from '@/shared/ui/dialog';
import { publicListingInternalsHint } from '../listing-copy';

type Props = {
  lot: PublicWebStaffLotRow | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSaveDraft: (input: UpdatePublicListingDraftInput) => Promise<void>;
  onPublish: (input: UpdatePublicListingDraftInput) => Promise<void>;
};

export function LotListingEditorDialog({
  lot,
  busy,
  error,
  onClose,
  onSaveDraft,
  onPublish,
}: Props) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [priceMode, setPriceMode] = useState<PublicListingPriceMode>('CONTACT');
  const [priceLabel, setPriceLabel] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!lot) return;
    setTitle(lot.title);
    setLocation(lot.location);
    setPriceMode(lot.priceMode);
    setPriceLabel(lot.priceMode === 'AMOUNT' ? (lot.priceLabel ?? '') : '');
    setExcerpt(lot.excerpt);
    setParseError(null);
    const t = window.setTimeout(() => titleRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [lot]);

  function parsedInput(): UpdatePublicListingDraftInput | null {
    const parsed = updatePublicListingDraftSchema.safeParse({
      title,
      location,
      priceMode,
      priceLabel: priceMode === 'AMOUNT' ? priceLabel.trim() || null : null,
      excerpt,
    });
    if (!parsed.success) {
      setParseError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');
      return null;
    }
    setParseError(null);
    return parsed.data;
  }

  return (
    <CrmDialog
      open={Boolean(lot)}
      title="Soạn bài đăng"
      icon={PenLine}
      onClose={onClose}
      busy={busy}
    >
      {lot ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = parsedInput();
            if (input) void onSaveDraft(input);
          }}
        >
          <p className="crm-form-hint-box">{publicListingInternalsHint(lot.priceVnd)}</p>
          <div className="pw-editor-cover">
            <span className="pw-thumb">
              {lot.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lot.coverImageUrl} alt="" />
              ) : (
                <span className="pw-thumb-empty">
                  <Icon icon={ImageOff} size="sm" />
                </span>
              )}
            </span>
            <span className="pw-editor-cover-note">Ảnh bìa lấy từ lô CRM (không đổi ở đây).</span>
          </div>
          <label>
            Tiêu đề công khai
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: LK5 - 37 mặt sông"
              maxLength={160}
              disabled={busy}
              required
            />
          </label>
          <label>
            Địa chỉ công khai
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Khu đô thị, xã / phường…"
              maxLength={240}
              disabled={busy}
            />
          </label>
          <label>
            Giá trên web khách
            <select
              value={priceMode}
              onChange={(e) => {
                const next = e.target.value as PublicListingPriceMode;
                setPriceMode(next);
                if (next === 'CONTACT') setPriceLabel('');
              }}
              disabled={busy}
            >
              <option value="AMOUNT">Hiện giá (đã làm mờ)</option>
              <option value="CONTACT">Liên hệ</option>
            </select>
          </label>
          {priceMode === 'AMOUNT' ? (
            <label>
              Nhãn giá công khai
              <input
                value={priceLabel}
                onChange={(e) => setPriceLabel(e.target.value)}
                placeholder="VD: 3 tỷ xxx"
                maxLength={80}
                disabled={busy}
              />
            </label>
          ) : null}
          <label>
            Mô tả công khai
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={2000}
              disabled={busy}
              rows={5}
            />
          </label>
          {parseError || error ? <p className="crm-form-error">{parseError || error}</p> : null}
          <div className="crm-dialog-actions">
            <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="crm-btn" disabled={busy}>
              {busy ? 'Đang lưu…' : 'Lưu nháp'}
            </button>
            {lot.isPublished ? null : (
              <button
                type="button"
                className="crm-btn primary"
                disabled={busy}
                onClick={() => {
                  const input = parsedInput();
                  if (input) void onPublish(input);
                }}
              >
                Đăng web
              </button>
            )}
          </div>
        </form>
      ) : null}
    </CrmDialog>
  );
}
