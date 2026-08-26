import {
  addTitleServiceAttachmentSchema,
  addTitleServiceMoneySchema,
  addTitleServiceProgressSchema,
  pinTitleServiceSchema,
  updateTitleServiceSchema,
  type AddTitleServiceAttachmentInput,
  type AddTitleServiceMoneyInput,
  type AddTitleServiceProgressInput,
  type PinTitleServiceInput,
  type TitleServiceDetail,
  type TitleServiceListItem,
  type TitleServiceListQuery,
  type TitleServiceListResponse,
  type UpdateTitleServiceInput,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';
import { isMockTitleServices } from '@/shared/api/mode';
import { computeDaysWorking, sumVnd } from './display';
import { mockTitleServices } from './mock-data';

const STAFF = 'Bùi Xuân Khả';
const STAFF_ID = 'emp_kha';

let mockStore: TitleServiceDetail[] = structuredClone(mockTitleServices);

function refreshComputed(row: TitleServiceDetail): TitleServiceDetail {
  const progress = [...row.progress].sort((a, b) => b.happenedAt.localeCompare(a.happenedAt));
  const thu = sumVnd(row.moneyEntries.filter((e) => e.kind === 'THU').map((e) => e.amountVnd));
  const chi = sumVnd(row.moneyEntries.filter((e) => e.kind === 'CHI').map((e) => e.amountVnd));
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
    pinnedAt: computed.pinnedAt,
    startedAt: computed.startedAt,
    expectedDoneAt: computed.expectedDoneAt,
    completedAt: computed.completedAt,
    createdByEmployeeId: computed.createdByEmployeeId,
    createdByName: computed.createdByName,
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
  if (query.createdByEmployeeId) {
    next = next.filter((row) => row.createdByEmployeeId === query.createdByEmployeeId);
  }
  if (query.keyword?.trim()) {
    const q = query.keyword.trim().toLowerCase();
    next = next.filter((row) => {
      const hay = [row.code, row.customerName, row.primaryPhone ?? ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }
  return [...next].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const pinA = a.pinnedAt ?? '';
    const pinB = b.pinnedAt ?? '';
    if (pinA !== pinB) return pinB.localeCompare(pinA);
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export async function listTitleServices(
  query: TitleServiceListQuery = {},
): Promise<TitleServiceListResponse> {
  if (isMockTitleServices()) {
    const items = applyQuery(mockStore, query).map(toListItem);
    return { items, total: items.length };
  }
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.status) params.set('status', query.status);
  if (query.createdByEmployeeId) params.set('createdByEmployeeId', query.createdByEmployeeId);
  const qs = params.toString();
  return apiFetch<TitleServiceListResponse>(`/title-services${qs ? `?${qs}` : ''}`);
}

export async function getTitleService(id: string): Promise<TitleServiceDetail> {
  if (isMockTitleServices()) {
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
  if (isMockTitleServices()) {
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
      expectedDoneAt:
        parsed.expectedDoneAt !== undefined ? parsed.expectedDoneAt : current.expectedDoneAt,
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

export async function pinTitleService(
  id: string,
  input: PinTitleServiceInput,
): Promise<TitleServiceListItem> {
  const parsed = pinTitleServiceSchema.parse(input);
  if (isMockTitleServices()) {
    const idx = mockStore.findIndex((row) => row.id === id);
    if (idx < 0) throw new Error('Không tìm thấy hồ sơ sổ đỏ');
    const now = new Date().toISOString();
    const current = mockStore[idx];
    const updated = refreshComputed({
      ...current,
      isPinned: parsed.pinned,
      pinnedAt: parsed.pinned ? (current.pinnedAt ?? now) : null,
      updatedAt: now,
    });
    mockStore = mockStore.map((row, i) => (i === idx ? updated : row));
    return toListItem(updated);
  }
  return apiFetch<TitleServiceListItem>(`/title-services/${id}/pin`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function addTitleServiceProgress(
  id: string,
  input: AddTitleServiceProgressInput,
): Promise<TitleServiceDetail> {
  const parsed = addTitleServiceProgressSchema.parse(input);
  if (isMockTitleServices()) {
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
      createdByEmployeeId: STAFF_ID,
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
  if (isMockTitleServices()) {
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
      note: parsed.note?.trim() || null,
      createdByEmployeeId: STAFF_ID,
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
  input: { kind: AddTitleServiceAttachmentInput['kind']; file: File },
): Promise<TitleServiceDetail> {
  if (isMockTitleServices()) {
    const parsed = addTitleServiceAttachmentSchema.parse({
      kind: input.kind,
      fileName: input.file.name,
    });
    const idx = mockStore.findIndex((row) => row.id === id);
    if (idx < 0) throw new Error('Không tìm thấy hồ sơ sổ đỏ');
    const now = new Date().toISOString();
    const entry = {
      id: `att_${Date.now()}`,
      kind: parsed.kind,
      fileName: parsed.fileName.trim(),
      createdAt: now,
      createdByEmployeeId: STAFF_ID,
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
  assertTitleServiceFile(input.file);
  const body = new FormData();
  body.append('kind', input.kind);
  body.append('file', input.file);
  return apiFetch<TitleServiceDetail>(`/title-services/${id}/attachments`, {
    method: 'POST',
    body,
  });
}

export async function getTitleServiceAttachmentUrl(
  id: string,
  attachmentId: string,
): Promise<{ url: string; expiresAt: string }> {
  if (isMockTitleServices()) {
    throw new Error('Tài liệu mock không mở được file thật.');
  }
  return apiFetch<{ url: string; expiresAt: string }>(
    `/title-services/${id}/attachments/${attachmentId}/url`,
  );
}

const TITLE_FILE_MAX_BYTES = 12 * 1024 * 1024;
const TITLE_FILE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export function assertTitleServiceFile(file: File) {
  if (!file.size) throw new Error('Thiếu file tài liệu.');
  if (file.size > TITLE_FILE_MAX_BYTES) throw new Error('File tối đa 12 MB.');
  const mime = (file.type || '').toLowerCase();
  if (!TITLE_FILE_MIMES.has(mime)) {
    throw new Error('Chỉ nhận ảnh (JPEG/PNG/WebP/GIF) hoặc PDF.');
  }
}

export async function deleteTitleService(id: string): Promise<void> {
  if (isMockTitleServices()) {
    const exists = mockStore.some((row) => row.id === id);
    if (!exists) throw new Error('Không tìm thấy hồ sơ sổ đỏ');
    mockStore = mockStore.filter((row) => row.id !== id);
    return;
  }
  await apiFetch<void>(`/title-services/${id}`, { method: 'DELETE' });
}
