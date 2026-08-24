import {
  ADDRESS_KIND_LABELS,
  AddressKind,
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
import { isMockMode } from '@/shared/api/mode';
import {
  mockAddresses,
  mockDistricts,
  mockProvinces,
  mockWards,
  nextMockId,
} from './mock-data';

let addressStore: AddressListItem[] = structuredClone(mockAddresses);
let provinceStore = structuredClone(mockProvinces);
let districtStore = structuredClone(mockDistricts);
let wardStore = structuredClone(mockWards);

export async function listProvinces(includeHidden = false): Promise<AdminUnitListResponse> {
  if (isMockMode()) {
    return {
      items: provinceStore.filter((p) => includeHidden || !p.isHidden),
    };
  }
  const qs = includeHidden ? '?includeHidden=1' : '';
  return apiFetch<AdminUnitListResponse>(`/admin-units/provinces${qs}`);
}

export async function createProvince(input: CreateAdminUnitInput): Promise<{ item: AdminUnitItem }> {
  if (isMockMode()) {
    const item: AdminUnitItem = {
      id: nextMockId('prov'),
      name: input.name.trim(),
      parentId: null,
      isHidden: false,
    };
    provinceStore = [...provinceStore, item];
    return { item };
  }
  return apiFetch('/admin-units/provinces', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listDistricts(
  provinceId: string,
  includeHidden = false,
): Promise<AdminUnitListResponse> {
  if (isMockMode()) {
    return {
      items: districtStore.filter(
        (d) => d.parentId === provinceId && (includeHidden || !d.isHidden),
      ),
    };
  }
  const params = new URLSearchParams({ parentId: provinceId });
  if (includeHidden) params.set('includeHidden', '1');
  return apiFetch<AdminUnitListResponse>(`/admin-units/districts?${params}`);
}

export async function createDistrict(
  provinceId: string,
  name: string,
): Promise<{ item: AdminUnitItem }> {
  if (isMockMode()) {
    const item: AdminUnitItem = {
      id: nextMockId('dist'),
      name: name.trim(),
      parentId: provinceId,
      isHidden: false,
    };
    districtStore = [...districtStore, item];
    return { item };
  }
  return apiFetch('/admin-units/districts', {
    method: 'POST',
    body: JSON.stringify({ name, parentId: provinceId }),
  });
}

export async function listWards(
  districtId: string,
  includeHidden = false,
): Promise<AdminUnitListResponse> {
  if (isMockMode()) {
    return {
      items: wardStore.filter(
        (w) => w.parentId === districtId && (includeHidden || !w.isHidden),
      ),
    };
  }
  const params = new URLSearchParams({ parentId: districtId });
  if (includeHidden) params.set('includeHidden', '1');
  return apiFetch<AdminUnitListResponse>(`/admin-units/wards?${params}`);
}

export async function createWard(
  districtId: string,
  name: string,
): Promise<{ item: AdminUnitItem }> {
  if (isMockMode()) {
    const item: AdminUnitItem = {
      id: nextMockId('ward'),
      name: name.trim(),
      parentId: districtId,
      isHidden: false,
    };
    wardStore = [...wardStore, item];
    return { item };
  }
  return apiFetch('/admin-units/wards', {
    method: 'POST',
    body: JSON.stringify({ name, parentId: districtId }),
  });
}

export async function listAddresses(
  query: AddressListQuery = {},
): Promise<AddressListResponse> {
  if (isMockMode()) {
    let items = addressStore.slice();
    if (!query.includeHidden) items = items.filter((a) => !a.isHidden);
    if (query.kind) items = items.filter((a) => a.kind === query.kind);
    if (query.keyword?.trim()) {
      const q = query.keyword.trim().toLowerCase();
      items = items.filter((a) => {
        const hay = [
          a.detail ?? '',
          a.description ?? '',
          a.province ?? '',
          a.district ?? '',
          a.ward ?? '',
          ADDRESS_KIND_LABELS[a.kind],
          formatAddressLabel(a),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return { items, total: items.length };
  }
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
  if (isMockMode()) {
    const ward = wardStore.find((w) => w.id === input.wardId);
    const district = ward
      ? districtStore.find((d) => d.id === ward.parentId)
      : undefined;
    const province = district
      ? provinceStore.find((p) => p.id === district.parentId)
      : undefined;
    if (!ward || !district || !province) {
      throw new Error('Xã đã chọn không tồn tại.');
    }
    if (input.kind === AddressKind.PROJECT && !String(input.detail || '').trim()) {
      throw new Error('Nhập Tên dự án.');
    }
    const now = new Date().toISOString();
    const item: AddressListItem = {
      id: nextMockId('addr'),
      kind: input.kind,
      detail: String(input.detail || '').trim() || null,
      description: String(input.description || '').trim() || null,
      provinceId: province.id,
      districtId: district.id,
      wardId: ward.id,
      province: province.name,
      district: district.name,
      ward: ward.name,
      isHidden: false,
      lodatCount: 0,
      imageCount: 0,
      coverImageUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    addressStore = [item, ...addressStore];
    return { item };
  }
  return apiFetch('/addresses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAddress(
  id: string,
  input: UpdateAddressInput,
): Promise<{ item: AddressListItem }> {
  if (isMockMode()) {
    const idx = addressStore.findIndex((a) => a.id === id);
    if (idx < 0) throw new Error('Không tìm thấy địa chỉ.');
    const prev = addressStore[idx];
    let provinceId = prev.provinceId;
    let districtId = prev.districtId;
    let wardId = prev.wardId;
    let province = prev.province;
    let district = prev.district;
    let ward = prev.ward;
    if (input.wardId) {
      const w = wardStore.find((x) => x.id === input.wardId);
      const d = w ? districtStore.find((x) => x.id === w.parentId) : undefined;
      const p = d ? provinceStore.find((x) => x.id === d.parentId) : undefined;
      if (!w || !d || !p) throw new Error('Xã đã chọn không tồn tại.');
      wardId = w.id;
      districtId = d.id;
      provinceId = p.id;
      ward = w.name;
      district = d.name;
      province = p.name;
    }
    const kind = input.kind ?? prev.kind;
    const detail =
      input.detail !== undefined
        ? String(input.detail || '').trim() || null
        : prev.detail;
    if (kind === AddressKind.PROJECT && !detail) {
      throw new Error('Nhập Tên dự án.');
    }
    const item: AddressListItem = {
      ...prev,
      kind,
      detail,
      description:
        input.description !== undefined
          ? String(input.description || '').trim() || null
          : prev.description,
      provinceId,
      districtId,
      wardId,
      province,
      district,
      ward,
      isHidden: input.isHidden ?? prev.isHidden,
      updatedAt: new Date().toISOString(),
    };
    addressStore = addressStore.map((a, i) => (i === idx ? item : a));
    return { item };
  }
  return apiFetch(`/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function hideAddress(id: string): Promise<{ item: AddressListItem }> {
  if (isMockMode()) {
    return updateAddress(id, { isHidden: true });
  }
  return apiFetch(`/addresses/${id}`, { method: 'DELETE' });
}

export { formatAddressLabel };
