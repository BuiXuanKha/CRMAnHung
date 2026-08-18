'use client';

import { LodatSaleStatus } from '@crmanhung/shared';
import './sale-toggle.css';

type Props = {
  title: string;
  status: LodatSaleStatus;
  busy?: boolean;
  onToggle: () => void;
};

export function SaleToggle({ title, status, busy = false, onToggle }: Props) {
  const isOpen = status === LodatSaleStatus.DANG_BAN;

  return (
    <div
      className="ld-sale-toggle"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        role="switch"
        className={['ld-sale-switch', isOpen ? 'is-on' : ''].filter(Boolean).join(' ')}
        aria-checked={isOpen}
        aria-label={isOpen ? `Tạm dừng ${title}` : `Mở bán ${title}`}
        disabled={busy}
        onClick={onToggle}
      >
        <span className="ld-sale-knob" />
      </button>
      <span className={['ld-sale-label', isOpen ? 'is-on' : ''].filter(Boolean).join(' ')}>
        {isOpen ? 'Mở bán' : 'Tạm dừng'}
      </span>
    </div>
  );
}

export function canToggleSaleStatus(status: LodatSaleStatus): boolean {
  return status === LodatSaleStatus.DANG_BAN || status === LodatSaleStatus.TAM_DUNG;
}
