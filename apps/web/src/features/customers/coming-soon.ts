import { Construction } from 'lucide-react';

/** Alert dùng chung cho mục Thao tác chưa làm (tạo lô, sổ đỏ…). */
export const COMING_SOON_TITLE = 'Chức năng đang phát triển';
export const COMING_SOON_ICON = Construction;
export const COMING_SOON_CONFIRM = 'Đã hiểu';

export function comingSoonMessage(featureName: string): string {
  return `${featureName} chưa sẵn sàng trên CRM mới. Bạn sẽ được thông báo khi chức năng này hoàn thành.`;
}
