import type { ShareEmployeeStat } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ShareStatsPerson({ row }: { row: ShareEmployeeStat }) {
  return (
    <span className="pw-person">
      <span className="pw-avatar" aria-hidden>
        {row.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.avatarUrl} alt="" />
        ) : (
          initials(row.fullName)
        )}
      </span>
      <span className="pw-person-text">
        <span className="pw-title">{row.fullName}</span>
        <span className="pw-sub">{row.username}</span>
        {row.isActive === false ? (
          <CrmBadge tone="red">Đã khóa</CrmBadge>
        ) : null}
      </span>
    </span>
  );
}
