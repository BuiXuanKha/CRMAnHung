'use client';

import { Plus } from 'lucide-react';
import { Icon } from '@/shared/ui/icon';

type Props = {
  onCreate: () => void;
};

/** FAB góc phải dưới — Tạo công việc (tasks.md §12.1.4). */
export function TasksCreateFab({ onCreate }: Props) {
  return (
    <button
      type="button"
      className="cv-fab"
      aria-label="Tạo công việc"
      title="Tạo công việc"
      onClick={onCreate}
    >
      <Icon icon={Plus} size={24} strokeWidth={2.4} />
    </button>
  );
}
