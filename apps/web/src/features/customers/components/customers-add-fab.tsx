'use client';

import { Plus } from 'lucide-react';
import { Icon } from '@/shared/ui/icon';

type Props = {
  onAdd: () => void;
};

/** FAB góc phải dưới — Thêm khách bằng SĐT (customers.md §12.2.3). Chỉ hiện mobile. */
export function CustomersAddFab({ onAdd }: Props) {
  return (
    <button
      type="button"
      className="kh-add-fab"
      aria-label="Thêm khách bằng SĐT"
      title="Thêm khách bằng SĐT"
      onClick={onAdd}
    >
      <Icon icon={Plus} size={24} strokeWidth={2.4} />
    </button>
  );
}
