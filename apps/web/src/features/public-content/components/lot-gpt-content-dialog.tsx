'use client';

import { Sparkles } from 'lucide-react';
import type { PublicWebStaffLotRow } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { buildLotGptContext } from '../lot-gpt-context';
import '@/shared/ui/dialog.css';

type Props = {
  lot: PublicWebStaffLotRow | null;
  onClose: () => void;
};

/**
 * Preview of lot facts that will be sent to GPT later.
 * No API call in this slice — owner will define response JSON next.
 */
export function LotGptContentDialog({ lot, onClose }: Props) {
  const ctx = lot ? buildLotGptContext(lot) : null;

  return (
    <CrmDialog
      open={Boolean(lot)}
      title="Tạo content bằng AI GPT"
      icon={Sparkles}
      onClose={onClose}
    >
      {ctx ? (
        <>
          <p className="crm-dialog-message">
            Thông tin lô dưới đây sẽ gửi GPT để gợi ý bài đăng (bước gọi API sẽ thêm sau).
          </p>
          <dl className="pw-gpt-facts">
            <div>
              <dt>Tiêu đề</dt>
              <dd>{ctx.title || '—'}</dd>
            </div>
            <div>
              <dt>Địa chỉ công khai</dt>
              <dd>{ctx.location || '—'}</dd>
            </div>
            <div>
              <dt>Phân loại</dt>
              <dd>{ctx.kindLabel}</dd>
            </div>
            <div>
              <dt>Diện tích</dt>
              <dd>{ctx.areaLabel}</dd>
            </div>
            <div>
              <dt>Mặt tiền · Hướng</dt>
              <dd>{ctx.frontageDirectionLabel}</dd>
            </div>
            <div>
              <dt>Giá công khai</dt>
              <dd>{ctx.priceLabel}</dd>
            </div>
            <div>
              <dt>Web</dt>
              <dd>{ctx.isPublished ? 'Đang hiện' : 'Chờ đăng'}</dd>
            </div>
            <div className="pw-gpt-facts-excerpt">
              <dt>Mô tả hiện có</dt>
              <dd>{ctx.excerpt || '—'}</dd>
            </div>
          </dl>
          <div className="crm-dialog-actions">
            <button type="button" className="crm-btn" onClick={onClose}>
              Đóng
            </button>
            <button type="button" className="crm-btn primary" disabled title="Sẽ nối GPT API ở bước sau">
              <Icon icon={Sparkles} size="sm" />
              Gửi GPT
            </button>
          </div>
        </>
      ) : null}
    </CrmDialog>
  );
}
