import {
  CustomerStatus,
  PHONE_DUPLICATE_CODE,
  acknowledgePhoneDuplicateSchema,
  addCustomerPhoneSchema,
  createCustomerSchema,
  createEmployeeHotlineSchema,
  mergeFacebookIntoPhoneHolderSchema,
  updateCustomerCareSchema,
  updateEmployeeHotlineSchema,
  type AcknowledgePhoneDuplicateInput,
  type AddCustomerPhoneInput,
  type ContactChannelList,
  type CreateCustomerInput,
  type CreateEmployeeHotlineInput,
  type CustomerDetail,
  type CustomerListQuery,
  type CustomerListResponse,
  type CustomerLodatListResponse,
  type EmployeeHotline,
  type EmployeeHotlineList,
  type MergeFacebookIntoPhoneHolderInput,
  type UpdateCustomerCareInput,
  type UpdateCustomerInput,
  type UpdateEmployeeHotlineInput,
  type CustomerMessengerThread,
  UserRole,
  type AuthUser,
  type PhoneDuplicateExisting,
} from '@crmanhung/shared';
import { ApiError, apiFetch } from '@/shared/api/client';
import { isMockCustomers } from '@/shared/api/mode';
import { matchesBudgetFilter, matchesChannel } from './display';
import { listMockLodatsForCustomer, mockChats, mockCustomers, mockHotlines } from './mock-data';

export function isPhoneDuplicateError(
  err: unknown,
): err is ApiError & { existing: PhoneDuplicateExisting } {
  return (
    err instanceof ApiError &&
    err.code === PHONE_DUPLICATE_CODE &&
    Boolean(err.existing)
  );
}

let mockStore: CustomerDetail[] = structuredClone(mockCustomers);
let mockHotlineStore: EmployeeHotline[] = structuredClone(mockHotlines);

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
  if (query.budgetFilter) {
    next = next.filter((c) => matchesBudgetFilter(c, query.budgetFilter ?? 'all'));
  }
  if (query.contactChannel) {
    next = next.filter((c) => matchesChannel(c, query.contactChannel ?? 'all'));
  }
  if (query.needFilter === 'has') {
    next = next.filter((c) => Boolean(c.latestNeedSummary?.trim()));
  } else if (query.needFilter === 'empty') {
    next = next.filter((c) => !c.latestNeedSummary?.trim());
  }
  if (query.lodatFilter === 'has') {
    next = next.filter((c) => c.lodatCount > 0);
  } else if (query.lodatFilter === 'empty') {
    next = next.filter((c) => c.lodatCount <= 0);
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
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    return { items: items.slice(offset, offset + limit), total: items.length };
  }
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

export async function listCustomerLodats(
  id: string,
): Promise<CustomerLodatListResponse> {
  if (isMockCustomers()) {
    const user = currentMockUser();
    const found = visibleFor(user, mockStore).find((c) => c.id === id);
    if (!found) {
      throw new Error('Không tìm thấy khách hàng');
    }
    return {
      items: listMockLodatsForCustomer(id).map((lot) => ({
        id: lot.id,
        title: lot.title,
        address: lot.address ?? null,
        areaM2: null,
        frontageM: null,
        direction: [lot.area, lot.frontage ? `MT ${lot.frontage}` : null, lot.direction]
          .filter(Boolean)
          .join(' · ') || null,
        priceVnd: null,
        coverImageUrl: null,
        status: 'DANG_BAN',
        // Mock price kept as free text in broker-style note via address line when no address
        ...(lot.price
          ? {
              address: lot.address
                ? `${lot.address} · ${lot.price}`
                : lot.price,
            }
          : {}),
      })),
    };
  }
  return apiFetch<CustomerLodatListResponse>(`/customers/${id}/lodats`);
}

export async function listCustomerMessages(
  id: string,
): Promise<CustomerMessengerThread> {
  if (isMockCustomers()) {
    const user = currentMockUser();
    const found = visibleFor(user, mockStore).find((c) => c.id === id);
    if (!found) {
      throw new Error('Không tìm thấy khách hàng');
    }
    return { messages: mockChats[id] ?? [] };
  }
  return apiFetch<CustomerMessengerThread>(`/customers/${id}/messages`);
}

