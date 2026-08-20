import {
  CustomerStatus,
  createCareNoteSchema,
  createCustomerSchema,
  type CreateCareNoteInput,
  type CreateCustomerInput,
  type CustomerDetail,
  type CustomerListQuery,
  type CustomerListResponse,
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
        c.latestCareNote ?? '',
        ...c.phones.map((p) => p.phone),
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

export async function addCareNote(
  id: string,
  input: CreateCareNoteInput,
): Promise<CustomerDetail> {
  const parsed = createCareNoteSchema.parse(input);
  if (isMockCustomers()) {
    const user = currentMockUser();
    const idx = mockStore.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Không tìm thấy khách hàng');
    const current = mockStore[idx];
    if (user.role !== UserRole.ADMIN && current.employeeId !== user.id) {
      throw new Error('Không có quyền');
    }
    const note = {
      id: `care_${Date.now()}`,
      note: parsed.note,
      employeeId: user.id,
      employeeName: user.fullName,
      createdAt: new Date().toISOString(),
    };
    const updated: CustomerDetail = {
      ...current,
      latestCareNote: note.note,
      careNotes: [note, ...current.careNotes],
      updatedAt: note.createdAt,
    };
    mockStore = mockStore.map((c, i) => (i === idx ? updated : c));
    return updated;
  }
  return apiFetch<CustomerDetail>(`/customers/${id}/care-notes`, {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}
