'use client';

import { Star } from 'lucide-react';
import {
  TaskTargetType,
  formatTaskDueOn,
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

export function TaskTable({
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
    <div className="cv-table-wrap" role="table" aria-label="Danh sách công việc">
      <div className="cv-table-head" role="rowgroup">
        <div className="cv-grid-row cv-grid-header" role="row">
          <div className="col-idx" role="columnheader">
            #
          </div>
          <div role="columnheader">Nội dung</div>
          <div role="columnheader">Nguồn</div>
          <div role="columnheader">Hạn làm</div>
          <div role="columnheader">Đếm ngược</div>
          <div className="col-act" role="columnheader">
            Thao tác
          </div>
        </div>
      </div>

      <div className="cv-table-scroll" role="rowgroup">
        {items.length === 0 ? (
          <div className="cv-empty-row" role="row">
            Chưa có công việc. Bấm nút + để thêm, hoặc thêm từ menu Thao tác trên khách, lô đất, giao dịch hoặc sổ đỏ.
          </div>
        ) : (
          items.map((item, index) => {
            const countdown = taskDueCountdown(item.dueOn);
            return (
              <div
                key={item.id}
                role="row"
                data-list-row-id={item.id}
                className={[
                  'cv-grid-row',
                  selectedId === item.id ? 'is-selected' : '',
                  menuId === item.id ? 'is-menu-open' : '',
                  item.isPinned ? 'is-hot' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect(item.id)}
              >
                <div className="cv-cell col-idx" role="cell">
                  {item.isPinned ? (
                    <span className="cv-pin" title="Đã ghim">
                      <Icon icon={Star} size={14} strokeWidth={2.4} />
                    </span>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="cv-cell" role="cell">
                  <span className="cv-content">{item.content}</span>
                </div>
                <div className="cv-cell" role="cell">
                  <span className="cv-source">
                    {taskContextLine(item.targetType as TaskTargetType, item.targetLabel)}
                  </span>
                </div>
                <div className="cv-cell" role="cell">
                  <span className="cv-due">{formatTaskDueOn(item.dueOn)}</span>
                </div>
                <div className="cv-cell" role="cell">
                  <CrmBadge tone={countdown.tone}>{countdown.label}</CrmBadge>
                </div>
                <div
                  className="col-act cv-cell"
                  role="cell"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionMenu
                    item={item}
                    open={menuId === item.id}
                    onToggle={() => onToggleMenu(item.id)}
                    onClose={onCloseMenu}
                    onAction={(a) => onAction(item, a)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="cv-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> công việc
      </div>
    </div>
  );
}
