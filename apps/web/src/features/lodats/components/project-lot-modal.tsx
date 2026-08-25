'use client';

import { useMemo, useState } from 'react';
import { Map } from 'lucide-react';
import type { AddressListItem, ProjectLotOption } from '@crmanhung/shared';
import { formatAddressLabel } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import './project-lot-modal.css';

type Props = {
  open: boolean;
  address: AddressListItem | null;
  lots: ProjectLotOption[];
  loading: boolean;
  /** Chọn một lô kho → điền vào form tạo */
  onPick: (lot: ProjectLotOption) => void;
  /** Huỷ chọn dự án — bỏ luôn địa chỉ dự án trên form */
  onCancelProject: () => void;
  /** Đóng modal, giữ dự án (chọn lô sau) */
  onClose: () => void;
};

/** Modal «Chọn lô đất trong dự án» — theo CRM cũ (lodats.md §12.5). */
export function ProjectLotModal({
  open,
  address,
  lots,
  loading,
  onPick,
  onCancelProject,
  onClose,
}: Props) {
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return lots;
    return lots.filter((lot) => lot.title.toLowerCase().includes(q));
  }, [lots, keyword]);

  if (!address) return null;

  return (
    <CrmDialog
      open={open}
      title="Chọn lô đất trong dự án"
      icon={Map}
      onClose={onClose}
      className="crm-dialog--wide ld-lot-modal"
    >
      <p className="ld-lot-modal-lead">
        Dự án: <strong>{formatAddressLabel(address)}</strong>. Bạn{' '}
        <strong>phải chọn một lô</strong> trong danh sách bên dưới — thông tin lô đó
        sẽ được điền vào form thêm mới.
      </p>

      <label className="ld-lot-modal-search">
        <span>Tìm kiếm</span>
        <input
          placeholder="Tìm theo tiêu đề lô…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </label>

      <div className="ld-lot-modal-list-head">
        Danh sách lô đất <span>({lots.length})</span>
      </div>

      {loading ? (
        <p className="ld-lot-modal-state">Đang tải kho lô…</p>
      ) : filtered.length === 0 ? (
        <p className="ld-lot-modal-state">
          {lots.length === 0
            ? 'Dự án này chưa có lô trong kho. Liên hệ Admin import kho.'
            : 'Không có lô khớp từ khoá.'}
        </p>
      ) : (
        <ul className="ld-lot-modal-list">
          {filtered.map((lot) => {
            const specs = [
              lot.areaM2 != null ? `${lot.areaM2.toLocaleString('vi-VN')} m²` : null,
              lot.frontageM != null
                ? `${lot.frontageM.toLocaleString('vi-VN')} m`
                : null,
              lot.direction || null,
              lot.note?.trim() || null,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <li key={lot.id}>
                <button
                  type="button"
                  className="ld-lot-modal-item"
                  disabled={lot.takenByMe}
                  onClick={() => onPick(lot)}
                >
                  {address.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={address.coverImageUrl} alt="" className="ld-lot-modal-thumb" />
                  ) : (
                    <span className="ld-lot-modal-thumb empty" aria-hidden />
                  )}
                  <span
                    className={
                      lot.takenByMe
                        ? 'ld-lot-modal-badge taken'
                        : 'ld-lot-modal-badge'
                    }
                  >
                    {lot.takenByMe ? 'Bạn đang giữ' : 'Chọn được'}
                  </span>
                  <span className="ld-lot-modal-text">
                    <strong>{lot.title}</strong>
                    {specs ? <span className="sub">{specs}</span> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="crm-dialog-actions">
        <button type="button" className="crm-btn" onClick={onCancelProject}>
          Huỷ chọn dự án
        </button>
      </div>
    </CrmDialog>
  );
}
