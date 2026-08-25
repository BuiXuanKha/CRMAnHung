import type { CustomerListItem } from '@crmanhung/shared';

/**
 * Khớp CRM cũ (`crm.anhungland.com`):
 * - Mở chat → facebook.com/messages/t/{threadId} (chỉ số ≥ 5 chữ số)
 * - Mở Messenger → messenger.com/t/{threadId | customerUid}
 * Cả hai: window.open tab mới.
 */

function numericMessengerId(raw?: string | null): string | null {
  const t = String(raw ?? '').trim();
  if (!t || !/^\d{5,}$/.test(t)) return null;
  return t;
}

/** URL «Mở chat» — Facebook Inbox web (CRM cũ `y3` / `MY`). */
export function facebookInboxChatUrl(customer: CustomerListItem): string | null {
  const id = numericMessengerId(customer.facebook?.threadId);
  if (!id) return null;
  return `https://www.facebook.com/messages/t/${id}`;
}

/** URL «Mở Messenger» — messenger.com (CRM cũ `K1` / `b3`). */
export function messengerComUrl(customer: CustomerListItem): string | null {
  const fromThread = numericMessengerId(customer.facebook?.threadId);
  if (fromThread) return `https://www.messenger.com/t/${fromThread}`;
  const fromUid = numericMessengerId(customer.facebook?.customerUid);
  if (fromUid) return `https://www.messenger.com/t/${fromUid}`;
  return null;
}

export function openExternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/** @deprecated dùng messengerComUrl + openExternalUrl */
export function openCustomerMessenger(customer: CustomerListItem): boolean {
  return openExternalUrl(messengerComUrl(customer));
}
