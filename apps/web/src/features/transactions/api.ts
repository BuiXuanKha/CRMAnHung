import {
  OPEN_TRANSACTION_EXISTS_CODE,
  TRANSACTION_OPEN_STATUSES,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  TransactionPartyRole,
  TransactionStatus,
  TransactionType,
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
} from '@crmanhung/shared';
import { ApiError, apiFetch } from '@/shared/api/client';
import { isMockMode } from '@/shared/api/mode';
import { mockLodats } from '@/features/lodats/mock-data';
import { mockTransactionDetails, toTransactionListItem } from './mock-data';

let mockStore: TransactionDetail[] = structuredClone(mockTransactionDetails);

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

function listItems(): TransactionListItem[] {
  return mockStore.map(toTransactionListItem);
}

function isOpenStatus(status: TransactionStatus): boolean {
  return (TRANSACTION_OPEN_STATUSES as readonly TransactionStatus[]).includes(status);
}

function nextCode(): string {
  const year = new Date().getFullYear();
  let max = 0;
  for (const row of mockStore) {
    const m = row.code.match(/^GD-(\d{4})-(\d+)$/);
    if (!m || Number(m[1]) !== year) continue;
    max = Math.max(max, Number(m[2]));
  }
  return `GD-${year}-${String(max + 1).padStart(4, '0')}`;
}

function partiesFromInput(
  idPrefix: string,
  sellers: CreateTransactionInput['sellers'],
  buyers: CreateTransactionInput['buyers'],
) {
  return [
    ...sellers.map((p, i) => ({
      id: `${idPrefix}_s${i}`,
      role: TransactionPartyRole.SELLER,
      customerId: p.customerId ?? null,
      freeTextName: p.freeTextName,
      sortOrder: p.sortOrder ?? i,
    })),
    ...buyers.map((p, i) => ({
      id: `${idPrefix}_b${i}`,
      role: TransactionPartyRole.BUYER,
      customerId: p.customerId ?? null,
      freeTextName: p.freeTextName,
      sortOrder: p.sortOrder ?? i,
    })),
  ];
}

function namesOf(detail: TransactionDetail, role: TransactionPartyRole): string[] {
  return detail.parties
    .filter((p) => p.role === role)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => p.freeTextName);
}

export async function listTransactions(
  query: TransactionListQuery = {},
): Promise<TransactionListResponse> {
  if (isMockMode()) {
    const items = applyQuery(listItems(), query);
    return { items, total: items.length, stats: statsFromItems(items) };
  }
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.type) params.set('type', query.type);
  if (query.status) params.set('status', query.status);
  const qs = params.toString();
  return apiFetch<TransactionListResponse>(`/transactions${qs ? `?${qs}` : ''}`);
}

export async function getTransaction(id: string): Promise<TransactionDetail> {
  if (isMockMode()) {
    const found = mockStore.find((item) => item.id === id);
    if (!found) {
      throw new Error('Không tìm thấy giao dịch');
    }
    return structuredClone(found);
  }
  return apiFetch<TransactionDetail>(`/transactions/${id}`);
}

export async function getOpenTransaction(lodatId: string): Promise<OpenTransactionResponse> {
  if (isMockMode()) {
    const found = mockStore.find(
      (item) => item.lodatId === lodatId && isOpenStatus(item.status),
    );
    return { id: found?.id ?? null };
  }
  return apiFetch<OpenTransactionResponse>(`/transactions/lodat/${lodatId}/open`);
}

