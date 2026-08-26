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

export function LotWebConfirm({ lot, busy, onCancel, onConfirm }: Props) {
  const publishing = Boolean(lot && !lot.isPublished);

  return (
    <CrmConfirmDialog
      open={Boolean(lot)}
      title={publishing ? 'Đăng lô lên web' : 'Gỡ lô khỏi web'}
      icon={Globe}
      message={
        lot
          ? publishing
            ? `Đăng «${lot.title}» lên anhungland.com? Khách sẽ thấy lô này.`
            : `Gỡ «${lot.title}» khỏi trang khách? URL cũ sẽ không còn hiện.`
          : ''
      }
      confirmLabel={publishing ? 'Đăng web' : 'Gỡ web'}
      danger={!publishing}
      busy={busy}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
