import {
  createTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type OpenTransactionResponse,
  type TransactionDetail,
  type TransactionListItem,
  type TransactionListQuery,
  type TransactionListResponse,
  type TransactionListStats,
  type UpdateTransactionInput,
  TransactionStatus,
  TransactionType,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';

export function statsFromItems(items: TransactionListItem[]): TransactionListStats {
  let totalRevenueVnd = 0;
  let totalCommissionVnd = 0;
  for (const item of items) {
    if (item.type !== TransactionType.OWN || item.status !== TransactionStatus.HOAN_TAT) {
      continue;
    }
    const sale =
      typeof item.salePriceVnd === 'string' ? Number(item.salePriceVnd) : item.salePriceVnd;
    const commission =
      typeof item.commissionVnd === 'string' ? Number(item.commissionVnd) : item.commissionVnd;
    if (typeof sale === 'number' && Number.isFinite(sale)) totalRevenueVnd += sale;
    if (typeof commission === 'number' && Number.isFinite(commission)) {
      totalCommissionVnd += commission;
    }
  }
  return { totalRevenueVnd, totalCommissionVnd };
}

export async function listTransactions(
  query: TransactionListQuery = {},
): Promise<TransactionListResponse> {
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.type) params.set('type', query.type);
  if (query.status) params.set('status', query.status);
  if (query.createdByEmployeeId) params.set('createdByEmployeeId', query.createdByEmployeeId);
  const qs = params.toString();
  return apiFetch<TransactionListResponse>(`/transactions${qs ? `?${qs}` : ''}`);
}

export async function getTransaction(id: string): Promise<TransactionDetail> {
  return apiFetch<TransactionDetail>(`/transactions/${id}`);
}

export async function getOpenTransaction(lodatId: string): Promise<OpenTransactionResponse> {
  return apiFetch<OpenTransactionResponse>(`/transactions/lodat/${lodatId}/open`);
}

export async function createTransaction(input: CreateTransactionInput): Promise<TransactionDetail> {
  const parsed = createTransactionSchema.parse(input);
  return apiFetch<TransactionDetail>('/transactions', {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<TransactionDetail> {
  const parsed = updateTransactionSchema.parse(input);
  return apiFetch<TransactionDetail>(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiFetch<void>(`/transactions/${id}`, { method: 'DELETE' });
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
