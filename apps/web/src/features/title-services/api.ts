import {
  TITLE_SERVICE_STATUS_LABELS,
  addTitleServiceAttachmentSchema,
  addTitleServiceMoneySchema,
  addTitleServiceProgressSchema,
  updateTitleServiceSchema,
  type AddTitleServiceAttachmentInput,
  type AddTitleServiceMoneyInput,
  type AddTitleServiceProgressInput,
  type TitleServiceDetail,
  type TitleServiceListItem,
  type TitleServiceListQuery,
  type TitleServiceListResponse,
  type UpdateTitleServiceInput,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';
import { isMockMode } from '@/shared/api/mode';
import { computeDaysWorking } from './display';
import { mockTitleServices } from './mock-data';

const STAFF = 'Bùi Xuân Khả';

let mockStore: TitleServiceDetail[] = structuredClone(mockTitleServices);

function refreshComputed(row: TitleServiceDetail): TitleServiceDetail {
  const progress = [...row.progress].sort((a, b) => b.happenedAt.localeCompare(a.happenedAt));
  const thu = row.moneyEntries
    .filter((e) => e.kind === 'THU')
    .reduce((s, e) => s + e.amountVnd, 0);
  const chi = row.moneyEntries
    .filter((e) => e.kind === 'CHI')
    .reduce((s, e) => s + e.amountVnd, 0);
  return {
    ...row,
    progress,
    latestProgress: progress[0] ?? null,
    documentCount: row.attachments.length,
    totalThuVnd: thu,
    totalChiVnd: chi,
    daysWorking: computeDaysWorking(row.startedAt, row.completedAt, row.status),
  };
}

function toListItem(row: TitleServiceDetail): TitleServiceListItem {
  const computed = refreshComputed(row);
  return {
    id: computed.id,
    code: computed.code,
    customerId: computed.customerId,
    customerName: computed.customerName,
    primaryPhone: computed.primaryPhone,
    status: computed.status,
    agreedFeeVnd: computed.agreedFeeVnd,
    needSummary: computed.needSummary,
    note: computed.note,
    isPinned: computed.isPinned,
    startedAt: computed.startedAt,
    completedAt: computed.completedAt,
    daysWorking: computed.daysWorking,
    documentCount: computed.documentCount,
    totalThuVnd: computed.totalThuVnd,
    totalChiVnd: computed.totalChiVnd,
    latestProgress: computed.latestProgress,
    createdAt: computed.createdAt,
    updatedAt: computed.updatedAt,
  };
}

function applyQuery(
  items: TitleServiceDetail[],
  query: TitleServiceListQuery = {},
): TitleServiceDetail[] {
  let next = items;
  if (query.status) {
    next = next.filter((row) => row.status === query.status);
  }
  if (query.keyword?.trim()) {
    const q = query.keyword.trim().toLowerCase();
    next = next.filter((row) => {
      const hay = [
        row.code,
        row.customerName,
        row.primaryPhone ?? '',
        row.needSummary ?? '',
        row.note ?? '',
        TITLE_SERVICE_STATUS_LABELS[row.status],
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

export async function listTitleServices(
  query: TitleServiceListQuery = {},
): Promise<TitleServiceListResponse> {
  if (isMockMode()) {
    const items = applyQuery(mockStore, query).map(toListItem);
    return { items, total: items.length };
  }
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.status) params.set('status', query.status);
  const qs = params.toString();
  return apiFetch<TitleServiceListResponse>(`/title-services${qs ? `?${qs}` : ''}`);
}

export async function getTitleService(id: string): Promise<TitleServiceDetail> {
  if (isMockMode()) {
    const found = mockStore.find((row) => row.id === id);
    if (!found) throw new Error('Không tìm thấy hồ sơ sổ đỏ');
    return refreshComputed(found);
  }
  return apiFetch<TitleServiceDetail>(`/title-services/${id}`);
}

export async function updateTitleService(
  id: string,
  input: UpdateTitleServiceInput,
): Promise<TitleServiceListItem> {
  const parsed = updateTitleServiceSchema.parse(input);
  if (isMockMode()) {
    const idx = mockStore.findIndex((row) => row.id === id);
    if (idx < 0) throw new Error('Không tìm thấy hồ sơ sổ đỏ');
    const now = new Date().toISOString();
    const current = mockStore[idx];
    let completedAt = current.completedAt;
    const nextStatus = parsed.status ?? current.status;
    if (nextStatus === 'HOAN_THANH' || nextStatus === 'HUY') {
      completedAt = completedAt ?? now;
    } else if (parsed.status) {
      completedAt = null;
    }
    const updated = refreshComputed({
      ...current,
      status: nextStatus,
      agreedFeeVnd:
        parsed.agreedFeeVnd !== undefined ? parsed.agreedFeeVnd : current.agreedFeeVnd,
      needSummary:
        parsed.needSummary !== undefined ? parsed.needSummary : current.needSummary,
      note: parsed.note !== undefined ? parsed.note : current.note,
      isPinned: parsed.isPinned ?? current.isPinned,
      completedAt,
      updatedAt: now,
    });
    mockStore = mockStore.map((row, i) => (i === idx ? updated : row));
    return toListItem(updated);
  }
  return apiFetch<TitleServiceListItem>(`/title-services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function addTitleServiceProgress(
  id: string,
  input: AddTitleServiceProgressInput,
): Promise<TitleServiceDetail> {
  const parsed = addTitleServiceProgressSchema.parse(input);
  if (isMockMode()) {
    const idx = mockStore.findIndex((row) => row.id === id);
    if (idx < 0) throw new Error('Không tìm thấy hồ sơ sổ đỏ');
    const now = new Date().toISOString();
    const happenedAt = parsed.happenedAt
      ? new Date(`${parsed.happenedAt}T12:00:00`).toISOString()
      : now;
    const entry = {
      id: `prg_${Date.now()}`,
      stepType: parsed.stepType,
      note: parsed.note?.trim() || null,
      happenedAt,
      employeeName: STAFF,
    };
    const current = mockStore[idx];
    const updated = refreshComputed({
      ...current,
      progress: [entry, ...current.progress],
      updatedAt: now,
    });
    mockStore = mockStore.map((row, i) => (i === idx ? updated : row));
    return updated;
  }
  return apiFetch<TitleServiceDetail>(`/title-services/${id}/progress`, {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function addTitleServiceMoney(
  id: string,
  input: AddTitleServiceMoneyInput,
): Promise<TitleServiceDetail> {
  const parsed = addTitleServiceMoneySchema.parse(input);
  if (isMockMode()) {
    const idx = mockStore.findIndex((row) => row.id === id);
    if (idx < 0) throw new Error('Không tìm thấy hồ sơ sổ đỏ');
    const now = new Date().toISOString();
    const happenedAt = parsed.happenedAt
      ? new Date(`${parsed.happenedAt}T12:00:00`).toISOString()
      : now;
    const entry = {
      id: `mon_${Date.now()}`,
      kind: parsed.kind,
      title: parsed.title.trim(),
      amountVnd: parsed.amountVnd,
      happenedAt,
      employeeName: STAFF,
    };
    const current = mockStore[idx];
    const updated = refreshComputed({
      ...current,
      moneyEntries: [entry, ...current.moneyEntries],
      updatedAt: now,
    });
    mockStore = mockStore.map((row, i) => (i === idx ? updated : row));
    return updated;
  }
  return apiFetch<TitleServiceDetail>(`/title-services/${id}/money`, {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function addTitleServiceAttachment(
  id: string,
  input: AddTitleServiceAttachmentInput,
): Promise<TitleServiceDetail> {
  const parsed = addTitleServiceAttachmentSchema.parse(input);
  if (isMockMode()) {
    const idx = mockStore.findIndex((row) => row.id === id);
    if (idx < 0) throw new Error('Không tìm thấy hồ sơ sổ đỏ');
    const now = new Date().toISOString();
    const entry = {
      id: `att_${Date.now()}`,
      kind: parsed.kind,
      fileName: parsed.fileName.trim(),
      createdAt: now,
    };
    const current = mockStore[idx];
    const updated = refreshComputed({
      ...current,
      attachments: [entry, ...current.attachments],
      updatedAt: now,
    });
    mockStore = mockStore.map((row, i) => (i === idx ? updated : row));
    return updated;
  }
  return apiFetch<TitleServiceDetail>(`/title-services/${id}/attachments`, {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function deleteTitleService(id: string): Promise<void> {
  if (isMockMode()) {
    const exists = mockStore.some((row) => row.id === id);
    if (!exists) throw new Error('Không tìm thấy hồ sơ sổ đỏ');
    mockStore = mockStore.filter((row) => row.id !== id);
    return;
  }
  await apiFetch<void>(`/title-services/${id}`, { method: 'DELETE' });
}
