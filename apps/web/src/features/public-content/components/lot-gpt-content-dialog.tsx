'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  lotGptRequestPayloadSchema,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { generateLotGptContent } from '../api';
import { formatLotGptRequestJson } from '../lot-gpt-context';
import '@/shared/ui/dialog.css';

type Props = {
  lot: PublicWebStaffLotRow | null;
  onClose: () => void;
  onFlash?: (message: string) => void;
};

/**
 * Preview / edit GPT request JSON, send to Nest → OpenAI, show response.
 */
export function LotGptContentDialog({ lot, onClose, onFlash }: Props) {
  const [jsonText, setJsonText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!lot) {
      setJsonText('');
      setResponseText('');
      setParseError(null);
      return;
    }
    setJsonText(formatLotGptRequestJson(lot));
    setResponseText('');
    setParseError(null);
  }, [lot]);

  async function handleSend() {
    setParseError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setParseError('JSON không hợp lệ. Kiểm tra dấu ngoặc và dấu phẩy.');
      return;
    }

    const validated = lotGptRequestPayloadSchema.safeParse(parsed);
    if (!validated.success) {
      setParseError('JSON thiếu hoặc sai trường bắt buộc (title, location, …).');
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
            JSON dưới đây gửi GPT (sửa được). Phản hồi hiện ở ô bên dưới sau khi bấm Gửi.
          </p>
          <label className="pw-gpt-json-label" htmlFor="pw-gpt-json">
            Dữ liệu gửi GPT
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
            </>
          ) : null}
          {parseError ? <p className="crm-dialog-error">{parseError}</p> : null}
          <div className="crm-dialog-actions">
            <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
              Đóng
            </button>
            <button
              type="button"
              className="crm-btn primary"
              disabled={busy}
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