function toDuplicateExisting(c: CustomerDetail): PhoneDuplicateExisting {
  return {
    id: c.id,
    fullName: c.fullName,
    facebookName: c.facebook?.facebookName ?? null,
    primaryPhone: c.primaryPhone ?? null,
    hasFacebook: Boolean(c.facebook),
    isHidden: c.isHidden,
    status: c.status,
  };
}

function throwMockDuplicate(payload: {
  existing: CustomerDetail;
  message: string;
  mergeAllowed?: boolean;
  phone?: string;
  source?: { id: string; fullName: string };
}): never {
  throw new ApiError(409, payload.message, {
    code: PHONE_DUPLICATE_CODE,
    existing: toDuplicateExisting(payload.existing),
    mergeAllowed: payload.mergeAllowed,
    phone: payload.phone,
    source: payload.source,
  });
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<CustomerDetail> {
  const parsed = createCustomerSchema.parse(input);
  if (isMockCustomers()) {
    const user = currentMockUser();
    const hotline = mockHotlineStore.find(
      (h) => h.id === parsed.sourceHotlineId && h.isActive,
    );
    if (!hotline) {
      throw new Error('Hotline không hợp lệ hoặc đã tắt. Vui lòng chọn hotline khác.');
    }
    const existing = mockStore.find(
      (c) => c.employeeId === user.id && c.phones.some((p) => p.phone === parsed.phone),
    );
    if (existing) {
      throwMockDuplicate({
        existing,
        message: 'Số điện thoại này đã thuộc khách hàng của bạn.',
      });
    }
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
      sourceHotline: { id: hotline.id, phone: hotline.phone, label: hotline.label },
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

export async function addCustomerPhone(
  id: string,
  input: AddCustomerPhoneInput,
): Promise<CustomerDetail> {
  const parsed = addCustomerPhoneSchema.parse(input);
  if (isMockCustomers()) {
    const user = currentMockUser();
    const idx = mockStore.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Không tìm thấy khách hàng');
    const current = mockStore[idx];
    if (user.role !== UserRole.ADMIN && current.employeeId !== user.id) {
      throw new Error('Không có quyền');
    }
    if (current.isHidden) {
      throw new Error('Không thêm số điện thoại cho khách đã ẩn. Hãy khôi phục trước.');
    }
    if (current.primaryPhone || current.phones.length > 0) {
      throw new Error('Khách này đã có số điện thoại.');
    }
    const taken = mockStore.find(
      (c) =>
        c.employeeId === current.employeeId &&
        c.id !== id &&
        c.phones.some((p) => p.phone === parsed.phone),
    );
    if (taken) {
      throwMockDuplicate({
        existing: taken,
        message: taken.facebook
          ? 'Số điện thoại này đã thuộc khách khác có liên hệ Facebook.'
          : 'Số điện thoại này đã thuộc khách chỉ có SĐT — có thể gộp hồ sơ Facebook vào.',
        mergeAllowed: !taken.facebook,
        phone: parsed.phone,
        source: { id, fullName: current.fullName },
      });
    }
    const now = new Date().toISOString();
    const updated: CustomerDetail = {
      ...current,
      primaryPhone: parsed.phone,
      phones: [{ id: `ph_${Date.now()}`, phone: parsed.phone, label: null }],
      updatedAt: now,
    };
    mockStore = mockStore.map((c, i) => (i === idx ? updated : c));
    return updated;
  }
  return apiFetch<CustomerDetail>(`/customers/${id}/phones`, {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function acknowledgePhoneDuplicate(
  id: string,
  input: AcknowledgePhoneDuplicateInput,
): Promise<CustomerDetail> {
  const parsed = acknowledgePhoneDuplicateSchema.parse(input);
  if (isMockCustomers()) {
    return updateCustomer(id, { fullName: parsed.fullName, isHidden: false });
  }
  return apiFetch<CustomerDetail>(`/customers/${id}/acknowledge-phone-duplicate`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function mergeFacebookIntoPhoneHolder(
  input: MergeFacebookIntoPhoneHolderInput,
): Promise<CustomerDetail> {
  const parsed = mergeFacebookIntoPhoneHolderSchema.parse(input);
  if (isMockCustomers()) {
    const user = currentMockUser();
    const source = mockStore.find((c) => c.id === parsed.sourceCustomerId);
    const target = mockStore.find((c) => c.id === parsed.targetCustomerId);
    if (!source?.facebook) {
      throw new Error('Khách nguồn phải có liên hệ Facebook để gộp.');
    }
    if (!target) throw new Error('Không tìm thấy khách đích.');
    if (user.role !== UserRole.ADMIN) {
      if (source.employeeId !== user.id || target.employeeId !== user.id) {
        throw new Error('Không có quyền');
      }
    }
    if (target.facebook) {
      throw new Error('Khách đích đã có liên hệ Facebook — không gộp tự động.');
    }
    if (!target.phones.some((p) => p.phone === parsed.phone)) {
      throw new Error('Số điện thoại không thuộc khách đích — không thể gộp.');
    }
    const merged: CustomerDetail = {
      ...target,
      fullName: target.fullName.trim() || source.fullName,
      facebook: source.facebook,
      sourceFacebookProfile: source.sourceFacebookProfile ?? target.sourceFacebookProfile,
      careNotes: [...source.careNotes, ...target.careNotes],
      latestNeedSummary: source.latestNeedSummary ?? target.latestNeedSummary,
      latestCareNote: source.latestCareNote ?? target.latestCareNote,
      lodatCount: target.lodatCount + source.lodatCount,
      isHidden: false,
      updatedAt: new Date().toISOString(),
    };
    mockStore = mockStore
      .filter((c) => c.id !== source.id)
      .map((c) => (c.id === target.id ? merged : c));
    return merged;
  }
  return apiFetch<CustomerDetail>('/customers/merge-facebook-into-phone-holder', {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function listMyHotlines(activeOnly = false): Promise<EmployeeHotlineList> {
  if (isMockCustomers()) {
    const items = activeOnly
      ? mockHotlineStore.filter((h) => h.isActive)
      : mockHotlineStore;
    return { items };
  }
  const qs = activeOnly ? '?active=1' : '';
  return apiFetch<EmployeeHotlineList>(`/users/me/hotlines${qs}`);
}

export async function createHotline(
  input: CreateEmployeeHotlineInput,
): Promise<EmployeeHotline> {
  const parsed = createEmployeeHotlineSchema.parse(input);
  if (isMockCustomers()) {
    if (mockHotlineStore.some((h) => h.phone === parsed.phone)) {
      throw new Error('Số hotline này đã có trên tài khoản của bạn.');
    }
    const created: EmployeeHotline = {
      id: `hl_${Date.now()}`,
      phone: parsed.phone,
      label: parsed.label,
      isActive: true,
    };
    mockHotlineStore = [...mockHotlineStore, created];
    return created;
  }
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
  if (isMockCustomers()) {
    const idx = mockHotlineStore.findIndex((h) => h.id === id);
    if (idx < 0) throw new Error('Không tìm thấy hotline.');
    const updated = { ...mockHotlineStore[idx], ...parsed };
    mockHotlineStore = mockHotlineStore.map((h, i) => (i === idx ? updated : h));
    return updated;
  }
  return apiFetch<EmployeeHotline>(`/users/me/hotlines/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function listContactChannels(): Promise<ContactChannelList> {
  if (isMockCustomers()) {
    const user = currentMockUser();
    const visible = visibleFor(user, mockStore);
    const fbMap = new Map<string, { label: string; count: number }>();
    const hlMap = new Map<string, { label: string; count: number }>();
    for (const c of visible) {
      const uid = c.facebook?.employeeFacebookUid?.trim();
      if (uid) {
        const label = c.sourceFacebookProfile?.nickname?.trim() || uid;
        const cur = fbMap.get(uid) ?? { label, count: 0 };
        cur.count += 1;
        fbMap.set(uid, cur);
      }
      if (c.sourceHotline) {
        const label = c.sourceHotline.label
          ? `${c.sourceHotline.phone} (${c.sourceHotline.label})`
          : c.sourceHotline.phone;
        const cur = hlMap.get(c.sourceHotline.id) ?? { label, count: 0 };
        cur.count += 1;
        hlMap.set(c.sourceHotline.id, cur);
      }
    }
    return {
      items: [
        ...[...fbMap.entries()].map(([uid, v]) => ({
          value: `fb:${uid}`,
          label: v.label,
          type: 'facebook' as const,
          customerCount: v.count,
        })),
        ...[...hlMap.entries()].map(([id, v]) => ({
          value: `hotline:${id}`,
          label: v.label,
          type: 'hotline' as const,
          customerCount: v.count,
        })),
      ],
    };
  }
  return apiFetch<ContactChannelList>('/customers/contact-channels');
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