export async function createTransaction(input: CreateTransactionInput): Promise<TransactionDetail> {
  const parsed = createTransactionSchema.parse(input);
  if (isMockMode()) {
    const lodat = mockLodats.find((l) => `map_${l.id}` === parsed.lodatCustomerMapId);
    const lodatId = lodat?.id ?? parsed.lodatCustomerMapId.replace(/^map_/, '');
    const open = mockStore.find((item) => item.lodatId === lodatId && isOpenStatus(item.status));
    if (open) {
      throw new ApiError(409, 'Lô này đã có giao dịch đang mở.', {
        code: OPEN_TRANSACTION_EXISTS_CODE,
        existing: { id: open.id },
      });
    }
    const now = new Date().toISOString();
    const id = `tx_${Date.now()}`;
    const commission =
      parsed.type === TransactionType.RECORD ? 0 : (parsed.commissionVnd ?? 0);
    const created: TransactionDetail = {
      id,
      code: nextCode(),
      type: parsed.type,
      status: TransactionStatus.DA_COC,
      lodatId,
      lodatCustomerMapId: parsed.lodatCustomerMapId,
      lodatTitle: lodat?.title ?? null,
      sellerNames: parsed.sellers.map((p) => p.freeTextName),
      buyerNames: parsed.buyers.map((p) => p.freeTextName),
      salePriceVnd: parsed.salePriceVnd,
      taxPriceVnd: parsed.taxPriceVnd ?? null,
      commissionVnd: commission,
      notaryAppointmentAt: parsed.notaryAppointmentAt ?? null,
      note: parsed.note ?? null,
      cancelReason: null,
      createdByEmployeeId: 'user_staff_1',
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      parties: partiesFromInput(id, parsed.sellers, parsed.buyers),
      snapshot: lodat
        ? {
            title: lodat.title,
            addressText: lodat.address ?? null,
            areaM2: lodat.areaM2 ?? null,
            frontageM: lodat.frontageM ?? null,
            direction: lodat.direction ?? null,
            propertyKind: lodat.kind,
            mapStatus: lodat.status,
            mapPriceVnd: lodat.priceVnd ?? null,
            mapPriceNote: lodat.priceNote ?? null,
            mapBrokerFeeNote: null,
            mapNote: null,
            images: [],
          }
        : null,
      attachments: [],
    };
    mockStore = [created, ...mockStore];
    return structuredClone(created);
  }
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
  if (isMockMode()) {
    const idx = mockStore.findIndex((item) => item.id === id);
    if (idx < 0) throw new Error('Không tìm thấy giao dịch');
    const current = mockStore[idx];
    const nextStatus = parsed.status ?? current.status;
    const now = new Date().toISOString();
    const parties =
      parsed.sellers && parsed.buyers
        ? partiesFromInput(id, parsed.sellers, parsed.buyers)
        : current.parties;
    const next: TransactionDetail = {
      ...current,
      status: nextStatus,
      cancelReason:
        nextStatus === TransactionStatus.HUY
          ? (parsed.cancelReason ?? current.cancelReason)
          : null,
      notaryAppointmentAt:
        parsed.notaryAppointmentAt !== undefined
          ? parsed.notaryAppointmentAt
          : current.notaryAppointmentAt,
      salePriceVnd: parsed.salePriceVnd ?? current.salePriceVnd,
      taxPriceVnd: parsed.taxPriceVnd !== undefined ? parsed.taxPriceVnd : current.taxPriceVnd,
      commissionVnd:
        current.type === TransactionType.RECORD
          ? 0
          : (parsed.commissionVnd ?? current.commissionVnd),
      note: parsed.note !== undefined ? parsed.note : current.note,
      parties,
      sellerNames: namesOf({ ...current, parties }, TransactionPartyRole.SELLER),
      buyerNames: namesOf({ ...current, parties }, TransactionPartyRole.BUYER),
      completedAt:
        nextStatus === TransactionStatus.HOAN_TAT ? (current.completedAt ?? now) : null,
      updatedAt: now,
    };
    mockStore = mockStore.map((row, i) => (i === idx ? next : row));
    return structuredClone(next);
  }
  return apiFetch<TransactionDetail>(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed),
  });
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

export function formatPriceInput(value: number | string | null | undefined): string {
  if (value == null || value === '') return '';
  const digits = String(value).replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parsePriceInput(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}
