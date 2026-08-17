'use client';

import type { CustomerListItem } from '@crmanhung/shared';
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
    <div className="kh-table-wrap">
      <div className="kh-table-scroll">
        <table className="kh-table">
          <thead>
            <tr>
              <th className="col-idx">#</th>
              <th>Tên khách</th>
              <th>Nhu cầu</th>
              <th>Tài chính</th>
              <th>Kênh liên hệ</th>
              <th className="col-act">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="kh-empty">
                  Không có khách hàng phù hợp.
                </td>
              </tr>
            ) : (
              items.map((c, i) => (
                <tr
                  key={c.id}
                  className={[
                    c.isPinned ? 'is-hot' : '',
                    selectedId === c.id ? 'is-selected' : '',
                    menuId === c.id ? 'is-menu-open' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSelect(c.id)}
                >
                  <td className="col-idx">{i + 1}</td>
                  <td>
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
                              ☎
                            </span>
                          ) : null}
                          {c.facebook ? (
                            <span className="kh-mini-icon chat" title="Có Facebook">
                              💬
                            </span>
                          ) : null}
                        </div>
                        <span className={`kh-badge ${statusTone(c.status)}`}>
                          {statusLabel(c.status)}
                        </span>
                        {c.facebook?.facebookName ? (
                          <span className="kh-sub">{c.facebook.facebookName}</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td>{demandLabel(c)}</td>
                  <td>{formatBudget(c.budgetMinVnd, c.budgetMaxVnd)}</td>
                  <td>
                    <span className="kh-channel">{channelLabel(c)}</span>
                  </td>
                  <td className="col-act" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      customer={c}
                      open={menuId === c.id}
                      onToggle={() => onToggleMenu(c.id)}
                      onClose={onCloseMenu}
                      onAction={(a) => onAction(c, a)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="kh-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> khách hàng
      </div>
    </div>
  );
}
