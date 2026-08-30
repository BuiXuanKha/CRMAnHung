'use client';

import { useEffect, useState } from 'react';
import { PenLine, Sparkles } from 'lucide-react';
import {
  POST_GPT_SYSTEM_PROMPT,
  postGptRequestPayloadSchema,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { generatePostGptContent } from '../api';
import {
  formatPostGptRequestJson,
  parsePostGptContentResult,
  postGptToComposePrefill,
} from '../post-gpt-apply';
import type { ComposePostPrefill } from './compose-post-dialog';
import '@/shared/ui/dialog.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onFlash?: (message: string) => void;
  onApplyToCompose?: (prefill: ComposePostPrefill) => void;
};

/**
 * Enter a project name → Nest → OpenAI → JSON SEO → prefill compose (Dự án).
 */
export function PostGptContentDialog({
  open,
  onClose,
  onFlash,
  onApplyToCompose,
}: Props) {
  const [projectName, setProjectName] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSend = projectName.trim().length > 0 && !busy;

  useEffect(() => {
    if (!open) {
      setProjectName('');
      setExtraNotes('');
      setJsonText('');
      setResponseText('');
      setParseError(null);
      return;
    }
    setJsonText(formatPostGptRequestJson(''));
    setResponseText('');
    setParseError(null);
  }, [open]);

  function syncJson(name: string, notes: string) {
    setJsonText(formatPostGptRequestJson(name, notes));
  }

  const gptResult = responseText ? parsePostGptContentResult(responseText) : null;

  function handleApply() {
    if (!gptResult || !onApplyToCompose) return;
    onApplyToCompose(postGptToComposePrefill(gptResult));
  }

  async function handleSend() {
    setParseError(null);
    const name = projectName.trim();
    if (!name) {
      setParseError('Nhập tên dự án để GPT viết bài.');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setParseError('JSON không hợp lệ. Kiểm tra dấu ngoặc và dấu phẩy.');
      return;
    }

    const merged =
      parsed && typeof parsed === 'object'
        ? {
            ...(parsed as Record<string, unknown>),
            projectName: name,
            ...(extraNotes.trim() ? { extraNotes: extraNotes.trim() } : {}),
          }
        : parsed;

    const validated = postGptRequestPayloadSchema.safeParse(merged);
    if (!validated.success) {
      setParseError(validated.error.issues[0]?.message ?? 'JSON thiếu hoặc sai trường.');
      return;
    }

    setBusy(true);
    try {
      const res = await generatePostGptContent(validated.data);
      setResponseText(res.content);
      onFlash?.('Đã nhận phản hồi GPT.');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Gửi GPT thất bại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CrmDialog
      open={open}
      title="Soạn bài bằng GPT AI"
      icon={Sparkles}
      onClose={onClose}
      busy={busy}
      className="crm-dialog--wide crm-dialog--gpt"
    >
      {open ? (
        <>
          <p className="crm-dialog-message">
            Nhập <strong>tên dự án</strong>. GPT viết bài chuyên mục <strong>Dự án</strong> từ
            thông tin công khai — bạn đọc lại trước khi xuất bản. Ảnh bìa tự chọn sau.
          </p>
          <label className="pw-gpt-json-label" htmlFor="pw-post-gpt-name">
            Tên dự án <span className="pw-gpt-required">*</span>
          </label>
          <input
            id="pw-post-gpt-name"
            className="pw-gpt-project"
            type="text"
            maxLength={160}
            required
            placeholder="VD: Khu đô thị Tây Nam Sách"
            value={projectName}
            disabled={busy}
            autoComplete="off"
            onChange={(e) => {
              const next = e.target.value;
              setProjectName(next);
              setParseError(null);
              syncJson(next, extraNotes);
            }}
            aria-label="Tên dự án gửi GPT"
            aria-required="true"
          />
          <label className="pw-gpt-json-label" htmlFor="pw-post-gpt-notes">
            Ghi chú thêm <span className="pw-gpt-optional">(tuỳ chọn)</span>
          </label>
          <textarea
            id="pw-post-gpt-notes"
            className="pw-gpt-extra"
            rows={3}
            placeholder="VD: 40 ha, thị trấn Nam Sách, chủ đầu tư…"
            value={extraNotes}
            disabled={busy}
            onChange={(e) => {
              const next = e.target.value;
              setExtraNotes(next);
              syncJson(projectName, next);
            }}
            aria-label="Ghi chú thêm gửi GPT"
          />
          <label className="pw-gpt-json-label" htmlFor="pw-post-gpt-system">
            Prompt hệ thống gửi GPT API (system)
          </label>
          <textarea
            id="pw-post-gpt-system"
            className="pw-gpt-json pw-gpt-prompt"
            spellCheck={false}
            rows={10}
            readOnly
            value={POST_GPT_SYSTEM_PROMPT}
            aria-label="System prompt gửi GPT API"
          />
          <label className="pw-gpt-json-label" htmlFor="pw-post-gpt-json">
            Dữ liệu gửi GPT (JSON — user message)
          </label>
          <textarea
            id="pw-post-gpt-json"
            className="pw-gpt-json"
            spellCheck={false}
            rows={10}
            value={jsonText}
            disabled={busy}
            onChange={(e) => setJsonText(e.target.value)}
            aria-label="JSON gửi GPT"
          />
          {responseText ? (
            <>
              <label className="pw-gpt-json-label" htmlFor="pw-post-gpt-response">
                Phản hồi GPT
              </label>
              <textarea
                id="pw-post-gpt-response"
                className="pw-gpt-json pw-gpt-json-response"
                spellCheck={false}
                rows={12}
                readOnly
                value={responseText}
                aria-label="Phản hồi GPT"
              />
            </>
          ) : null}
          {parseError ? <p className="crm-dialog-error">{parseError}</p> : null}
          <div className="crm-dialog-actions">
            <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
              Đóng
            </button>
            {gptResult && onApplyToCompose ? (
              <button type="button" className="crm-btn" disabled={busy} onClick={handleApply}>
                <Icon icon={PenLine} size="sm" />
                Dùng cho bài soạn
              </button>
            ) : null}
            <button
              type="button"
              className="crm-btn primary"
              disabled={!canSend}
              title={canSend ? undefined : 'Nhập tên dự án trước khi gửi'}
              onClick={() => void handleSend()}
            >
              <Icon icon={Sparkles} size="sm" />
              {busy ? 'Đang gửi…' : 'Gửi'}
            </button>
          </div>
        </>
      ) : null}
    </CrmDialog>
  );
}
