'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { PublicWebStaffLotRow } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { formatLotGptRequestJson } from '../lot-gpt-context';
import '@/shared/ui/dialog.css';

type Props = {
  lot: PublicWebStaffLotRow | null;
  onClose: () => void;
};

/**
 * Preview / edit GPT request JSON before send.
 * No API call yet — Gửi stays disabled until endpoint + response schema exist.
 */
export function LotGptContentDialog({ lot, onClose }: Props) {
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    if (!lot) {
      setJsonText('');
      return;
    }
    setJsonText(formatLotGptRequestJson(lot));
  }, [lot]);

  return (
    <CrmDialog
      open={Boolean(lot)}
      title="Tạo content bằng AI GPT"
      icon={Sparkles}
      onClose={onClose}
      className="crm-dialog--wide"
    >
      {lot ? (
        <>
          <p className="crm-dialog-message">
            JSON dưới đây sẽ gửi GPT (sửa được nếu cần). Nút Gửi nối API ở bước sau.
          </p>
          <label className="pw-gpt-json-label" htmlFor="pw-gpt-json">
            Dữ liệu gửi GPT
          </label>
          <textarea
            id="pw-gpt-json"
            className="pw-gpt-json"
            spellCheck={false}
            rows={16}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            aria-label="JSON gửi GPT"
          />
          <div className="crm-dialog-actions">
            <button type="button" className="crm-btn" onClick={onClose}>
              Đóng
            </button>
            <button
              type="button"
              className="crm-btn primary"
              disabled
              title="Sẽ nối GPT API ở bước sau"
            >
              <Icon icon={Sparkles} size="sm" />
              Gửi
            </button>
          </div>
        </>
      ) : null}
    </CrmDialog>
  );
}
