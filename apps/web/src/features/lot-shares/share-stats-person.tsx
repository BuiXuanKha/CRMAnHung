import { SHARE_STATS_DIRECT_ID, type ShareStatsDisplayRow } from '@crmanhung/shared';
import { Globe } from 'lucide-react';
import { CrmBadge } from '@/shared/ui/badge';

export function shareStatsRowKey(row: ShareStatsDisplayRow): string {
  return row.kind === 'direct' ? SHARE_STATS_DIRECT_ID : row.employee.employeeId;
}

export function shareStatsViewCount(row: ShareStatsDisplayRow): number {
  return row.kind === 'direct' ? row.attributedViewCount : row.employee.attributedViewCount;
}

export function shareStatsShareCount(row: ShareStatsDisplayRow): number {
  return row.kind === 'direct' ? 0 : row.employee.sharedListingCount;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ShareStatsPerson({ row }: { row: ShareStatsDisplayRow }) {
  if (row.kind === 'direct') {
    return (
      <span className="pw-person">
        <span className="pw-avatar" aria-hidden>
          <Globe size={16} strokeWidth={2} />
        </span>
        <span className="pw-person-text">
          <span className="pw-title">Truy cập trực tiếp</span>
          <span className="pw-sub">Không gắn nhân viên</span>
        </span>
      </span>
    );
  }

  const employee = row.employee;
  return (
    <span className="pw-person">
      <span className="pw-avatar" aria-hidden>
        {employee.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={employee.avatarUrl} alt="" />
        ) : (
          initials(employee.fullName)
        )}
      </span>
      <span className="pw-person-text">
        <span className="pw-title">{employee.fullName}</span>
        <span className="pw-sub">{employee.username}</span>
        {employee.isActive === false ? <CrmBadge tone="red">Đã khóa</CrmBadge> : null}
      </span>
    </span>
  );
}
