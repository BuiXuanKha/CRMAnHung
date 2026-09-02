'use client';

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserAvatar({
  name,
  url,
  size = 'sm',
}: {
  name: string;
  url?: string | null;
  size?: 'sm' | 'lg';
}) {
  return (
    <span className={['nv-avatar', size === 'lg' ? 'nv-avatar-lg' : ''].filter(Boolean).join(' ')} aria-hidden>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        userInitials(name)
      )}
    </span>
  );
}
