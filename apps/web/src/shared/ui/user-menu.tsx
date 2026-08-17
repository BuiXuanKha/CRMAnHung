'use client';

import { LogOut, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './icon';
import './user-menu.css';

type Props = {
  fullName: string;
  roleLabel: string;
  onLogout: () => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserMenu({ fullName, roleLabel, onLogout }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="shell-user-menu" ref={wrapRef}>
      <button
        type="button"
        className={['shell-avatar', open ? 'is-open' : ''].filter(Boolean).join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${fullName}, ${roleLabel}`}
        title={fullName}
        onClick={() => setOpen((v) => !v)}
      >
        {initials(fullName)}
      </button>
      {open ? (
        <div className="shell-user-dropdown" role="menu">
          <div className="shell-user-dropdown-meta">
            <strong>{fullName}</strong>
            <span>{roleLabel}</span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
            }}
          >
            <Icon icon={Settings} size="sm" /> Cài đặt
          </button>
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <Icon icon={LogOut} size="sm" /> Đăng xuất
          </button>
        </div>
      ) : null}
    </div>
  );
}
