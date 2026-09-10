import {
  changeLodatOwnerSchema,
  createLodatSchema,
  updateLodatImageRotationSchema,
  updateLodatSaleStatusSchema,
  updateLodatSchema,
  type ChangeLodatOwnerInput,
  type CreateLodatInput,
  type LodatDetail,
  type LodatListQuery,
  type LodatListResponse,
  type LodatSameWardResponse,
  type ProjectLotOptionsResponse,
  type UpdateLodatImageRotationInput,
  type UpdateLodatInput,
  type UpdateLodatSaleStatusInput,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';
import { compressImageForUpload } from '@/shared/compress-image';

export async function listLodats(query: LodatListQuery = {}): Promise<LodatListResponse> {
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.status) params.set('status', query.status);
  if (query.statusIn !== undefined) {
    params.set('statusIn', query.statusIn.join(','));
  }
  if (query.kind) params.set('kind', query.kind);
  if (query.includePaused) params.set('includePaused', 'true');
  if (query.pausedOnly) params.set('pausedOnly', 'true');
  if (query.priceBracket) params.set('priceBracket', query.priceBracket);
  if (query.areaBracket) params.set('areaBracket', query.areaBracket);
  if (query.direction) params.set('direction', query.direction);
  if (query.photo) params.set('photo', query.photo);
  if (query.addressFilter) params.set('addressFilter', query.addressFilter);
  if (query.webBody) params.set('webBody', query.webBody);
  if (query.limit != null) params.set('limit', String(query.limit));
  if (query.offset != null) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiFetch<LodatListResponse>(`/lodats${qs ? `?${qs}` : ''}`);
}

export async function getLodat(id: string): Promise<LodatDetail> {
  return apiFetch<LodatDetail>(`/lodats/${id}`);
}

export async function listSameWardLodats(id: string): Promise<LodatSameWardResponse> {
  return apiFetch<LodatSameWardResponse>(`/lodats/${id}/same-ward`);
}

export async function updateLodatSaleStatus(
  id: string,
  input: UpdateLodatSaleStatusInput,
): Promise<LodatDetail> {
  const parsed = updateLodatSaleStatusSchema.parse(input);
  return apiFetch<LodatDetail>(`/lodats/${id}/sale-status`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function changeLodatOwner(
  id: string,
  input: ChangeLodatOwnerInput,
): Promise<LodatDetail> {
  const parsed = changeLodatOwnerSchema.parse(input);
  return apiFetch<LodatDetail>(`/lodats/${id}/change-owner`, {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function updateLodat(
  id: string,
  input: UpdateLodatInput,
): Promise<LodatDetail> {
  const parsed = updateLodatSchema.parse(input);
  return apiFetch<LodatDetail>(`/lodats/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function updateLodatImageRotation(
  lodatId: string,
  imageId: string,
  input: UpdateLodatImageRotationInput,
): Promise<LodatDetail> {
  const parsed = updateLodatImageRotationSchema.parse(input);
  return apiFetch<LodatDetail>(`/lodats/${lodatId}/images/${imageId}/rotation`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function uploadLodatImage(
  lodatId: string,
  file: File,
): Promise<LodatDetail> {
  const prepared = await compressImageForUpload(file);
  const body = new FormData();
  body.append('file', prepared);
  return apiFetch<LodatDetail>(`/lodats/${lodatId}/images`, {
    method: 'POST',
    body,
  });
}

export async function deleteLodatImage(
  lodatId: string,
  imageId: string,
): Promise<LodatDetail> {
  return apiFetch<LodatDetail>(`/lodats/${lodatId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

/** Kho lô của địa chỉ PROJECT — picker form tạo lô (§12.5). */
export async function listProjectLotOptions(
  addressId: string,
): Promise<ProjectLotOptionsResponse> {
  const params = new URLSearchParams({ addressId });
  return apiFetch<ProjectLotOptionsResponse>(`/lodats/project-lots?${params}`);
}

/** Tạo lô từ khách (§12.5) — dân hoặc dự án + map chủ active. */
export async function createLodat(input: CreateLodatInput): Promise<LodatDetail> {
  const parsed = createLodatSchema.parse(input);
  return apiFetch<LodatDetail>('/lodats', {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export function formatPriceInput(value: number | string | null | undefined): string {
  if (value == null || value === '') return '';
  const digits = String(value).replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parsePriceInput(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}
