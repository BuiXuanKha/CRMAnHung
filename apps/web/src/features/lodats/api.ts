import {
  LodatSaleStatus,
  updateLodatSaleStatusSchema,
  type LodatListItem,
  type LodatListQuery,
  type LodatListResponse,
  type UpdateLodatSaleStatusInput,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';
import { isMockMode } from '@/shared/api/mode';
import { mockLodats } from './mock-data';

let mockStore: LodatListItem[] = structuredClone(mockLodats);

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
  if (query.keyword?.trim()) {
    const q = query.keyword.trim().toLowerCase();
    next = next.filter((p) => {
      const hay = [p.title, p.address ?? '', p.customerHint ?? '', p.direction ?? '']
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }
  return [...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listLodats(query: LodatListQuery = {}): Promise<LodatListResponse> {
  if (isMockMode()) {
    const items = applyQuery(mockStore, query);
    return { items, total: items.length };
  }
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.status) params.set('status', query.status);
  if (query.includePaused) params.set('includePaused', 'true');
  if (query.pausedOnly) params.set('pausedOnly', 'true');
  const qs = params.toString();
  return apiFetch<LodatListResponse>(`/lodats${qs ? `?${qs}` : ''}`);
}

export async function getLodat(id: string): Promise<LodatListItem> {
  if (isMockMode()) {
    const found = mockStore.find((p) => p.id === id);
    if (!found) {
      throw new Error('Không tìm thấy lô đất');
    }
    return found;
  }
  return apiFetch<LodatListItem>(`/lodats/${id}`);
}

export async function updateLodatSaleStatus(
  id: string,
  input: UpdateLodatSaleStatusInput,
): Promise<LodatListItem> {
  const parsed = updateLodatSaleStatusSchema.parse(input);
  if (isMockMode()) {
    const idx = mockStore.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Không tìm thấy lô đất');
    const current = mockStore[idx];
    if (
      current.status !== LodatSaleStatus.DANG_BAN &&
      current.status !== LodatSaleStatus.TAM_DUNG
    ) {
      throw new Error('Chỉ chuyển Mở bán hoặc Tạm dừng trên lô đang bán / tạm dừng.');
    }
    const updated: LodatListItem = {
      ...current,
      status: parsed.status,
      updatedAt: new Date().toISOString(),
    };
    mockStore = mockStore.map((p, i) => (i === idx ? updated : p));
    return updated;
  }
  return apiFetch<LodatListItem>(`/lodats/${id}/sale-status`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}
