'use client';

import { MessageCircle, Phone } from 'lucide-react';
import type { CustomerListItem } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import {
  channelLabel,
  demandLabel,
  formatBudget,
  initials,
  statusLabel,
  statusTone,
} from '../display';
import { ActionMenu, type CustomerAction } from './action-menu';

type Props = {
  items: CustomerListItem[];
  total: number;
  selectedId: string | null;
  menuId: string | null;
  onSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onAction: (customer: CustomerListItem, action: CustomerAction) => void;
};

export function CustomerTable({
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
    <div className="kh-table-wrap" role="table" aria-label="Danh sách khách hàng">
      {/* Header ngoài vùng cuộn — scrollbar chỉ trên thân bảng */}
      <div className="kh-table-head" role="rowgroup">
        <div className="kh-grid-row kh-grid-header" role="row">
          <div className="col-idx" role="columnheader">
            #
          </div>
          <div role="columnheader">Tên khách</div>
          <div role="columnheader">Nhu cầu</div>
          <div role="columnheader">Tài chính</div>
          <div role="columnheader">Kênh liên hệ</div>
          <div className="col-act" role="columnheader">
            Thao tác
          </div>
        </div>
      </div>

      <div className="kh-table-scroll" role="rowgroup">
        {items.length === 0 ? (
          <div className="kh-empty" role="row">
            Không có khách hàng phù hợp.
          </div>
        ) : (
          items.map((c, i) => (
            <div
              key={c.id}
              role="row"
              className={[
                'kh-grid-row',
                c.isPinned ? 'is-hot' : '',
                selectedId === c.id ? 'is-selected' : '',
                menuId === c.id ? 'is-menu-open' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(c.id)}
            >
              <div className="col-idx kh-cell" role="cell">
                {i + 1}
              </div>
              <div className="kh-cell" role="cell">
                <div className="kh-name">
                  <span className="kh-avatar" aria-hidden>
                    {c.facebook?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.facebook.avatarUrl} alt="" />
                    ) : (
                      initials(c.fullName)
                    )}
                  </span>
                  <div className="kh-name-text">
                    <div className="kh-name-row">
                      <strong>{c.fullName}</strong>
                      {c.primaryPhone ? (
                        <span className="kh-mini-icon phone" title="Có số điện thoại">
                          <Icon icon={Phone} size="mini" />
                        </span>
                      ) : null}
                      {c.facebook ? (
                        <span className="kh-mini-icon chat" title="Có Facebook">
                          <Icon icon={MessageCircle} size="mini" />
                        </span>
                      ) : null}
                    </div>
                    <CrmBadge tone={statusTone(c.status)}>{statusLabel(c.status)}</CrmBadge>
                    {c.facebook?.facebookName ? (
                      <span className="kh-sub">{c.facebook.facebookName}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="kh-cell" role="cell">
                <span className="kh-demand">{demandLabel(c)}</span>
              </div>
              <div className="kh-cell" role="cell">
                <span className="kh-budget crm-money">{formatBudget(c.budgetMinVnd, c.budgetMaxVnd)}</span>
              </div>
              <div className="kh-cell" role="cell">
                <span className="kh-channel">{channelLabel(c)}</span>
              </div>
              <div
                className="col-act kh-cell"
                role="cell"
                onClick={(e) => e.stopPropagation()}
              >
                <ActionMenu
                  customer={c}
                  open={menuId === c.id}
                  onToggle={() => onToggleMenu(c.id)}
                  onClose={onCloseMenu}
                  onAction={(a) => onAction(c, a)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="kh-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> khách hàng
      </div>
    </div>
  );
}
