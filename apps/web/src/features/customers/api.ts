import {
  CustomerStatus,
  createCustomerSchema,
  updateCustomerCareSchema,
  type CreateCustomerInput,
  type CustomerDetail,
  type CustomerListQuery,
  type CustomerListResponse,
  type UpdateCustomerCareInput,
  type UpdateCustomerInput,
  UserRole,
  type AuthUser,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';
import { isMockCustomers } from '@/shared/api/mode';
import { mockCustomers } from './mock-data';

let mockStore: CustomerDetail[] = structuredClone(mockCustomers);

function currentMockUser(): AuthUser {
  if (typeof window === 'undefined') {
    return {
      id: 'user_staff_1',
      username: 'staff',
      fullName: 'Nhân viên Demo',
      role: UserRole.STAFF,
    };
  }
  const raw =
    sessionStorage.getItem('crmanhung_session_user') ??
    sessionStorage.getItem('crmanhung_mock_user');
  if (raw) {
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      // fall through
    }
  }
  return {
    id: 'user_staff_1',
    username: 'staff',
    fullName: 'Nhân viên Demo',
    role: UserRole.STAFF,
  };
}

function visibleFor(user: AuthUser, items: CustomerDetail[]) {
  if (user.role === UserRole.ADMIN) return items;
  return items.filter((c) => c.employeeId === user.id);
}

function applyQuery(
  items: CustomerDetail[],
  query: CustomerListQuery = {},
): CustomerDetail[] {
  let next = items;
  if (query.hiddenOnly) {
    next = next.filter((c) => c.isHidden);
  } else if (!query.includeHidden) {
    next = next.filter((c) => !c.isHidden);
  }
  if (query.status) {
    next = next.filter((c) => c.status === query.status);
  }
  if (query.keyword?.trim()) {
    const q = query.keyword.trim().toLowerCase();
    next = next.filter((c) => {
      const hay = [
        c.fullName,
        c.primaryPhone ?? '',
        c.facebook?.facebookName ?? '',
        c.note ?? '',
        c.latestNeedSummary ?? '',
        c.latestCareNote ?? '',
        ...c.phones.map((p) => p.phone),
        ...c.careNotes.flatMap((n) => [n.note, n.needSummary ?? '']),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }
  return [...next].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export async function listCustomers(
  query: CustomerListQuery = {},
): Promise<CustomerListResponse> {
  if (isMockCustomers()) {
    const user = currentMockUser();
    const items = applyQuery(visibleFor(user, mockStore), query);
    return { items, total: items.length };
  }
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.status) params.set('status', query.status);
  if (query.includeHidden) params.set('includeHidden', 'true');
  if (query.hiddenOnly) params.set('hiddenOnly', 'true');
  const qs = params.toString();
  return apiFetch<CustomerListResponse>(`/customers${qs ? `?${qs}` : ''}`);
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  if (isMockCustomers()) {
    const user = currentMockUser();
    const found = visibleFor(user, mockStore).find((c) => c.id === id);
    if (!found) {
      throw new Error('Không tìm thấy khách hàng');
    }
    return found;
  }
  return apiFetch<CustomerDetail>(`/customers/${id}`);
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<CustomerDetail> {
  const parsed = createCustomerSchema.parse(input);
  if (isMockCustomers()) {
    const user = currentMockUser();
    const now = new Date().toISOString();
    const created: CustomerDetail = {
      id: `cus_${Date.now()}`,
      employeeId: user.id,
      employeeName: user.fullName,
      fullName: parsed.fullName,
      status: CustomerStatus.KHACH_MOI,
      budgetMinVnd: null,
      budgetMaxVnd: null,
      note: parsed.note ?? null,
      isPinned: false,
      isHidden: false,
      primaryPhone: parsed.phone,
      phones: [{ id: `ph_${Date.now()}`, phone: parsed.phone, label: null }],
      facebook: null,
      latestCareNote: null,
      lodatCount: 0,
      createdAt: now,
      updatedAt: now,
      careNotes: [],
    };
    mockStore = [created, ...mockStore];
    return created;
  }
  return apiFetch<CustomerDetail>('/customers', {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<CustomerDetail> {
  if (isMockCustomers()) {
    const user = currentMockUser();
    const idx = mockStore.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Không tìm thấy khách hàng');
    const current = mockStore[idx];
    if (user.role !== UserRole.ADMIN && current.employeeId !== user.id) {
      throw new Error('Không có quyền sửa khách này');
    }
    const updated: CustomerDetail = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    mockStore = mockStore.map((c, i) => (i === idx ? updated : c));
    return updated;
  }
  return apiFetch<CustomerDetail>(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function updateCustomerCare(
  id: string,
  input: UpdateCustomerCareInput,
): Promise<CustomerDetail & { unchanged?: boolean }> {
  const parsed = updateCustomerCareSchema.parse(input);
  if (isMockCustomers()) {
    const user = currentMockUser();
    const idx = mockStore.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Không tìm thấy khách hàng');
    const current = mockStore[idx];
    if (user.role !== UserRole.ADMIN && current.employeeId !== user.id) {
      throw new Error('Không có quyền');
    }
    if (current.isHidden) {
      throw new Error('Không cập nhật chăm sóc cho khách đã ẩn. Hãy khôi phục trước.');
    }
    const needSummary = (parsed.needSummary ?? '').trim();
    const noteText = (parsed.note ?? '').trim();
    const statusChanged = current.status !== parsed.status;
    const budgetChanged =
      (current.budgetMinVnd ?? null) !== parsed.budgetMinVnd ||
      (current.budgetMaxVnd ?? null) !== parsed.budgetMaxVnd;
    const latestNeed = (current.latestNeedSummary ?? '').trim();
    const latestNote = (current.latestCareNote ?? '').trim();
    const careChanged =
      (Boolean(needSummary) || Boolean(noteText)) &&
      (needSummary !== latestNeed || noteText !== latestNote);
    if (!statusChanged && !budgetChanged && !careChanged) {
      return { ...current, unchanged: true };
    }
    const now = new Date().toISOString();
    const careNotes = careChanged
      ? [
          {
            id: `care_${Date.now()}`,
            note: noteText,
            needSummary: needSummary || null,
            employeeId: user.id,
            employeeName: user.fullName,
            createdAt: now,
          },
          ...current.careNotes,
        ]
      : current.careNotes;
    const updated: CustomerDetail = {
      ...current,
      status: parsed.status,
      budgetMinVnd: parsed.budgetMinVnd,
      budgetMaxVnd: parsed.budgetMaxVnd,
      latestNeedSummary: careChanged
        ? needSummary || current.latestNeedSummary
        : current.latestNeedSummary,
      latestCareNote: careChanged ? noteText || current.latestCareNote : current.latestCareNote,
      careNotes,
      updatedAt: now,
    };
    mockStore = mockStore.map((c, i) => (i === idx ? updated : c));
    return { ...updated, unchanged: false };
  }
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
    : 'Đã lưu cập nhật chăm sóc.';
}
