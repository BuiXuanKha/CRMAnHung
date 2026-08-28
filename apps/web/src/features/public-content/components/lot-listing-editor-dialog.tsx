'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageOff, PenLine } from 'lucide-react';
import {
  listingBodyToExcerpt,
  stripPublicPostHtmlText,
  updatePublicListingDraftSchema,
  type PublicListingPriceMode,
  type PublicWebStaffLotRow,
  type UpdatePublicListingDraftInput,
} from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { CrmDialog } from '@/shared/ui/dialog';
import { plainTextToListingBodyHtml, publicListingInternalsHint } from '../listing-copy';
import { toListingPublicSlug } from '../display';
import type { LotGptEditorPrefill } from '../lot-gpt-apply';
import { PostRichEditor } from './post-rich-editor';
import '@/shared/ui/dialog.css';

type Props = {
  lot: PublicWebStaffLotRow | null;
  /** Prefill from GPT modal — applied when editor opens from «Dùng cho bài đăng». */
  gptPrefill?: LotGptEditorPrefill | null;
  /** Bumps when GPT apply is clicked — remounts rich editor with fresh HTML. */
  gptApplyId?: number;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSaveDraft: (input: UpdatePublicListingDraftInput) => Promise<void>;
  onPublish: (input: UpdatePublicListingDraftInput) => Promise<void>;
};

const TITLE_MAX = 160;
const META_MAX = 320;

function lotBodyHtml(lot: PublicWebStaffLotRow): string {
  if (lot.bodyHtml?.trim()) return lot.bodyHtml;
  return plainTextToListingBodyHtml(lot.excerpt);
}

