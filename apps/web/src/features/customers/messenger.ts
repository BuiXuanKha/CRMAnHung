import {
  facebookInboxChatUrl as resolveFacebookInboxChatUrl,
  messengerComUrl as resolveMessengerComUrl,
  numericMessengerId,
  type CustomerListItem,
} from '@crmanhung/shared';

/**
 * Khớp CRM cũ (`crm.anhungland.com`):
 * - Mở chat → Inbox Facebook / Business Suite (pageUrl khi khách từ Page)
 * - E2EE → facebook.com/messages/e2ee/t/{threadId}
 * - Messenger cá nhân → facebook.com/messages/t/{threadId}
 * - Mở Messenger → messenger.com/t/{threadId | customerUid}
 * Cả hai: mở tab mới trong cùng user gesture.
 */

export { numericMessengerId };

/** URL «Mở chat». */
export function facebookInboxChatUrl(customer: CustomerListItem): string | null {
  return resolveFacebookInboxChatUrl(customer.facebook);
}

/** URL «Mở Messenger». */
export function messengerComUrl(customer: CustomerListItem): string | null {
  return resolveMessengerComUrl(customer.facebook);
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
