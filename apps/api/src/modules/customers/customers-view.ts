import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { facebookPageUrlFromRawMeta } from '@crmanhung/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { CUSTOMER_STATUSES, type CustomerStatusValue } from './customer-status';

export const LIST_INCLUDE = {
  employee: { select: { fullName: true } },
  sourceHotline: { select: { id: true, phone: true, label: true } },
  facebook: true,
  phones: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
} satisfies Prisma.CustomerInclude;

export type CustomerRow = Prisma.CustomerGetPayload<{ include: typeof LIST_INCLUDE }>;

export type ProfileLookup = {
  id: string;
  facebookUid: string;
  nickname: string | null;
};

export type CareSummary = {
  latestNeedSummary: string | null;
  latestCareNote: string | null;
};

const STATUS_VALUES = new Set<string>(CUSTOMER_STATUSES);

export function emptyCareSummary(): CareSummary {
  return { latestNeedSummary: null, latestCareNote: null };
}

function toBudgetNumber(value: bigint | number | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === 'bigint' ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toStatus(raw: string): CustomerStatusValue {
  if (STATUS_VALUES.has(raw)) return raw as CustomerStatusValue;
  return 'KHAC';
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function trimText(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

export function assertCanAccess(user: RequestUser, employeeId: string) {
  if (user.role === 'ADMIN') return;
  if (employeeId !== user.id) {
    throw new ForbiddenException('Không có quyền xem khách này');
  }
}

export function toPublicAvatarUrl(
  storage: StorageService,
  facebook: CustomerRow['facebook'],
): string | null {
  if (!facebook) return null;
  if (facebook.avatarObjectKey && storage.isConfigured()) {
    return storage.publicUrl(facebook.avatarObjectKey);
  }
  const url = facebook.avatarUrl?.trim();
  if (url && /^https?:\/\//i.test(url)) return url;
  return null;
}

export async function loadCareSummaries(
  prisma: PrismaService,
  customerIds: string[],
): Promise<Map<string, CareSummary>> {
  const map = new Map<string, CareSummary>();
  if (customerIds.length === 0) return map;

  const rows = await prisma.customerCareNote.findMany({
    where: { customerId: { in: customerIds } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { customerId: true, needSummary: true, note: true },
  });

  for (const row of rows) {
    const current = map.get(row.customerId) ?? emptyCareSummary();
    if (!current.latestNeedSummary) {
      current.latestNeedSummary = trimText(row.needSummary);
    }
    if (!current.latestCareNote) {
      current.latestCareNote = trimText(row.note);
    }
    map.set(row.customerId, current);
  }
  return map;
}

export async function loadCareNotes(prisma: PrismaService, customerId: string) {
  const rows = await prisma.customerCareNote.findMany({
    where: { customerId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: { employee: { select: { fullName: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    note: row.note,
    needSummary: row.needSummary,
    employeeId: row.employeeId,
    employeeName: row.employee.fullName,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function loadProfiles(
  prisma: PrismaService,
): Promise<Map<string, ProfileLookup>> {
  const rows = await prisma.employeeFacebookProfile.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, facebookUid: true, nickname: true },
  });
  const map = new Map<string, ProfileLookup>();
  for (const profile of rows) {
    map.set(profile.facebookUid, profile);
  }
  return map;
}

export async function loadLodatCounts(
  prisma: PrismaService,
  customerIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (customerIds.length === 0) return map;
  const rows = await prisma.lodatCustomerMap.groupBy({
    by: ['customerId'],
    where: { customerId: { in: customerIds }, isActive: true },
    _count: { _all: true },
  });
  for (const row of rows) {
    map.set(row.customerId, row._count._all);
  }
  return map;
}

export async function loadMessageCounts(
  prisma: PrismaService,
  customerIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (customerIds.length === 0) return map;
  const rows = await prisma.customerFacebook.findMany({
    where: { customerId: { in: customerIds } },
    select: { customerId: true, _count: { select: { messages: true } } },
  });
  for (const row of rows) {
    map.set(row.customerId, row._count.messages);
  }
  return map;
}

export async function loadCareNoteCounts(
  prisma: PrismaService,
  customerIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (customerIds.length === 0) return map;
  const rows = await prisma.customerCareNote.groupBy({
    by: ['customerId'],
    where: { customerId: { in: customerIds } },
    _count: { _all: true },
  });
  for (const row of rows) {
    map.set(row.customerId, row._count._all);
  }
  return map;
}

export function toListItem(
  storage: StorageService,
  row: CustomerRow,
  profiles: Map<string, ProfileLookup>,
  care: CareSummary,
  lodatCount = 0,
  messageCount = 0,
  careNoteCount = 0,
) {
  const facebook = row.facebook
    ? {
        customerUid: row.facebook.customerUid,
        threadId: row.facebook.threadId,
        facebookName: row.facebook.facebookName,
        avatarUrl: toPublicAvatarUrl(storage, row.facebook),
        scanSource: row.facebook.scanSource,
        scanSourceLabel: row.facebook.scanSourceLabel,
        employeeFacebookUid: row.facebook.employeeFacebookUid,
        pageUrl: facebookPageUrlFromRawMeta(row.facebook.rawMeta),
      }
    : null;
  const sourceFacebookProfile =
    (facebook?.employeeFacebookUid
      ? profiles.get(facebook.employeeFacebookUid)
      : null) ?? null;

  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employee.fullName,
    fullName: row.fullName,
    status: toStatus(row.status),
    budgetMinVnd: toBudgetNumber(row.budgetMinVnd),
    budgetMaxVnd: toBudgetNumber(row.budgetMaxVnd),
    note: row.note,
    isPinned: row.isPinned,
    isHidden: row.isHidden,
    pinnedAt: toIso(row.pinnedAt),
    autoRestoredAt: toIso(row.autoRestoredAt),
    primaryPhone: row.phones[0]?.phone ?? null,
    phones: row.phones.map((p) => ({
      id: p.id,
      phone: p.phone,
      label: p.label,
    })),
    facebook,
    sourceHotline: row.sourceHotline
      ? {
          id: row.sourceHotline.id,
          phone: row.sourceHotline.phone,
          label: row.sourceHotline.label,
        }
      : null,
    sourceFacebookProfile: sourceFacebookProfile
      ? {
          id: sourceFacebookProfile.id,
          facebookUid: sourceFacebookProfile.facebookUid,
          nickname: sourceFacebookProfile.nickname,
        }
      : null,
    latestNeedSummary: care.latestNeedSummary,
    latestCareNote: care.latestCareNote,
    lodatCount,
    messageCount,
    careNoteCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
