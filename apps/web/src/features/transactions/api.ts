import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  TransactionStatus,
  TransactionType,
  type TransactionListItem,
  type TransactionListQuery,
  type TransactionListResponse,
  type TransactionListStats,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';
import { isMockMode } from '@/shared/api/mode';
import { mockTransactions } from './mock-data';

let mockStore: TransactionListItem[] = structuredClone(mockTransactions);

export function statsFromItems(items: TransactionListItem[]): TransactionListStats {
  let totalRevenueVnd = 0;
  let totalCommissionVnd = 0;
  for (const item of items) {
    if (item.type !== TransactionType.OWN || item.status !== TransactionStatus.HOAN_TAT) {
      continue;
    }
    totalRevenueVnd += item.salePriceVnd ?? 0;
    totalCommissionVnd += item.commissionVnd ?? 0;
  }
  return { totalRevenueVnd, totalCommissionVnd };
}

function applyQuery(
  items: TransactionListItem[],
  query: TransactionListQuery = {},
): TransactionListItem[] {
  let next = items;
  if (query.type) {
    next = next.filter((item) => item.type === query.type);
  }
  if (query.status) {
    next = next.filter((item) => item.status === query.status);
  }
  if (query.keyword?.trim()) {
    const q = query.keyword.trim().toLowerCase();
    next = next.filter((item) => {
      const hay = [
        item.code,
        item.lodatTitle ?? '',
        item.note ?? '',
        TRANSACTION_TYPE_LABELS[item.type],
        TRANSACTION_STATUS_LABELS[item.status],
        ...item.sellerNames,
        ...item.buyerNames,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }
  return [...next].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listTransactions(
  query: TransactionListQuery = {},
): Promise<TransactionListResponse> {
  if (isMockMode()) {
    const items = applyQuery(mockStore, query);
    return { items, total: items.length, stats: statsFromItems(items) };
  }
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.type) params.set('type', query.type);
  if (query.status) params.set('status', query.status);
  const qs = params.toString();
  return apiFetch<TransactionListResponse>(`/transactions${qs ? `?${qs}` : ''}`);
}

export async function getTransaction(id: string): Promise<TransactionListItem> {
  if (isMockMode()) {
    const found = mockStore.find((item) => item.id === id);
    if (!found) {
      throw new Error('Không tìm thấy giao dịch');
    }
    return found;
  }
  return apiFetch<TransactionListItem>(`/transactions/${id}`);
}

export async function deleteTransaction(id: string): Promise<void> {
  if (isMockMode()) {
    const exists = mockStore.some((item) => item.id === id);
    if (!exists) {
      throw new Error('Không tìm thấy giao dịch');
    }
    mockStore = mockStore.filter((item) => item.id !== id);
    return;
  }
  await apiFetch<void>(`/transactions/${id}`, { method: 'DELETE' });
}
