import {
  LodatSaleStatus,
  type LodatListItem,
  type LodatListQuery,
  type LodatListResponse,
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
