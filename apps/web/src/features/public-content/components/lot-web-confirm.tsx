'use client';

import { Globe } from 'lucide-react';
import type { PublicWebLotRow } from '@crmanhung/shared';
import { CrmConfirmDialog } from '@/shared/ui/dialog';

type Props = {
  lot: PublicWebLotRow | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirm Đăng web only — product no longer supports Gỡ Đăng web. */
export function LotWebConfirm({ lot, busy, onCancel, onConfirm }: Props) {
  return (
    <CrmConfirmDialog
      open={Boolean(lot)}
      title="Đăng lô lên web"
      icon={Globe}
      message={
        lot
          ? `Đăng «${lot.title}» lên anhungland.com? Khách sẽ thấy lô này khi đang Mở bán.`
          : ''
      }
      confirmLabel="Đăng web"
      busy={busy}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
