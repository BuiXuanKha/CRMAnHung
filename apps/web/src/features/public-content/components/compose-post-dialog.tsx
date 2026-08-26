'use client';

import { useEffect, useRef, useState } from 'react';
import { PenLine } from 'lucide-react';
import {
  PUBLIC_POST_CATEGORY_LABELS,
  PublicPostCategory,
  PublicPostStatus,
  createPublicPostInputSchema,
  type CreatePublicPostInput,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { toPublicSlug } from '../display';
import '@/shared/ui/dialog.css';

type Props = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: CreatePublicPostInput) => Promise<void>;
};

const CATEGORIES = Object.values(PublicPostCategory);
const TITLE_MAX = 160;

export function ComposePostDialog({ open, busy, error, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PublicPostCategory>(PublicPostCategory.TIN_TUC);
  const [parseError, setParseError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setCategory(PublicPostCategory.TIN_TUC);
    setParseError(null);
    const t = window.setTimeout(() => titleRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  const slugPreview = toPublicSlug(title.trim() || 'tieu-de-bai-viet');

  function submit(status: PublicPostStatus) {
    const parsed = createPublicPostInputSchema.safeParse({ title, category, status });
    if (!parsed.success) {
      setParseError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');
      titleRef.current?.focus();
      return;
    }
    setParseError(null);
    void onSubmit(parsed.data);
  }

  return (
    <CrmDialog
      open={open}
      title="Soạn bài viết"
      icon={PenLine}
      onClose={onClose}
      busy={busy}
      className="crm-dialog--compose"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(PublicPostStatus.DRAFT);
        }}
      >
        <p className="crm-form-hint">
          Bài sẽ hiện trên anhungland.com theo chuyên mục. Lưu nháp chỉ admin thấy; Xuất bản thì khách
          đọc được ngay. Nội dung chi tiết bổ sung ở bước sau.
        </p>

        <label>
          <span className="crm-field-head">
            <span>
              Tiêu đề <span className="crm-req" aria-hidden>
                *
              </span>
            </span>
            <span className="crm-field-meta" aria-live="polite">
              {title.length}/{TITLE_MAX}
            </span>
          </span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Tiến độ hạ tầng Long Thành quý 3"
            maxLength={TITLE_MAX}
            disabled={busy}
            required
            autoComplete="off"
          />
        </label>

        <p className="crm-slug-preview">
          <span className="crm-slug-preview__label">Đường dẫn dự kiến</span>
          <code className="crm-slug-preview__path">/{category}/{slugPreview}</code>
        </p>

        <fieldset className="pw-pick-list pw-compose-categories" disabled={busy}>
          <legend>
            Chuyên mục <span className="crm-req" aria-hidden>*</span>
          </legend>
          {CATEGORIES.map((value) => (
            <label key={value} className="pw-pick-item">
              <input
                type="radio"
                name="public-post-category"
                value={value}
                checked={category === value}
                onChange={() => setCategory(value)}
                disabled={busy}
              />
              <span>
                <strong>{PUBLIC_POST_CATEGORY_LABELS[value]}</strong>
              </span>
            </label>
          ))}
        </fieldset>

        {parseError || error ? <p className="crm-form-error">{parseError || error}</p> : null}

        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="crm-btn" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu nháp'}
          </button>
          <button
            type="button"
            className="crm-btn primary"
            disabled={busy}
            onClick={() => submit(PublicPostStatus.PUBLISHED)}
          >
            Xuất bản
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
