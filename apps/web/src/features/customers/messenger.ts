import type { CustomerListItem } from '@crmanhung/shared';

/**
 * Khớp CRM cũ (`crm.anhungland.com`):
 * - Mở chat → facebook.com/messages/t/{threadId} (mã số ≥ 5 chữ số)
 * - Mở Messenger → messenger.com/t/{threadId | customerUid}
 * Cả hai: mở tab mới trong cùng user gesture.
 */

/** Lấy mã số Messenger/Inbox từ threadId hoặc UID (cho phép chuỗi lẫn chữ nếu có cụm số đủ dài). */
export function numericMessengerId(raw?: string | null): string | null {
  const t = String(raw ?? '').trim();
  if (!t) return null;
  if (/^\d{5,}$/.test(t)) return t;
  // Ví dụ "t_1000…" / "fb:1000…" — lấy cụm chữ số dài nhất ≥ 5
  const runs = t.match(/\d{5,}/g);
  if (!runs?.length) return null;
  return runs.reduce((a, b) => (b.length >= a.length ? b : a));
}

/** URL «Mở chat» — Facebook Inbox web (CRM cũ). */
export function facebookInboxChatUrl(customer: CustomerListItem): string | null {
  const id = numericMessengerId(customer.facebook?.threadId);
  if (!id) return null;
  return `https://www.facebook.com/messages/t/${id}`;
}

/** URL «Mở Messenger» — messenger.com (CRM cũ). */
export function messengerComUrl(customer: CustomerListItem): string | null {
  const fromThread = numericMessengerId(customer.facebook?.threadId);
  if (fromThread) return `https://www.messenger.com/t/${fromThread}`;
  const fromUid = numericMessengerId(customer.facebook?.customerUid);
  if (fromUid) return `https://www.messenger.com/t/${fromUid}`;
  return null;
}

/**
 * Mở tab ngoài. Dùng `<a>` click để giữ user-gesture (tránh bị chặn popup
 * khi gọi sau setState). `noopener` qua rel — không dùng feature string của
 * window.open (một số trình duyệt luôn trả null khi có noopener).
 */
export function openExternalUrl(url: string | null | undefined): boolean {
  if (!url || typeof document === 'undefined') return false;
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    return false;
  }
}

/** @deprecated dùng messengerComUrl + openExternalUrl */
export function openCustomerMessenger(customer: CustomerListItem): boolean {
  return openExternalUrl(messengerComUrl(customer));
}
