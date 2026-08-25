import {
  LODAT_KIND_LABELS,
  LodatKind,
  LodatSaleStatus,
  createLodatSchema,
  updateLodatImageRotationSchema,
  updateLodatSaleStatusSchema,
  updateLodatSchema,
  type CreateLodatInput,
  type LodatDetail,
  type LodatImage,
  type LodatListItem,
  type LodatListQuery,
  type LodatListResponse,
  type LodatSameWardResponse,
  type ProjectLotOptionsResponse,
  type UpdateLodatImageRotationInput,
  type UpdateLodatInput,
  type UpdateLodatSaleStatusInput,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';
import { isMockLodats } from '@/shared/api/mode';
import {
  applyExtraFilters,
  applyPriceBracket,
  type ExtraFilters,
} from './display';
import { mockLodats } from './mock-data';

let mockStore: LodatListItem[] = structuredClone(mockLodats);
const mockRotations = new Map<string, number>();
const mockExtras = new Map<
  string,
  Partial<Pick<LodatDetail, 'note' | 'mapNote' | 'addressId' | 'images'>>
>();

const MOCK_IMAGE_POOL = [
  '/mock/lodats/p1.svg',
  '/mock/lodats/p2.svg',
  '/mock/lodats/p3.svg',
  '/mock/lodats/p4.svg',
  '/mock/lodats/p5.svg',
  '/mock/lodats/p6.svg',
];

function mockImages(item: LodatListItem): LodatImage[] {
  const extras = mockExtras.get(item.id);
  if (extras?.images?.length) return extras.images;
  const cover = item.coverImageUrl;
  if (!cover) return [];
  const extra = Math.max(0, item.extraPhotoCount ?? 0);
  const urls = [cover];
  for (let i = 0; i < extra; i += 1) {
    const next = MOCK_IMAGE_POOL[(MOCK_IMAGE_POOL.indexOf(cover) + i + 1) % MOCK_IMAGE_POOL.length];
    if (next && !urls.includes(next)) urls.push(next);
  }
  return urls.map((url, i) => {
    const id = `mock-img-${item.id}-${i}`;
    return {
      id,
      url,
      rotationDeg: mockRotations.get(id) ?? 0,
      source: 'lodat' as const,
    };
  });
}

function toDetail(item: LodatListItem): LodatDetail {
  const images = mockImages(item);
  const isProject = Boolean(item.projectLotId);
  const extras = mockExtras.get(item.id);
  return {
    ...item,
    note: extras?.note ?? null,
    mapNote: extras?.mapNote ?? null,
    addressId: extras?.addressId ?? (isProject ? null : `addr-${item.id}`),
    images,
    imageUrls: images.map((i) => i.url),
    wardName: item.address?.includes('An Đồng')
      ? 'An Đồng'
      : item.address?.includes('Hồng Phong')
        ? 'Hồng Phong'
        : 'An Đồng',
    owner: item.customerHint
      ? { customerId: 'mock', fullName: item.customerHint, phones: [] }
      : null,
    canEditSpecs: !isProject,
    canEditMap: true,
    canEditImages: !isProject,
  };
}

function applyQuery(items: LodatListItem[], query: LodatListQuery = {}): LodatListItem[] {
  let next = items;
  if (query.pausedOnly) {
    next = next.filter((p) => p.status === LodatSaleStatus.TAM_DUNG);
  } else if (!query.includePaused && query.status !== LodatSaleStatus.TAM_DUNG) {
    next = next.filter((p) => p.status !== LodatSaleStatus.TAM_DUNG);
  }
  if (query.status) {
    next = next.filter((p) => p.status === query.status);
  }
  if (query.kind) {
    next = next.filter((p) => p.kind === query.kind);
  }
  if (query.keyword?.trim()) {
    const q = query.keyword.trim().toLowerCase();
    next = next.filter((p) => {
      const hay = [
        p.title,
        p.address ?? '',
        p.customerHint ?? '',
        p.direction ?? '',
        LODAT_KIND_LABELS[p.kind],
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }
  const extra: ExtraFilters = {
    photo: query.photo ?? 'all',
    address: query.addressFilter ?? 'all',
    area: query.areaBracket ?? 'all',
    direction: (query.direction?.trim() || 'all') as ExtraFilters['direction'],
  };
  next = applyExtraFilters(next, extra);
  if (query.priceBracket) {
    next = applyPriceBracket(next, query.priceBracket);
  }
  return [...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listLodats(query: LodatListQuery = {}): Promise<LodatListResponse> {
  if (isMockLodats()) {
    const all = applyQuery(mockStore, query);
    const offset = Math.max(0, query.offset ?? 0);
    const items = query.limit != null ? all.slice(offset, offset + query.limit) : all;
    return { items, total: all.length };
  }
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.status) params.set('status', query.status);
  if (query.kind) params.set('kind', query.kind);
  if (query.includePaused) params.set('includePaused', 'true');
  if (query.pausedOnly) params.set('pausedOnly', 'true');
  if (query.priceBracket) params.set('priceBracket', query.priceBracket);
  if (query.areaBracket) params.set('areaBracket', query.areaBracket);
  if (query.direction) params.set('direction', query.direction);
  if (query.photo) params.set('photo', query.photo);
  if (query.addressFilter) params.set('addressFilter', query.addressFilter);
  if (query.limit != null) params.set('limit', String(query.limit));
  if (query.offset != null) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiFetch<LodatListResponse>(`/lodats${qs ? `?${qs}` : ''}`);
}

export async function getLodat(id: string): Promise<LodatDetail> {
  if (isMockLodats()) {
    const found = mockStore.find((p) => p.id === id);
    if (!found) {
      throw new Error('Không tìm thấy lô đất');
    }
    return toDetail(found);
  }
  return apiFetch<LodatDetail>(`/lodats/${id}`);
}

export async function listSameWardLodats(id: string): Promise<LodatSameWardResponse> {
  if (isMockLodats()) {
    const current = mockStore.find((p) => p.id === id);
    if (!current) throw new Error('Không tìm thấy lô đất');
    const detail = toDetail(current);
    const ward = detail.wardName;
    const items = mockStore.filter((p) => {
      if (p.id === id) return false;
      return toDetail(p).wardName === ward;
    });
    return { wardName: ward ?? null, items, total: items.length };
  }
  return apiFetch<LodatSameWardResponse>(`/lodats/${id}/same-ward`);
}

export async function updateLodatSaleStatus(
  id: string,
  input: UpdateLodatSaleStatusInput,
): Promise<LodatDetail> {
  const parsed = updateLodatSaleStatusSchema.parse(input);
  if (isMockLodats()) {
    const idx = mockStore.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Không tìm thấy lô đất');
    const current = mockStore[idx];
    const updated: LodatListItem = {
      ...current,
      status: parsed.status,
      updatedAt: new Date().toISOString(),
    };
    mockStore = mockStore.map((p, i) => (i === idx ? updated : p));
    return toDetail(updated);
  }
  return apiFetch<LodatDetail>(`/lodats/${id}/sale-status`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function updateLodat(
  id: string,
  input: UpdateLodatInput,
): Promise<LodatDetail> {
  const parsed = updateLodatSchema.parse(input);
  if (isMockLodats()) {
    const idx = mockStore.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Không tìm thấy lô đất');
    const current = mockStore[idx];
    const isProject = Boolean(current.projectLotId);
    const next: LodatListItem = {
      ...current,
      title: !isProject && parsed.title !== undefined ? parsed.title : current.title,
      areaM2:
        !isProject && parsed.areaM2 !== undefined ? parsed.areaM2 : current.areaM2,
      frontageM:
        !isProject && parsed.frontageM !== undefined
          ? parsed.frontageM
          : current.frontageM,
      direction:
        !isProject && parsed.direction !== undefined
          ? parsed.direction
          : current.direction,
      kind: !isProject && parsed.kind !== undefined ? parsed.kind : current.kind,
      priceVnd: parsed.priceVnd !== undefined ? parsed.priceVnd : current.priceVnd,
      priceNote:
        parsed.priceNote !== undefined ? parsed.priceNote : current.priceNote,
      brokerFeeNote:
        parsed.brokerFeeNote !== undefined
          ? parsed.brokerFeeNote
          : current.brokerFeeNote,
      status: parsed.status !== undefined ? parsed.status : current.status,
      updatedAt: new Date().toISOString(),
    };
    mockStore = mockStore.map((p, i) => (i === idx ? next : p));
    const prev = mockExtras.get(id) ?? {};
    mockExtras.set(id, {
      ...prev,
      note:
        !isProject && parsed.note !== undefined ? parsed.note : (prev.note ?? null),
      mapNote:
        parsed.mapNote !== undefined ? parsed.mapNote : (prev.mapNote ?? null),
      addressId:
        !isProject && parsed.addressId !== undefined
          ? parsed.addressId
          : (prev.addressId ?? `addr-${id}`),
    });
    return toDetail(next);
  }
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
  if (isMockLodats()) {
    const found = mockStore.find((p) => p.id === lodatId);
    if (!found) throw new Error('Không tìm thấy lô đất');
    mockRotations.set(imageId, ((parsed.rotationDeg % 360) + 360) % 360);
    return toDetail(found);
  }
  return apiFetch<LodatDetail>(`/lodats/${lodatId}/images/${imageId}/rotation`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function uploadLodatImage(
  lodatId: string,
  file: File,
): Promise<LodatDetail> {
  if (isMockLodats()) {
    const found = mockStore.find((p) => p.id === lodatId);
    if (!found) throw new Error('Không tìm thấy lô đất');
    if (found.projectLotId) throw new Error('Không thêm ảnh lô dự án tại đây.');
    const detail = toDetail(found);
    const lodatImgs = detail.images.filter((i) => i.source === 'lodat');
    if (lodatImgs.length >= 5) throw new Error('Tối đa 5 ảnh lô đất.');
    const id = `mock-img-${lodatId}-${Date.now()}`;
    const url = URL.createObjectURL(file);
    const images = [
      ...detail.images,
      { id, url, rotationDeg: 0, source: 'lodat' as const },
    ];
    mockExtras.set(lodatId, { ...(mockExtras.get(lodatId) ?? {}), images });
    return toDetail(found);
  }
  const body = new FormData();
  body.append('file', file);
  return apiFetch<LodatDetail>(`/lodats/${lodatId}/images`, {
    method: 'POST',
    body,
  });
}

export async function deleteLodatImage(
  lodatId: string,
  imageId: string,
): Promise<LodatDetail> {
  if (isMockLodats()) {
    const found = mockStore.find((p) => p.id === lodatId);
    if (!found) throw new Error('Không tìm thấy lô đất');
    const detail = toDetail(found);
    const images = detail.images.filter((i) => i.id !== imageId);
    mockExtras.set(lodatId, { ...(mockExtras.get(lodatId) ?? {}), images });
    return toDetail(found);
  }
  return apiFetch<LodatDetail>(`/lodats/${lodatId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

/** Kho lô của địa chỉ PROJECT — picker form tạo lô (§12.5). */
export async function listProjectLotOptions(
  addressId: string,
): Promise<ProjectLotOptionsResponse> {
  if (isMockLodats()) {
    return {
      addressId,
      items: [
        { id: 'plot-lk12', title: 'LK12', areaM2: 82, frontageM: 5, direction: 'Đông Nam', note: null, takenByMe: false },
        { id: 'plot-lk13', title: 'LK13', areaM2: 90, frontageM: 5, direction: 'Nam', note: null, takenByMe: true },
      ],
    };
  }
  const params = new URLSearchParams({ addressId });
  return apiFetch<ProjectLotOptionsResponse>(`/lodats/project-lots?${params}`);
}

/** Tạo lô từ khách (§12.5) — dân hoặc dự án + map chủ active. */
export async function createLodat(input: CreateLodatInput): Promise<LodatDetail> {
  const parsed = createLodatSchema.parse(input);
  if (isMockLodats()) {
    const id = `lodat-${Date.now()}`;
    const item: LodatListItem = {
      id,
      title: parsed.title?.trim() || 'LK12',
      address: null,
      areaM2: parsed.areaM2 ?? null,
      frontageM: parsed.frontageM ?? null,
      direction: parsed.direction ?? null,
      priceVnd: parsed.priceVnd ?? null,
      priceNote: parsed.priceNote ?? null,
      brokerFeeNote: parsed.brokerFeeNote ?? null,
      commissionPercent: null,
      kind: parsed.kind ?? LodatKind.DAT,
      status: parsed.status ?? LodatSaleStatus.DANG_BAN,
      coverImageUrl: null,
      extraPhotoCount: 0,
      customerHint: null,
      projectLotId: parsed.projectLotId ?? null,
      updatedAt: new Date().toISOString(),
    };
    mockStore = [item, ...mockStore];
    return toDetail(item);
  }
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

export { LodatKind, LodatSaleStatus };
