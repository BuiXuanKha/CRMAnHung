'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone } from 'lucide-react';
import { CrmDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { useAuth } from '@/features/auth/auth-context';
import { HotlinesSettingsDialog } from './hotlines-dialog';
import './settings-hub.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Hub Cài đặt: hotline cho mọi NV; sổ địa chỉ chỉ Admin. */
export function SettingsHubDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [hotlineOpen, setHotlineOpen] = useState(false);

  useEffect(() => {
    if (!open) setHotlineOpen(false);
  }, [open]);

  if (hotlineOpen) {
    return (
      <HotlinesSettingsDialog
        open
        onClose={() => {
          setHotlineOpen(false);
          onClose();
        }}
      />
    );
  }

  return (
    <CrmDialog open={open} title="Cài đặt" onClose={onClose}>
      <div className="settings-hub-list">
        <button
          type="button"
          className="settings-hub-item"
          onClick={() => setHotlineOpen(true)}
        >
          <Icon icon={Phone} size="sm" />
          <span>
            <strong>Quản lý SĐT (hotline)</strong>
            <em>Số nguồn khi thêm khách</em>
          </span>
        </button>
        {user?.role === 'ADMIN' ? (
          <button
            type="button"
            className="settings-hub-item"
            onClick={() => {
              onClose();
              router.push('/cai-dat/dia-chi');
            }}
          >
            <Icon icon={MapPin} size="sm" />
            <span>
              <strong>Quản lý địa chỉ</strong>
              <em>Tỉnh · huyện · xã · thôn / dự án</em>
            </span>
          </button>
        ) : null}
      </div>
    </CrmDialog>
  );
}
