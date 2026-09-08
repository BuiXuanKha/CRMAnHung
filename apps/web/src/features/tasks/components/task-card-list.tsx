'use client';

import { Star } from 'lucide-react';
import {
  TaskTargetType,
  formatTaskDueOn,
  isWorkTaskCompleted,
  taskContextLine,
  taskDueCountdown,
  type WorkTask,
} from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import { ActionMenu, type WorkTaskAction } from './action-menu';

type Props = {
  items: WorkTask[];
  total: number;
  selectedId: string | null;
  menuId: string | null;
  onSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (item: WorkTask, action: WorkTaskAction) => void;
};

export function TaskCardList({
  items,
  total,
  selectedId,
  menuId,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onAction,
}: Props) {
  return (
    <div className="cv-cards-shell">
      <div className="cv-cards" role="list" aria-label="Danh sách công việc">
        {items.length === 0 ? (
          <p className="cv-empty-cards">
            Chưa có công việc. Bấm nút + để thêm, hoặc thêm từ menu Thao tác trên khách, lô đất,
            giao dịch hoặc sổ đỏ.
          </p>
        ) : (
          items.map((item) => {
            const done = isWorkTaskCompleted(item);
            const countdown = done ? null : taskDueCountdown(item.dueOn);
            const showPin = item.isPinned && !done;
            return (
              <article
                key={item.id}
                role="listitem"
                data-list-row-id={item.id}
                className={[
                  'cv-card',
                  selectedId === item.id ? 'is-selected' : '',
                  menuId === item.id ? 'is-menu-open' : '',
                  showPin ? 'is-pinned' : '',
                  done ? 'is-done' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(item.id);
                  }
                }}
                tabIndex={0}
              >
                <header className="cv-card-head">
                  <span className="cv-card-title">
                    {showPin ? (
                      <span className="cv-card-pin" title="Đã ghim">
                        <Icon icon={Star} size={14} strokeWidth={2.4} />
                      </span>
                    ) : null}
                    <strong>{item.content}</strong>
                  </span>
                  <div className="cv-card-actions" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      item={item}
                      open={menuId === item.id}
                      onToggle={() => onToggleMenu(item.id)}
                      onClose={onCloseMenu}
                      onAction={(a) => onAction(item, a)}
                    />
                  </div>
                </header>
                <p className="cv-card-meta">
                  <span>Hạn {formatTaskDueOn(item.dueOn)}</span>
                  {done ? (
                    <CrmBadge tone="green">Đã hoàn thành</CrmBadge>
                  ) : countdown ? (
                    <CrmBadge tone={countdown.tone}>{countdown.label}</CrmBadge>
                  ) : null}
                </p>
                <p className="cv-card-source">
                  {taskContextLine(item.targetType as TaskTargetType, item.targetLabel)}
                </p>
              </article>
            );
          })
        )}
      </div>
      <div className="cv-cards-count">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> công việc
      </div>
    </div>
  );
}
