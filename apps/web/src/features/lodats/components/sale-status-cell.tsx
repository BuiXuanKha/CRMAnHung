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

/**
 * Một công tắc trong 3 cột — đúng một cột ON.
 * - Bấm cột đang tắt → chọn status đó.
 * - Tắt Mở bán (đang ON) → Dừng bán; tắt Dừng bán → Mở bán.
 * - Tắt Không bán → no-op (ra bằng cột kia).
 */
export function SaleStatusCell({
  title,
  target,
  current,
  busy = false,
  onSelect,
}: Props) {
  const meta = TRIAD.find((t) => t.status === target) ?? TRIAD[0];
  const on = current === target;

  function resolveNext(): (typeof TRIAD)[number]['status'] | null {
    if (!on) return target;
    // Tắt cột đang bật: chỉ cặp Mở bán ↔ Dừng bán
    if (target === LodatSaleStatus.DANG_BAN) return LodatSaleStatus.TAM_DUNG;
    if (target === LodatSaleStatus.TAM_DUNG) return LodatSaleStatus.DANG_BAN;
    return null; // Không bán đang ON — giữ nguyên
  }

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
            ? target === LodatSaleStatus.DANG_BAN
              ? `Tắt Mở bán «${title}» → Dừng bán`
              : target === LodatSaleStatus.TAM_DUNG
                ? `Tắt Dừng bán «${title}» → Mở bán`
                : `${meta.label} «${title}» (đang chọn)`
            : `Chọn ${meta.label} cho «${title}»`
        }
        disabled={busy}
        onClick={() => {
          if (busy) return;
          const next = resolveNext();
          if (next == null) return;
          onSelect(next);
        }}
      >
        <span className="ld-sale-status-knob" />
      </button>
    </div>
  );
}

export const SALE_STATUS_TRIAD_COLUMNS = TRIAD;
