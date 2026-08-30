'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, PenLine, Trash2 } from 'lucide-react';
import {
  PUBLIC_POST_CATEGORY_LABELS,
  PublicPostCategory,
  PublicPostStatus,
  createPublicPostInputSchema,
  type CreatePublicPostInput,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { toPublicSlug } from '../display';
import { uploadPublicPostImage } from '../upload-image';
import { PostRichEditor } from './post-rich-editor';
import '@/shared/ui/dialog.css';

export type ComposePostPrefill = {
  title: string;
  category: PublicPostCategory;
  bodyHtml: string;
  excerpt?: string;
  metaDescription?: string;
  slug?: string;
};

type Props = {
  open: boolean;
  busy: boolean;
  error: string | null;
  prefill?: ComposePostPrefill | null;
  onClose: () => void;
  onSubmit: (input: CreatePublicPostInput) => Promise<void>;
};

const CATEGORIES = Object.values(PublicPostCategory);
const TITLE_MAX = 160;

export function ComposePostDialog({
  open,
  busy,
  error,
  prefill,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PublicPostCategory>(PublicPostCategory.TIN_TUC);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [bodyHtml, setBodyHtml] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(prefill?.title.trim() ?? '');
    setCategory(prefill?.category ?? PublicPostCategory.TIN_TUC);
    setCoverImageUrl(null);
    setBodyHtml(prefill?.bodyHtml ?? '');
    setExcerpt(prefill?.excerpt?.trim() ?? '');
    setMetaDescription(prefill?.metaDescription?.trim() ?? '');
    setSlug(prefill?.slug?.trim() ?? '');
    setParseError(null);
    setUploadError(null);
    const t = window.setTimeout(() => titleRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, prefill]);

  const slugPreview = slug.trim() || toPublicSlug(title.trim() || 'tieu-de-bai-viet');
  const formBusy = busy || coverBusy;

  function submit(status: PublicPostStatus) {
    const parsed = createPublicPostInputSchema.safeParse({
      title,
      category,
      status,
      coverImageUrl,
      bodyHtml,
      ...(excerpt.trim() ? { excerpt: excerpt.trim() } : {}),
      ...(metaDescription.trim() ? { metaDescription: metaDescription.trim() } : {}),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
    });
    if (!parsed.success) {
      setParseError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.');
      titleRef.current?.focus();
      return;
    }
    setParseError(null);
    void onSubmit(parsed.data);
  }

  async function onPickCover(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setCoverBusy(true);
    try {
      const url = await uploadPublicPostImage(file);
      setCoverImageUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Không tải được ảnh bìa.');
    } finally {
      setCoverBusy(false);
    }
  }

  return (
    <CrmDialog
      open={open}
      title="Soạn bài viết"
      icon={PenLine}
      onClose={onClose}
      busy={formBusy}
      className="crm-dialog--wide crm-dialog--compose"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(PublicPostStatus.DRAFT);
        }}
      >
        <p className="crm-form-hint">
          {prefill
            ? 'Đã điền từ GPT (chuyên mục Dự án). Đọc lại, thêm ảnh bìa rồi Lưu nháp / Xuất bản.'
            : 'Bài hiện trên anhungland.com theo chuyên mục. Lưu nháp chỉ admin thấy; Xuất bản cần ảnh bìa và nội dung — khách đọc được ngay.'}
        </p>

        <label>
          <span className="crm-field-head">
            <span>
              Tiêu đề <span className="crm-req" aria-hidden>*</span>
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
            disabled={formBusy}
            required
            autoComplete="off"
          />
        </label>

        <p className="crm-slug-preview">
          <span className="crm-slug-preview__label">Đường dẫn dự kiến</span>
          <code className="crm-slug-preview__path">/{category}/{slugPreview}</code>
        </p>

        <fieldset className="pw-compose-categories" disabled={formBusy}>
          <legend>
            Chuyên mục <span className="crm-req" aria-hidden>*</span>
          </legend>
          <div className="pw-compose-category-chips" role="radiogroup" aria-label="Chuyên mục">
            {CATEGORIES.map((value) => {
              const active = category === value;
              return (
                <label
                  key={value}
                  className={active ? 'pw-compose-chip is-active' : 'pw-compose-chip'}
                >
                  <input
                    type="radio"
                    name="public-post-category"
                    value={value}
                    checked={active}
                    onChange={() => setCategory(value)}
                    disabled={formBusy}
                  />
                  {PUBLIC_POST_CATEGORY_LABELS[value]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="pw-compose-cover">
          <div className="crm-field-head">
            <span>
              Ảnh bìa <span className="crm-field-meta">(bắt buộc khi xuất bản)</span>
            </span>
          </div>
          <div className="pw-compose-cover-row">
            <div className="pw-compose-cover-preview">
              {coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImageUrl} alt="" />
              ) : (
                <span className="pw-compose-cover-empty">Chưa chọn ảnh</span>
              )}
            </div>
            <div className="pw-compose-cover-actions">
              <button
                type="button"
                className="crm-btn"
                disabled={formBusy}
                onClick={() => coverInputRef.current?.click()}
              >
                <Icon icon={ImagePlus} size="sm" /> Chọn ảnh
              </button>
              {coverImageUrl ? (
                <button
                  type="button"
                  className="crm-btn"
                  disabled={formBusy}
                  onClick={() => setCoverImageUrl(null)}
                >
                  <Icon icon={Trash2} size="sm" /> Gỡ ảnh
                </button>
              ) : null}
              <p className="crm-form-hint">
                Chọn JPG / PNG / WEBP — lưu lên bài luôn WebP · tối đa 5 MB · tỷ lệ ~16:9
              </p>
            </div>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              void onPickCover(file);
            }}
          />
        </div>

        <div className="pw-compose-body-field">
          <span className="crm-field-head">
            <span>
              Nội dung <span className="crm-field-meta">(bắt buộc khi xuất bản)</span>
            </span>
          </span>
          <PostRichEditor value={bodyHtml} disabled={formBusy} onChange={setBodyHtml} />
        </div>

        {parseError || error || uploadError ? (
          <p className="crm-form-error">{parseError || error || uploadError}</p>
        ) : null}

        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" disabled={formBusy} onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="crm-btn" disabled={formBusy}>
            {busy ? 'Đang lưu…' : 'Lưu nháp'}
          </button>
          <button
            type="button"
            className="crm-btn primary"
            disabled={formBusy}
            onClick={() => submit(PublicPostStatus.PUBLISHED)}
          >
            Xuất bản
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