export function LotListingEditorDialog({
  lot,
  gptPrefill,
  gptApplyId = 0,
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
  const [bodyHtml, setBodyHtml] = useState('');
  const [slugDraft, setSlugDraft] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const lotOpenKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lot) {
      lotOpenKeyRef.current = null;
      setTitle('');
      setLocation('');
      setPriceMode('CONTACT');
      setPriceLabel('');
      setBodyHtml('');
      setSlugDraft('');
      setMetaDescription('');
      setParseError(null);
      return;
    }

    if (gptPrefill) {
      setTitle(gptPrefill.title.trim() || lot.title);
      setLocation(lot.location);
      setPriceMode(lot.priceMode);
      setPriceLabel(lot.priceMode === 'AMOUNT' ? (lot.priceLabel ?? '') : '');
      setBodyHtml(gptPrefill.bodyHtml);
      setSlugDraft(
        gptPrefill.slug.trim() ||
          (!lot.id.startsWith('pending-') && lot.slug ? lot.slug : ''),
      );
      setMetaDescription(gptPrefill.metaDescription.trim() || lot.metaDescription?.trim() || '');
      setParseError(null);
    } else {
      const openKey = lot.lodatId;
      if (lotOpenKeyRef.current !== openKey) {
        lotOpenKeyRef.current = openKey;
        setTitle(lot.title);
        setLocation(lot.location);
        setPriceMode(lot.priceMode);
        setPriceLabel(lot.priceMode === 'AMOUNT' ? (lot.priceLabel ?? '') : '');
        setBodyHtml(lotBodyHtml(lot));
        setSlugDraft(!lot.id.startsWith('pending-') && lot.slug ? lot.slug : '');
        setMetaDescription(lot.metaDescription?.trim() || '');
        setParseError(null);
      }
    }

    const t = window.setTimeout(() => titleRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [lot, gptPrefill, gptApplyId]);

  function parsedInput(requireBody: boolean): UpdatePublicListingDraftInput | null {
    const slug = slugDraft.trim();
    const meta = metaDescription.trim();
    const parsed = updatePublicListingDraftSchema.safeParse({
      title,
      location,
      priceMode,
      priceLabel: priceMode === 'AMOUNT' ? priceLabel.trim() || null : null,
      bodyHtml,
      ...(slug ? { slug } : {}),
      metaDescription: meta || null,
    });
    if (!parsed.success) {
      setParseError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');
      return null;
    }
    if (requireBody && !stripPublicPostHtmlText(bodyHtml)) {
      setParseError('Nhập mô tả công khai trước khi đăng web');
      return null;
    }
    setParseError(null);
    return parsed.data;
  }

  const excerptPreview = listingBodyToExcerpt(bodyHtml);
  const slugPreview =
    slugDraft.trim() ||
    (lot && !lot.id.startsWith('pending-') && lot.slug
      ? lot.slug
      : toListingPublicSlug(title.trim() || 'lo-dat', location));

  return (
    <CrmDialog
      open={Boolean(lot)}
      title="Soạn bài đăng"
      icon={PenLine}
      onClose={onClose}
      busy={busy}
      className="crm-dialog--wide crm-dialog--compose"
    >
      {lot ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = parsedInput(false);
            if (input) void onSaveDraft(input);
          }}
        >
          {gptPrefill ? (
            <p className="crm-form-hint pw-editor-gpt-hint">
              Đã điền từ GPT — kiểm tra tiêu đề, slug và mô tả trước khi lưu.
            </p>
          ) : null}
          <p className="crm-form-hint">
            Copy công khai cho trang khách — không copy hoa hồng, ghi chú chủ nhà hay thông tin khách.
            Lưu nháp được thiếu mô tả; <strong>Đăng web</strong> cần nội dung.
          </p>
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
            <span className="crm-field-head">
              <span>
                Tiêu đề công khai <span className="crm-req" aria-hidden>*</span>
              </span>
              <span className="crm-field-meta" aria-live="polite">
                {title.length}/{TITLE_MAX}
              </span>
            </span>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: LK5 - 37 mặt sông"
              maxLength={TITLE_MAX}
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
            <span className="crm-field-head">
              <span>Đường dẫn (slug)</span>
            </span>
            <input
              value={slugDraft}
              onChange={(e) => setSlugDraft(e.target.value)}
              placeholder="ban-lo-33-dau-gia-man-de"
              maxLength={200}
              disabled={busy}
            />
          </label>
          <p className="crm-slug-preview">
            <span className="crm-slug-preview__label">Xem trước URL</span>
            <code className="crm-slug-preview__path">/mua-ban-nha-dat/{slugPreview}</code>
          </p>

          <label>
            <span className="crm-field-head">
              <span>Meta description (SEO)</span>
              <span className="crm-field-meta" aria-live="polite">
                {metaDescription.length}/{META_MAX}
              </span>
            </span>
            <textarea
              className="pw-gpt-extra"
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Tóm tắt ~140–160 ký tự cho Google…"
              maxLength={META_MAX}
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

          <div className="pw-compose-body-field">
            <span className="crm-field-head">
              <span>
                Mô tả công khai{' '}
                <span className="crm-field-meta">(bắt buộc khi đăng web · ảnh từ lô hoặc upload)</span>
              </span>
            </span>
            <PostRichEditor
              key={
                gptPrefill
                  ? `gpt-${lot.lodatId}-${gptApplyId}`
                  : `lot-${lot.lodatId}`
              }
              value={bodyHtml}
              disabled={busy}
              onChange={setBodyHtml}
              placeholder="Mô tả lô cho khách… Có thể đậm/nghiêng, tiêu đề phụ, danh sách và chèn ảnh."
              ariaLabel="Mô tả công khai lô đất"
              toolbarAriaLabel="Định dạng mô tả bài đăng"
            />
            {excerptPreview ? (
              <p className="crm-form-hint">
                Tóm tắt SEO (~{excerptPreview.length} ký tự): {excerptPreview.slice(0, 120)}
                {excerptPreview.length > 120 ? '…' : ''}
              </p>
            ) : null}
          </div>

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
                  const input = parsedInput(true);
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
