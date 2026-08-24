'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { Icon } from '@/shared/ui/icon';
import { AddressesManageDialog } from './addresses-manage-dialog';
import './addresses.css';

/** Route `/cai-dat/dia-chi` — mở cùng modal như Cài đặt → Quản lý địa chỉ. */
export function AddressBookPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.replace('/khach-hang');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || user.role !== 'ADMIN') {
    return <div className="boot-screen">Đang tải…</div>;
  }

  return (
    <div className="addr-page">
      <header className="addr-page-head">
        <div>
          <h1>
            <Icon icon={MapPin} size="sm" /> Quản lý địa chỉ
          </h1>
          <p>Sổ dùng chung — chỉ Admin thêm / sửa. Nhân viên chỉ chọn khi tạo lô.</p>
        </div>
        <button type="button" className="crm-btn primary" onClick={() => setOpen(true)}>
          Mở sổ địa chỉ
        </button>
      </header>

      <AddressesManageDialog
        open={open}
        onClose={() => {
          setOpen(false);
          router.push('/khach-hang');
        }}
      />
    </div>
  );
}
