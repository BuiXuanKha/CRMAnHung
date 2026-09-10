'use client';

import {
  LodatSaleStatus,
  type LodatListingStatus,
} from '@crmanhung/shared';
import './sale-status-cell.css';

const TRIAD = [
  {
    status: LodatSaleStatus.DANG_BAN,
    label: 'Mở bán',
    tone: 'open' as const,
  },
  {
    status: LodatSaleStatus.TAM_DUNG,
    label: 'Dừng bán',
    tone: 'paused' as const,
  },
  {
    status: LodatSaleStatus.KHONG_BAN,
    label: 'Không bán',
    tone: 'off' as const,
  },
] as const;

type Props = {
  title: string;
  /** Trạng thái đích của ô này. */
  target: (typeof TRIAD)[number]['status'];
  current: LodatListingStatus | string;
  busy?: boolean;
  onSelect: (next: (typeof TRIAD)[number]['status']) => void;
};

/** Một công tắc trong 3 cột — chỉ bật khi `current === target`; click khi đã bật = no-op. */
export function SaleStatusCell({
  title,
  target,
  current,
  busy = false,
  onSelect,
}: Props) {
  const meta = TRIAD.find((t) => t.status === target) ?? TRIAD[0];
  const on = current === target;

  return (
    <div
      className="ld-sale-status-cell"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        role="switch"
        className={[
          'ld-sale-status-switch',
          `is-${meta.tone}`,
          on ? 'is-on' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-checked={on}
        aria-label={
          on
            ? `${meta.label} «${title}» (đang chọn)`
            : `Chọn ${meta.label} cho «${title}»`
        }
        disabled={busy}
        onClick={() => {
          if (busy || on) return;
          onSelect(target);
        }}
      >
        <span className="ld-sale-status-knob" />
      </button>
    </div>
  );
}

export const SALE_STATUS_TRIAD_COLUMNS = TRIAD;
