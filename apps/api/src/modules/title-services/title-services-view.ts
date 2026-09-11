import { Prisma } from '@prisma/client';
import { facebookPageUrlFromRawMeta } from '@crmanhung/shared';
import type {
  TitleServiceAttachment,
  TitleServiceDetail,
  TitleServiceListItem,
  TitleServiceMoneyEntry,
  TitleServiceProgress,
} from '@crmanhung/shared';

/** Runtime enums — không require ESM `@crmanhung/shared` (Nest CJS). */
export const TITLE_STATUS = {
  DANG_LAM: 'DANG_LAM',
  TAM_DUNG: 'TAM_DUNG',
  HOAN_THANH: 'HOAN_THANH',
  HUY: 'HUY',
} as const;

export const TITLE_STATUSES = Object.values(TITLE_STATUS);
export const DONE_STATUSES = [
  TITLE_STATUS.HOAN_THANH,
  TITLE_STATUS.TAM_DUNG,
  TITLE_STATUS.HUY,
] as const;

export const TITLE_STEP = {
  BAN_GIA: 'BAN_GIA',
  THU_THAP_GIAY_TO: 'THU_THAP_GIAY_TO',
  DO_DAC: 'DO_DAC',
  NOP_HO_SO: 'NOP_HO_SO',
  BO_SUNG: 'BO_SUNG',
  LAM_VIEC_CO_QUAN: 'LAM_VIEC_CO_QUAN',
  NHAN_KET_QUA: 'NHAN_KET_QUA',
  BAN_GIAO: 'BAN_GIAO',
  CONG_VIEC: 'CONG_VIEC',
  KHAC: 'KHAC',
} as const;

export const TITLE_STEPS = Object.values(TITLE_STEP);

export const TITLE_MONEY_KIND = { THU: 'THU', CHI: 'CHI' } as const;
export const TITLE_MONEY_KINDS = Object.values(TITLE_MONEY_KIND);

export const TITLE_DOC_KIND = {
  SO_DO: 'SO_DO',
  CAN_CUOC: 'CAN_CUOC',
  KHAC: 'KHAC',
} as const;
export const TITLE_DOC_KINDS = Object.values(TITLE_DOC_KIND);

export const TITLE_FILE_MAX_BYTES = 12 * 1024 * 1024;
export const TITLE_FILE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;


export const LIST_INCLUDE = {
  customer: {
    select: {
      fullName: true,
      phones: {
        orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
        take: 1,
        select: { phone: true },
      },
    },
  },
  createdBy: { select: { fullName: true } },
  progress: {
    orderBy: { happenedAt: 'desc' as const },
    take: 1,
    include: { createdBy: { select: { fullName: true } } },
  },
  moneyEntries: { select: { kind: true, amountVnd: true } },
  _count: { select: { attachments: true } },
} satisfies Prisma.TitleServiceInclude;

