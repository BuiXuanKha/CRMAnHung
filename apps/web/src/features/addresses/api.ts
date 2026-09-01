import {
  formatAddressLabel,
  type AddressListItem,
  type AddressListQuery,
  type AddressListResponse,
  type AdminUnitItem,
  type AdminUnitListResponse,
  type CreateAddressInput,
  type CreateAdminUnitInput,
  type UpdateAddressInput,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';

export async function listProvinces(includeHidden = false): Promise<AdminUnitListResponse> {
  const qs = includeHidden ? '?includeHidden=1' : '';
  return apiFetch<AdminUnitListResponse>(`/admin-units/provinces${qs}`);
}

export async function createProvince(input: CreateAdminUnitInput): Promise<{ item: AdminUnitItem }> {
  return apiFetch('/admin-units/provinces', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listDistricts(
  provinceId: string,
  includeHidden = false,
): Promise<AdminUnitListResponse> {
  const params = new URLSearchParams({ parentId: provinceId });
  if (includeHidden) params.set('includeHidden', '1');
  return apiFetch<AdminUnitListResponse>(`/admin-units/districts?${params}`);
}

export async function createDistrict(
  provinceId: string,
  name: string,
): Promise<{ item: AdminUnitItem }> {
  return apiFetch('/admin-units/districts', {
    method: 'POST',
    body: JSON.stringify({ name, parentId: provinceId }),
  });
}

export async function listWards(
  districtId: string,
  includeHidden = false,
): Promise<AdminUnitListResponse> {
  const params = new URLSearchParams({ parentId: districtId });
  if (includeHidden) params.set('includeHidden', '1');
  return apiFetch<AdminUnitListResponse>(`/admin-units/wards?${params}`);
}

export async function createWard(
  districtId: string,
  name: string,
): Promise<{ item: AdminUnitItem }> {
  return apiFetch('/admin-units/wards', {
    method: 'POST',
    body: JSON.stringify({ name, parentId: districtId }),
  });
}

export async function listAddresses(
  query: AddressListQuery = {},
): Promise<AddressListResponse> {
  const params = new URLSearchParams();
  if (query.keyword?.trim()) params.set('keyword', query.keyword.trim());
  if (query.kind) params.set('kind', query.kind);
  if (query.includeHidden) params.set('includeHidden', '1');
  const qs = params.toString();
  return apiFetch<AddressListResponse>(`/addresses${qs ? `?${qs}` : ''}`);
}

export async function createAddress(
  input: CreateAddressInput,
): Promise<{ item: AddressListItem }> {
  return apiFetch('/addresses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAddress(
  id: string,
  input: UpdateAddressInput,
): Promise<{ item: AddressListItem }> {
  return apiFetch(`/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function hideAddress(id: string): Promise<{ item: AddressListItem }> {
  return apiFetch(`/addresses/${id}`, { method: 'DELETE' });
}

export { formatAddressLabel };
