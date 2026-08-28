'use client';

import { useEffect, useState } from 'react';
import { Sparkles, PenLine, Share2 } from 'lucide-react';
import {
  lotGptRequestPayloadSchema,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { copySharePayload, openFacebookForPaste, shareToFacebook } from '@/features/public/share';
import { generateLotGptContent } from '../api';
import { formatLotGptRequestJson } from '../lot-gpt-context';
import {
  lotGptSharePageUrl,
  lotGptToEditorPrefill,
  parseLotGptContentResult,
} from '../lot-gpt-apply';
import type { LotGptEditorPrefill } from '../lot-gpt-apply';
import '@/shared/ui/dialog.css';

type Props = {
  lot: PublicWebStaffLotRow | null;
  onClose: () => void;
  onFlash?: (message: string) => void;
  onApplyToEditor?: (prefill: LotGptEditorPrefill) => void;
};

/**
 * Preview / edit GPT request JSON, send to Nest → OpenAI, show response.
 */
export function LotGptContentDialog({ lot, onClose, onFlash, onApplyToEditor }: Props) {
  const [extraDescription, setExtraDescription] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle');

  const canSend = extraDescription.trim().length > 0 && !busy;

  useEffect(() => {
    if (!lot) {
      setExtraDescription('');
      setJsonText('');
      setResponseText('');
      setParseError(null);
      setShareStatus('idle');
      return;
    }
    setExtraDescription('');
    setJsonText(formatLotGptRequestJson(lot));
    setResponseText('');
    setParseError(null);
    setShareStatus('idle');
  }, [lot]);

  function onExtraDescriptionChange(value: string) {
    setExtraDescription(value);
    setParseError(null);
    if (lot) setJsonText(formatLotGptRequestJson(lot, value));
  }

  const gptResult = responseText ? parseLotGptContentResult(responseText) : null;
  const facebookPost = gptResult?.facebookPost.trim() ?? '';

  function handleApplyToEditor() {
    if (!gptResult || !onApplyToEditor) return;
    onApplyToEditor(lotGptToEditorPrefill(gptResult));
  }

  async function handleShareFacebook() {
    if (!gptResult || !lot || !facebookPost) return;
    const pageUrl = lotGptSharePageUrl(gptResult, lot);
    try {
      if (pageUrl) {
        await shareToFacebook(pageUrl, facebookPost);
        setShareStatus('shared');
        onFlash?.('Đã copy — dán vào Facebook');
      } else {
        await navigator.clipboard.writeText(facebookPost);
        openFacebookForPaste(facebookPost);
        setShareStatus('copied');
        onFlash?.('Đã copy bài Facebook (chưa có slug — chưa kèm link)');
      }
      window.setTimeout(() => setShareStatus('idle'), 3200);
    } catch {
      try {
        if (pageUrl) {
          await copySharePayload(pageUrl, facebookPost);
        } else {
          await navigator.clipboard.writeText(facebookPost);
        }
        setShareStatus('copied');
        onFlash?.('Đã copy nội dung — mở Facebook và dán');
        window.setTimeout(() => setShareStatus('idle'), 3200);
      } catch {
        setParseError('Không copy được — thử chọn và copy thủ công.');
      }
    }
  }

  async function handleSend() {
    setParseError(null);
    const extra = extraDescription.trim();
    if (!extra) {
      setParseError('Nhập mô tả thêm để GPT viết bài sinh động hơn.');
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
        ? { ...(parsed as Record<string, unknown>), extraDescription: extra }
        : parsed;

    const validated = lotGptRequestPayloadSchema.safeParse(merged);
    if (!validated.success) {
      const msg = validated.error.issues[0]?.message;
      setParseError(msg ?? 'JSON thiếu hoặc sai trường bắt buộc.');
      return;
    }

    setBusy(true);
    try {
      const res = await generateLotGptContent(validated.data);
      setResponseText(res.content);
      onFlash?.('Đã nhận phản hồi GPT.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gửi GPT thất bại.';
      setParseError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <CrmDialog
      open={Boolean(lot)}
      title="Tạo content bằng AI GPT"
      icon={Sparkles}
      onClose={onClose}
      busy={busy}
      className="crm-dialog--wide"
    >
      {lot ? (
        <>
          <p className="crm-dialog-message">
            Nhập <strong>mô tả thêm</strong> (bắt buộc) — điểm nổi bật thực địa để GPT viết bài
            sinh động. JSON bên dưới tự cập nhật.
          </p>
          <label className="pw-gpt-json-label" htmlFor="pw-gpt-extra">
            Mô tả thêm <span className="pw-gpt-required">*</span>
          </label>
          <textarea
            id="pw-gpt-extra"
            className="pw-gpt-extra"
            rows={4}
            required
            placeholder="VD: Lô góc, sát mẫu giáo, vỉa hè 3m, đèn cao áp, khu dân cư mở rộng…"
            value={extraDescription}
            disabled={busy}
            onChange={(e) => onExtraDescriptionChange(e.target.value)}
            aria-label="Mô tả thêm gửi GPT"
            aria-required="true"
          />
          <label className="pw-gpt-json-label" htmlFor="pw-gpt-json">
            Dữ liệu gửi GPT (JSON)
          </label>
          <textarea
            id="pw-gpt-json"
            className="pw-gpt-json"
            spellCheck={false}
            rows={12}
            value={jsonText}
            disabled={busy}
            onChange={(e) => setJsonText(e.target.value)}
            aria-label="JSON gửi GPT"
          />
          {responseText ? (
            <>
              <label className="pw-gpt-json-label" htmlFor="pw-gpt-response">
                Phản hồi GPT
              </label>
              <textarea
                id="pw-gpt-response"
                className="pw-gpt-json pw-gpt-json-response"
                spellCheck={false}
                rows={12}
                readOnly
                value={responseText}
                aria-label="Phản hồi GPT"
              />
              {facebookPost ? (
                <>
                  <label className="pw-gpt-json-label" htmlFor="pw-gpt-facebook">
                    Bài Facebook
                  </label>
                  <textarea
                    id="pw-gpt-facebook"
                    className="pw-gpt-json pw-gpt-json-facebook"
                    spellCheck={false}
                    rows={6}
                    readOnly
                    value={facebookPost}
                    aria-label="Bài Facebook từ GPT"
                  />
                </>
              ) : null}
            </>
          ) : null}
          {parseError ? <p className="crm-dialog-error">{parseError}</p> : null}
          <div className="crm-dialog-actions">
            <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
              Đóng
            </button>
            {gptResult && onApplyToEditor ? (
              <button
                type="button"
                className="crm-btn"
                disabled={busy}
                onClick={handleApplyToEditor}
              >
                <Icon icon={PenLine} size="sm" />
                Dùng cho bài đăng
              </button>
            ) : null}
            {facebookPost ? (
              <button
                type="button"
                className="crm-btn"
                disabled={busy}
                title="Copy bài Facebook + link lô và mở Facebook để dán"
                onClick={() => void handleShareFacebook()}
              >
                <Icon icon={Share2} size="sm" />
                {shareStatus === 'shared'
                  ? 'Đã copy — dán vào FB'
                  : shareStatus === 'copied'
                    ? 'Đã copy nội dung'
                    : 'Chia sẻ Facebook'}
              </button>
            ) : null}
            <button
              type="button"
              className="crm-btn primary"
              disabled={!canSend}
              title={canSend ? undefined : 'Nhập mô tả thêm trước khi gửi'}
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
