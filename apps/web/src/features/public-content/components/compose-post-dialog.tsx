'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import {
  PUBLIC_POST_CATEGORY_LABELS,
  PublicPostCategory,
  PublicPostStatus,
  createPublicPostInputSchema,
  type CreatePublicPostInput,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';

type Props = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: CreatePublicPostInput) => Promise<void>;
};

const CATEGORIES = Object.values(PublicPostCategory);

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

  function submit(status: PublicPostStatus) {
    const parsed = createPublicPostInputSchema.safeParse({ title, category, status });
    if (!parsed.success) {
      setParseError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');
      return;
    }
    setParseError(null);
    void onSubmit(parsed.data);
  }

  return (
    <CrmDialog open={open} title="Soạn bài viết" icon={FileText} onClose={onClose} busy={busy}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(PublicPostStatus.DRAFT);
        }}
      >
        <p className="crm-form-hint">Nội dung dài (mô tả) làm slice sau. Mock này lưu tiêu đề và chuyên mục.</p>
        <label>
          Tiêu đề
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Tiến độ hạ tầng Long Thành quý 3"
            maxLength={160}
            disabled={busy}
            required
          />
        </label>
        <label>
          Chuyên mục
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PublicPostCategory)}
            disabled={busy}
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {PUBLIC_POST_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
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
