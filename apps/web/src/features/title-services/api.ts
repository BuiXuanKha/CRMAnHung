import {
  addTitleServiceAttachmentSchema,
  addTitleServiceMoneySchema,
  addTitleServiceProgressSchema,
  createTitleServiceSchema,
  pinTitleServiceSchema,
  updateTitleServiceSchema,
  type AddTitleServiceAttachmentInput,
  type AddTitleServiceMoneyInput,
  type AddTitleServiceProgressInput,
  type CreateTitleServiceInput,
  type PinTitleServiceInput,
  type TitleServiceDetail,
  type TitleServiceListItem,
  type TitleServiceListQuery,
  type TitleServiceListResponse,
  type UpdateTitleServiceInput,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';

export async function listTitleServices(
  query: TitleServiceListQuery = {},
): Promise<TitleServiceListResponse> {
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.status) params.set('status', query.status);
  if (query.createdByEmployeeId) params.set('createdByEmployeeId', query.createdByEmployeeId);
  const qs = params.toString();
  return apiFetch<TitleServiceListResponse>(`/title-services${qs ? `?${qs}` : ''}`);
}

export async function createTitleService(
  input: CreateTitleServiceInput,
): Promise<TitleServiceDetail> {
  const parsed = createTitleServiceSchema.parse(input);
  return apiFetch<TitleServiceDetail>('/title-services', {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function getTitleService(id: string): Promise<TitleServiceDetail> {
  return apiFetch<TitleServiceDetail>(`/title-services/${id}`);
}

export async function updateTitleService(
  id: string,
  input: UpdateTitleServiceInput,
): Promise<TitleServiceListItem> {
  const parsed = updateTitleServiceSchema.parse(input);
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
  return apiFetch<TitleServiceDetail>(`/title-services/${id}/money`, {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function addTitleServiceAttachment(
  id: string,
  input: { kind: AddTitleServiceAttachmentInput['kind']; file: File },
): Promise<TitleServiceDetail> {
  assertTitleServiceFile(input.file);
  addTitleServiceAttachmentSchema.parse({
    kind: input.kind,
    fileName: input.file.name,
  });
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
  await apiFetch<void>(`/title-services/${id}`, { method: 'DELETE' });
}
