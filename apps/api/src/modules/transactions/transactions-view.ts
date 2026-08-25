import { Prisma } from '@prisma/client';
import {
  OPEN_TRANSACTION_EXISTS_CODE,
  TRANSACTION_OPEN_STATUSES,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  TransactionPartyRole,
  TransactionStatus,
  TransactionType,
  type TransactionDetail,
  type TransactionListItem,
  type TransactionListStats,
  type TransactionSnapshot,
} from '@crmanhung/shared';
import type { StorageService } from '../../storage/storage.service';

export const OPEN_STATUSES = [...TRANSACTION_OPEN_STATUSES];

export const LIST_INCLUDE = {
  parties: {
    orderBy: { sortOrder: 'asc' as const },
    select: { role: true, freeTextName: true, sortOrder: true },
  },
  snapshot: { select: { title: true } },
  lodat: {
    select: {
      title: true,
      projectLot: { select: { title: true } },
    },
  },
} satisfies Prisma.TransactionInclude;

export const DETAIL_INCLUDE = {
  parties: { orderBy: { sortOrder: 'asc' as const } },
  snapshot: {
    include: {
      images: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  attachments: { orderBy: { sortOrder: 'asc' as const } },
  lodat: {
    select: {
      title: true,
      projectLot: { select: { title: true } },
    },
  },
} satisfies Prisma.TransactionInclude;

export type ListRow = Prisma.TransactionGetPayload<{ include: typeof LIST_INCLUDE }>;
export type DetailRow = Prisma.TransactionGetPayload<{ include: typeof DETAIL_INCLUDE }>;

export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export function toMoney(value: bigint | number | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === 'bigint' ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function liveLodatTitle(lodat: {
  title: string | null;
  projectLot?: { title: string } | null;
}): string | null {
  return lodat.projectLot?.title?.trim() || lodat.title?.trim() || null;
}

function namesOf(
  parties: { role: string; freeTextName: string; sortOrder: number }[],
  role: string,
): string[] {
  return parties
    .filter((p) => p.role === role)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => p.freeTextName);
}

export function toListItem(row: {
  id: string;
  code: string;
  type: string;
  status: string;
  lodatId: string;
  salePriceVnd: bigint;
  commissionVnd: bigint;
  notaryAppointmentAt: Date | null;
  note: string | null;
  createdAt: Date;
  parties: { role: string; freeTextName: string; sortOrder: number }[];
  snapshot: { title: string | null } | null;
  lodat: { title: string | null; projectLot?: { title: string } | null };
}): TransactionListItem {
  const lodatTitle = row.snapshot?.title?.trim() || liveLodatTitle(row.lodat) || null;
  return {
    id: row.id,
    code: row.code,
    type: row.type as TransactionType,
    status: row.status as TransactionStatus,
    lodatId: row.lodatId,
    lodatTitle,
    sellerNames: namesOf(row.parties, TransactionPartyRole.SELLER),
    buyerNames: namesOf(row.parties, TransactionPartyRole.BUYER),
    salePriceVnd: toMoney(row.salePriceVnd),
    commissionVnd: toMoney(row.commissionVnd),
    notaryAppointmentAt: toIso(row.notaryAppointmentAt),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toDetail(row: DetailRow, storage: StorageService): TransactionDetail {
  const base = toListItem(row);
  const snapshot: TransactionSnapshot | null = row.snapshot
    ? {
        title: row.snapshot.title,
        addressText: row.snapshot.addressText,
        areaM2: row.snapshot.areaM2,
        frontageM: row.snapshot.frontageM,
        direction: row.snapshot.direction,
        propertyKind: row.snapshot.propertyKind,
        mapStatus: row.snapshot.mapStatus,
        mapPriceVnd: toMoney(row.snapshot.mapPriceVnd),
        mapPriceNote: row.snapshot.mapPriceNote,
        mapBrokerFeeNote: row.snapshot.mapBrokerFeeNote,
        mapNote: row.snapshot.mapNote,
        images: row.snapshot.images.map((img) => ({
          id: img.id,
          objectKey: img.objectKey,
          url: storage.isConfigured() ? storage.publicUrl(img.objectKey) : null,
          sortOrder: img.sortOrder,
          rotationDeg: img.rotationDeg,
          sourceLodatImageId: img.sourceLodatImageId,
        })),
      }
    : null;

  return {
    ...base,
    lodatCustomerMapId: row.lodatCustomerMapId,
    taxPriceVnd: toMoney(row.taxPriceVnd),
    cancelReason: row.cancelReason,
    createdByEmployeeId: row.createdByEmployeeId,
    completedAt: toIso(row.completedAt),
    updatedAt: row.updatedAt.toISOString(),
    parties: row.parties.map((p) => ({
      id: p.id,
      role: p.role as TransactionPartyRole,
      customerId: p.customerId,
      freeTextName: p.freeTextName,
      sortOrder: p.sortOrder,
    })),
    snapshot,
    attachments: row.attachments.map((a) => ({
      id: a.id,
      objectKey: a.objectKey,
      url: storage.isConfigured() ? storage.publicUrl(a.objectKey) : null,
      kind: a.kind as TransactionDetail['attachments'][number]['kind'],
      label: a.label,
      sortOrder: a.sortOrder,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export function statsFromItems(items: TransactionListItem[]): TransactionListStats {
  let totalRevenueVnd = 0;
  let totalCommissionVnd = 0;
  for (const item of items) {
    if (item.type !== TransactionType.OWN || item.status !== TransactionStatus.HOAN_TAT) {
      continue;
    }
    const sale = typeof item.salePriceVnd === 'string' ? Number(item.salePriceVnd) : item.salePriceVnd;
    const commission =
      typeof item.commissionVnd === 'string' ? Number(item.commissionVnd) : item.commissionVnd;
    if (typeof sale === 'number' && Number.isFinite(sale)) totalRevenueVnd += sale;
    if (typeof commission === 'number' && Number.isFinite(commission)) {
      totalCommissionVnd += commission;
    }
  }
  return { totalRevenueVnd, totalCommissionVnd };
}

export function keywordWhere(keyword: string | undefined): Prisma.TransactionWhereInput[] {
  const q = keyword?.trim();
  if (!q) return [];
  const or: Prisma.TransactionWhereInput[] = [
    { code: { contains: q, mode: 'insensitive' } },
    { note: { contains: q, mode: 'insensitive' } },
    { lodat: { title: { contains: q, mode: 'insensitive' } } },
    { lodat: { projectLot: { title: { contains: q, mode: 'insensitive' } } } },
    { snapshot: { is: { title: { contains: q, mode: 'insensitive' } } } },
    { snapshot: { is: { addressText: { contains: q, mode: 'insensitive' } } } },
    { parties: { some: { freeTextName: { contains: q, mode: 'insensitive' } } } },
  ];
  const ql = q.toLowerCase();
  const types = (Object.values(TransactionType) as TransactionType[]).filter(
    (t) => TRANSACTION_TYPE_LABELS[t].toLowerCase().includes(ql) || t.toLowerCase() === ql,
  );
  const statuses = (Object.values(TransactionStatus) as TransactionStatus[]).filter(
    (s) => TRANSACTION_STATUS_LABELS[s].toLowerCase().includes(ql) || s.toLowerCase() === ql,
  );
  if (types.length) or.push({ type: { in: types } });
  if (statuses.length) or.push({ status: { in: statuses } });
  return [{ OR: or }];
}

export const OPEN_EXISTS_BODY = {
  statusCode: 409,
  code: OPEN_TRANSACTION_EXISTS_CODE,
  message: 'Lô này đã có giao dịch đang mở.',
} as const;