export const DETAIL_INCLUDE = {
  customer: {
    select: {
      fullName: true,
      isHidden: true,
      phones: {
        orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
        select: { id: true, phone: true, label: true },
      },
      facebook: true,
    },
  },
  createdBy: { select: { fullName: true } },
  progress: {
    orderBy: { happenedAt: 'desc' as const },
    include: { createdBy: { select: { fullName: true } } },
  },
  moneyEntries: {
    orderBy: { happenedAt: 'desc' as const },
    include: { createdBy: { select: { fullName: true } } },
  },
  attachments: {
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.TitleServiceInclude;

export type ListRow = Prisma.TitleServiceGetPayload<{ include: typeof LIST_INCLUDE }>;
export type DetailRow = Prisma.TitleServiceGetPayload<{ include: typeof DETAIL_INCLUDE }>;

export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export function toMoney(value: bigint | number | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === 'bigint' ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function computeDaysWorking(
  startedAt: Date,
  completedAt: Date | null,
  status: string,
): number {
  const start = startedAt.getTime();
  if (Number.isNaN(start) || start <= 0) return 0;
  const isDone = DONE_STATUSES.includes(status as (typeof DONE_STATUSES)[number]);
  const done = isDone && completedAt ? completedAt.getTime() : Date.now();
  if (Number.isNaN(done)) return 0;
  return Math.max(0, Math.floor((done - start) / 86_400_000));
}

function moneyTotals(entries: { kind: string; amountVnd: bigint }[]): {
  totalThuVnd: number;
  totalChiVnd: number;
} {
  let thu = 0n;
  let chi = 0n;
  for (const e of entries) {
    if (e.kind === 'THU') thu += e.amountVnd;
    else if (e.kind === 'CHI') chi += e.amountVnd;
  }
  return { totalThuVnd: toMoney(thu) ?? 0, totalChiVnd: toMoney(chi) ?? 0 };
}

function toProgress(row: {
  id: string;
  stepType: string;
  note: string | null;
  happenedAt: Date;
  completedAt?: Date | null;
  workTaskId?: string | null;
  createdByEmployeeId: string;
  createdBy?: { fullName: string };
}): TitleServiceProgress {
  return {
    id: row.id,
    stepType: row.stepType as TitleServiceProgress['stepType'],
    note: row.note,
    happenedAt: row.happenedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    workTaskId: row.workTaskId ?? null,
    createdByEmployeeId: row.createdByEmployeeId,
    employeeName: row.createdBy?.fullName ?? null,
  };
}

function toMoneyEntry(row: {
  id: string;
  kind: string;
  title: string;
  amountVnd: bigint;
  note: string | null;
  happenedAt: Date;
  createdByEmployeeId: string;
  createdBy?: { fullName: string };
}): TitleServiceMoneyEntry {
  return {
    id: row.id,
    kind: row.kind as TitleServiceMoneyEntry['kind'],
    title: row.title,
    amountVnd: toMoney(row.amountVnd) ?? 0,
    note: row.note,
    happenedAt: row.happenedAt.toISOString(),
    createdByEmployeeId: row.createdByEmployeeId,
    employeeName: row.createdBy?.fullName ?? null,
  };
}

function toAttachment(row: {
  id: string;
  kind: string;
  fileName: string;
  createdAt: Date;
  createdByEmployeeId: string;
}): TitleServiceAttachment {
  return {
    id: row.id,
    kind: row.kind as TitleServiceAttachment['kind'],
    fileName: row.fileName,
    createdAt: row.createdAt.toISOString(),
    createdByEmployeeId: row.createdByEmployeeId,
  };
}

export function toListItem(row: ListRow): TitleServiceListItem {
  const latest = row.progress[0] ?? null;
  const { totalThuVnd, totalChiVnd } = moneyTotals(row.moneyEntries);
  return {
    id: row.id,
    code: row.code,
    customerId: row.customerId,
    customerName: row.customer.fullName,
    primaryPhone: row.customer.phones[0]?.phone ?? null,
    status: row.status as TitleServiceListItem['status'],
    agreedFeeVnd: toMoney(row.agreedFeeVnd),
    needSummary: row.needSummary,
    note: row.note,
    isPinned: row.isPinned,
    pinnedAt: toIso(row.pinnedAt),
    startedAt: row.startedAt.toISOString(),
    expectedDoneAt: toIso(row.expectedDoneAt),
    completedAt: toIso(row.completedAt),
    createdByEmployeeId: row.createdByEmployeeId,
    createdByName: row.createdBy.fullName,
    daysWorking: computeDaysWorking(row.startedAt, row.completedAt, row.status),
    documentCount: row._count.attachments,
    totalThuVnd,
    totalChiVnd,
    latestProgress: latest ? toProgress(latest) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toDetail(row: DetailRow): TitleServiceDetail {
  const latest = row.progress[0] ?? null;
  const { totalThuVnd, totalChiVnd } = moneyTotals(row.moneyEntries);
  const phones = row.customer.phones.map((ph) => ({
    id: ph.id,
    phone: ph.phone,
    label: ph.label ?? null,
  }));
  const fb = row.customer.facebook;
  return {
    id: row.id,
    code: row.code,
    customerId: row.customerId,
    customerName: row.customer.fullName,
    primaryPhone: phones[0]?.phone ?? null,
    customerIsHidden: row.customer.isHidden,
    phones,
    facebook: fb
      ? {
          customerUid: fb.customerUid,
          threadId: fb.threadId,
          facebookName: fb.facebookName,
          /* FAB Messenger không cần avatar — tránh phụ thuộc StorageService. */
          avatarUrl: null,
          scanSource: fb.scanSource,
          scanSourceLabel: fb.scanSourceLabel,
          employeeFacebookUid: fb.employeeFacebookUid,
          pageUrl: facebookPageUrlFromRawMeta(fb.rawMeta),
        }
      : null,
    status: row.status as TitleServiceListItem['status'],
    agreedFeeVnd: toMoney(row.agreedFeeVnd),
    needSummary: row.needSummary,
    note: row.note,
    isPinned: row.isPinned,
    pinnedAt: toIso(row.pinnedAt),
    startedAt: row.startedAt.toISOString(),
    expectedDoneAt: toIso(row.expectedDoneAt),
    completedAt: toIso(row.completedAt),
    createdByEmployeeId: row.createdByEmployeeId,
    createdByName: row.createdBy.fullName,
    daysWorking: computeDaysWorking(row.startedAt, row.completedAt, row.status),
    documentCount: row.attachments.length,
    totalThuVnd,
    totalChiVnd,
    latestProgress: latest ? toProgress(latest) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    progress: row.progress.map(toProgress),
    moneyEntries: row.moneyEntries.map(toMoneyEntry),
    attachments: row.attachments.map(toAttachment),
  };
}

export function keywordWhere(keyword: string | undefined): Prisma.TitleServiceWhereInput[] {
  const q = keyword?.trim();
  if (!q) return [];
  return [
    {
      OR: [
        { code: { contains: q, mode: 'insensitive' } },
        { customer: { fullName: { contains: q, mode: 'insensitive' } } },
        { customer: { phones: { some: { phone: { contains: q, mode: 'insensitive' } } } } },
      ],
    },
  ];
}
