import type { CustomerListItem } from '@crmanhung/shared';

/**
 * Mở hội thoại Messenger (CRM cũ: messenger.com/t/… — thread hoặc uid khách).
 * Trả về false nếu thiếu facebook / thread / uid.
 */
export function openCustomerMessenger(customer: CustomerListItem): boolean {
  const fb = customer.facebook;
  if (!fb) return false;
  const target = (fb.threadId?.trim() || fb.customerUid?.trim() || '').replace(/^t\//, '');
  if (!target) return false;
  window.open(`https://www.messenger.com/t/${target}`, '_blank', 'noopener,noreferrer');
  return true;
}
