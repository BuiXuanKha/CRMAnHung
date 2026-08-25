'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, type LucideIcon } from 'lucide-react';
import { Icon } from './icon';
import './dialog.css';

type DialogBaseProps = {
  open: boolean;
  title: string;
  icon?: LucideIcon;
  children?: ReactNode;
  onClose: () => void;
  busy?: boolean;
  /** Prevent backdrop/Escape close while busy */
  className?: string;
};

export function CrmDialog({
  open,
  title,
  icon,
  children,
  onClose,
  busy = false,
  className,
}: DialogBaseProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="crm-dialog-backdrop"
      role="presentation"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className={['crm-dialog', className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="crm-dialog-head">
          {icon ? <Icon icon={icon} size="md" className="crm-dialog-icon" /> : null}
          <h2 id="crm-dialog-title">{title}</h2>
          {!busy ? (
            <button
              type="button"
              className="crm-dialog-close"
              aria-label="Đóng"
              onClick={onClose}
            >
              <Icon icon={X} size="sm" />
            </button>
          ) : null}
        </header>
        <div className="crm-dialog-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

type AlertProps = {
  open: boolean;
  title: string;
  message: string;
  icon?: LucideIcon;
  confirmLabel?: string;
  onClose: () => void;
};

export function CrmAlertDialog({
  open,
  title,
  message,
  icon,
  confirmLabel = 'Đã hiểu',
  onClose,
}: AlertProps) {
  return (
    <CrmDialog open={open} title={title} icon={icon} onClose={onClose}>
      <p className="crm-dialog-message">{message}</p>
      <div className="crm-dialog-actions">
        <button type="button" className="crm-btn primary" onClick={onClose}>
          {confirmLabel}
        </button>
      </div>
    </CrmDialog>
  );
}

type ConfirmProps = {
  open: boolean;
  title: string;
  message: string;
  icon?: LucideIcon;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive confirm (delete / hide) */
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CrmConfirmDialog({
  open,
  title,
  message,
  icon,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  danger = false,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmProps) {
  return (
    <CrmDialog open={open} title={title} icon={icon} onClose={onCancel} busy={busy}>
      <p className="crm-dialog-message">{message}</p>
      <div className="crm-dialog-actions">
        <button type="button" className="crm-btn" disabled={busy} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={['crm-btn', danger ? 'danger' : 'primary'].join(' ')}
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? 'Đang xử lý…' : confirmLabel}
        </button>
      </div>
    </CrmDialog>
  );
}

type ToastProps = {
  message: string | null;
};

export function CrmToast({ message }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!message || !mounted) return null;
  return createPortal(
    <div className="crm-toast" role="status">
      {message}
    </div>,
    document.body,
  );
}
