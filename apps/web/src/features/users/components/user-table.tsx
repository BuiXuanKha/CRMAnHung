'use client';

import { UserRole, type UserAdminListItem } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { UserAvatar } from './user-avatar';

type Props = {
  items: UserAdminListItem[];
  currentUserId: string;
  onEdit: (user: UserAdminListItem) => void;
  onResetPassword: (user: UserAdminListItem) => void;
  onDelete: (user: UserAdminListItem) => void;
};

function roleLabel(role: string) {
  return role === UserRole.ADMIN ? 'Admin' : 'Nhân viên';
}

function roleTone(role: string): 'blue' | 'gray' {
  return role === UserRole.ADMIN ? 'blue' : 'gray';
}

export function UserTable({
  items,
  currentUserId,
  onEdit,
  onResetPassword,
  onDelete,
}: Props) {
  return (
    <div className="nv-s3212">
      <div className="nv-table-wrap">
        <div className="nv-table-head">
          <div className="nv-grid-row nv-grid-header">
            <div>#</div>
            <div>Avatar</div>
            <div>User</div>
            <div>Họ tên</div>
            <div>SĐT</div>
            <div>Vai trò</div>
            <div>Trạng thái</div>
            <div>Sửa</div>
            <div>Reset MK</div>
            <div>Xoá</div>
          </div>
        </div>
        <div className="nv-table-scroll">
          {items.length === 0 ? (
            <p className="nv-empty">Chưa có người dùng.</p>
          ) : (
            items.map((user, index) => {
              const isSelf = user.id === currentUserId;
              return (
                <div key={user.id} className="nv-grid-row">
                  <div>{index + 1}</div>
                  <div>
                    <UserAvatar name={user.fullName} url={user.avatarUrl} />
                  </div>
                  <div className="nv-username">{user.username}</div>
                  <div>{user.fullName}</div>
                  <div>{user.phone ?? '—'}</div>
                  <div>
                    <CrmBadge tone={roleTone(user.role)}>{roleLabel(user.role)}</CrmBadge>
                  </div>
                  <div>
                    <CrmBadge tone={user.isActive === false ? 'red' : 'green'}>
                      {user.isActive === false ? 'Đã khóa' : 'Đang hoạt động'}
                    </CrmBadge>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="nv-action-btn"
                      onClick={() => onEdit(user)}
                    >
                      Sửa
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="nv-action-btn"
                      onClick={() => onResetPassword(user)}
                    >
                      Reset MK
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="nv-action-btn danger"
                      disabled={isSelf}
                      title={isSelf ? 'Không thể xóa tài khoản đang đăng nhập' : undefined}
                      onClick={() => onDelete(user)}
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <footer className="nv-table-foot">
          Hiển thị {items.length} / Tổng {items.length} người dùng
        </footer>
      </div>
    </div>
  );
}
