'use client';

import { useEffect, useState } from 'react';
import { FileSpreadsheet, MapPin, Phone } from 'lucide-react';
import { CrmDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { useAuth } from '@/features/auth/auth-context';
import { AddressesManageDialog } from '../addresses/addresses-manage-dialog';
import { ImportProjectLotsDialog } from '../addresses/import-project-lots-dialog';
import { HotlinesSettingsDialog } from './hotlines-dialog';
import './settings-hub.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Hub Cài đặt: hotline cho mọi NV; sổ địa chỉ + import kho Excel chỉ Admin. */
export function SettingsHubDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const [hotlineOpen, setHotlineOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [importLotsOpen, setImportLotsOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setHotlineOpen(false);
      setAddressOpen(false);
      setImportLotsOpen(false);
    }
  }, [open]);

  if (addressOpen) {
    return (
      <AddressesManageDialog
        open
        onClose={() => {
          setAddressOpen(false);
          onClose();
        }}
      />
    );
  }

  if (importLotsOpen) {
    return (
      <ImportProjectLotsDialog
        open
        onClose={() => {
          setImportLotsOpen(false);
          onClose();
        }}
      />
    );
  }

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
          <>
            <button
              type="button"
              className="settings-hub-item"
              onClick={() => setAddressOpen(true)}
            >
              <Icon icon={MapPin} size="sm" />
              <span>
                <strong>Quản lý địa chỉ</strong>
                <em>Tỉnh · huyện · xã · thôn / dự án</em>
              </span>
            </button>
            <button
              type="button"
              className="settings-hub-item"
              onClick={() => setImportLotsOpen(true)}
            >
              <Icon icon={FileSpreadsheet} size="sm" />
              <span>
                <strong>Import lô đất Excel</strong>
                <em>Nhập kho lô vào dự án chưa có lô</em>
              </span>
            </button>
          </>
        ) : null}
      </div>
    </CrmDialog>
  );
}
