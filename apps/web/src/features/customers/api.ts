import {
  PHONE_DUPLICATE_CODE,
  acknowledgePhoneDuplicateSchema,
  addCustomerPhoneSchema,
  createCustomerSchema,
  createEmployeeHotlineSchema,
  mergeFacebookIntoPhoneHolderSchema,
  updateCustomerCareSchema,
  updateCustomerPhoneSchema,
  updateEmployeeHotlineSchema,
  type AcknowledgePhoneDuplicateInput,
  type AddCustomerPhoneInput,
  type ContactChannelList,
  type CreateCustomerInput,
  type CreateEmployeeHotlineInput,
  type CustomerDetail,
  type CustomerListItem,
  type CustomerListQuery,
  type CustomerListResponse,
  type CustomerLodatListResponse,
  type EmployeeHotline,
  type EmployeeHotlineList,
  type MergeFacebookIntoPhoneHolderInput,
  type UpdateCustomerCareInput,
  type UpdateCustomerInput,
  type UpdateCustomerPhoneInput,
  type UpdateEmployeeHotlineInput,
  type CustomerMessengerThread,
  type PhoneDuplicateExisting,
} from '@crmanhung/shared';
import { ApiError, apiFetch } from '@/shared/api/client';

export function isPhoneDuplicateError(
  err: unknown,
): err is ApiError & { existing: PhoneDuplicateExisting } {
  return (
    err instanceof ApiError &&
    err.code === PHONE_DUPLICATE_CODE &&
    Boolean(err.existing)
  );
}

export async function listCustomers(
  query: CustomerListQuery = {},
): Promise<CustomerListResponse> {
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.status) params.set('status', query.status);
  if (query.includeHidden) params.set('includeHidden', 'true');
  if (query.hiddenOnly) params.set('hiddenOnly', 'true');
  if (query.budgetFilter) params.set('budgetFilter', query.budgetFilter);
  if (query.contactChannel) params.set('contactChannel', query.contactChannel);
  if (query.needFilter) params.set('needFilter', query.needFilter);
  if (query.lodatFilter) params.set('lodatFilter', query.lodatFilter);
  if (query.limit != null) params.set('limit', String(query.limit));
  if (query.offset != null) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiFetch<CustomerListResponse>(`/customers${qs ? `?${qs}` : ''}`);
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  return apiFetch<CustomerDetail>(`/customers/${id}`);
}

export async function listCustomerLodats(
  id: string,
): Promise<CustomerLodatListResponse> {
  return apiFetch<CustomerLodatListResponse>(`/customers/${id}/lodats`);
}

export async function listCustomerMessages(
  id: string,
): Promise<CustomerMessengerThread> {
  return apiFetch<CustomerMessengerThread>(`/customers/${id}/messages`);
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<CustomerDetail> {
  const parsed = createCustomerSchema.parse(input);
  return apiFetch<CustomerDetail>('/customers', {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<CustomerDetail> {
  return apiFetch<CustomerDetail>(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function addCustomerPhone(
  id: string,
  input: AddCustomerPhoneInput,
): Promise<CustomerDetail> {
  const parsed = addCustomerPhoneSchema.parse(input);
  return apiFetch<CustomerDetail>(`/customers/${id}/phones`, {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function updateCustomerPhone(
  id: string,
  phoneId: string,
  input: UpdateCustomerPhoneInput,
): Promise<CustomerDetail> {
  const parsed = updateCustomerPhoneSchema.parse(input);
  return apiFetch<CustomerDetail>(`/customers/${id}/phones/${phoneId}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function deleteCustomerPhone(
  id: string,
  phoneId: string,
): Promise<CustomerDetail> {
  return apiFetch<CustomerDetail>(`/customers/${id}/phones/${phoneId}`, {
    method: 'DELETE',
  });
}

export async function acknowledgePhoneDuplicate(
  id: string,
  input: AcknowledgePhoneDuplicateInput,
): Promise<CustomerDetail> {
  const parsed = acknowledgePhoneDuplicateSchema.parse(input);
  return apiFetch<CustomerDetail>(`/customers/${id}/acknowledge-phone-duplicate`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function mergeFacebookIntoPhoneHolder(
  input: MergeFacebookIntoPhoneHolderInput,
): Promise<CustomerDetail> {
  const parsed = mergeFacebookIntoPhoneHolderSchema.parse(input);
  return apiFetch<CustomerDetail>('/customers/merge-facebook-into-phone-holder', {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function listMyHotlines(activeOnly = false): Promise<EmployeeHotlineList> {
  const qs = activeOnly ? '?active=1' : '';
  return apiFetch<EmployeeHotlineList>(`/users/me/hotlines${qs}`);
}

export async function createHotline(
  input: CreateEmployeeHotlineInput,
): Promise<EmployeeHotline> {
  const parsed = createEmployeeHotlineSchema.parse(input);
  return apiFetch<EmployeeHotline>('/users/me/hotlines', {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function updateHotline(
  id: string,
  input: UpdateEmployeeHotlineInput,
): Promise<EmployeeHotline> {
  const parsed = updateEmployeeHotlineSchema.parse(input);
  return apiFetch<EmployeeHotline>(`/users/me/hotlines/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function listContactChannels(): Promise<ContactChannelList> {
  return apiFetch<ContactChannelList>('/customers/contact-channels');
}

export function customerDetailToListItem(
  detail: CustomerDetail & { unchanged?: boolean },
): CustomerListItem {
  const { careNotes: _careNotes, unchanged: _unchanged, ...item } = detail;
  return item;
}

export async function updateCustomerCare(
  id: string,
  input: UpdateCustomerCareInput,
): Promise<CustomerDetail & { unchanged?: boolean }> {
  const parsed = updateCustomerCareSchema.parse(input);
  return apiFetch<CustomerDetail & { unchanged?: boolean }>(`/customers/${id}/care-notes`, {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

const CARE_TOAST_KEY = 'crmanhung_care_toast';

export function stashCareToast(unchanged?: boolean) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CARE_TOAST_KEY, unchanged ? 'unchanged' : 'saved');
}

export function consumeCareToast(): string | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem(CARE_TOAST_KEY);
  if (!value) return null;
  sessionStorage.removeItem(CARE_TOAST_KEY);
  return value === 'unchanged'
    ? 'Không có thay đổi. Bỏ qua cập nhật.'
    : 'Đã cập nhật chăm sóc.';
}
