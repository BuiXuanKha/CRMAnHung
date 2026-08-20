import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { CUSTOMER_STATUSES, type CustomerStatusValue } from './customer-status';
import { assertCanAccess } from './customers-view';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import type { AddCustomerPhoneDto } from './dto/add-customer-phone.dto';
import type { AcknowledgePhoneDuplicateDto } from './dto/acknowledge-phone-duplicate.dto';
import type { MergeFacebookDto } from './dto/merge-facebook.dto';

const STATUS_SET = new Set<string>(CUSTOMER_STATUSES);

function toStatus(raw: string): CustomerStatusValue {
  if (STATUS_SET.has(raw)) return raw as CustomerStatusValue;
  return 'KHAC';
}

type DuplicateExisting = {
  id: string;
  fullName: string;
  facebookName: string | null;
  primaryPhone: string | null;
  hasFacebook: boolean;
  isHidden: boolean;
  status: CustomerStatusValue;
};

function throwPhoneDuplicate(payload: {
  message: string;
  existing: DuplicateExisting;
  mergeAllowed?: boolean;
  phone?: string;
  source?: { id: string; fullName: string };
}): never {
  throw new ConflictException({
    statusCode: 409,
    code: 'PHONE_DUPLICATE',
    message: payload.message,
    existing: payload.existing,
    mergeAllowed: payload.mergeAllowed,
    phone: payload.phone,
    source: payload.source,
  });
}

function mapExisting(row: {
  id: string;
  fullName: string;
  isHidden: boolean;
  status: string;
  facebook: { facebookName: string | null } | null;
  phones: { phone: string }[];
}): DuplicateExisting {
  return {
    id: row.id,
    fullName: row.fullName,
    facebookName: row.facebook?.facebookName ?? null,
    primaryPhone: row.phones[0]?.phone ?? null,
    hasFacebook: Boolean(row.facebook),
    isHidden: row.isHidden,
    status: toStatus(row.status),
  };
}

const DUPLICATE_INCLUDE = {
  facebook: { select: { facebookName: true } },
  phones: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { phone: true },
  },
} satisfies Prisma.CustomerInclude;

async function findByPhoneForEmployee(
  prisma: PrismaService,
  employeeId: string,
  phone: string,
) {
  return prisma.customer.findFirst({
    where: {
      employeeId,
      phones: { some: { phone } },
    },
    include: DUPLICATE_INCLUDE,
    orderBy: [{ isHidden: 'asc' }, { updatedAt: 'desc' }, { id: 'desc' }],
  });
}

export async function createManualCustomer(
  prisma: PrismaService,
  user: RequestUser,
  dto: CreateCustomerDto,
  loadDetail: (id: string) => Promise<unknown>,
) {
  const fullName = dto.fullName.trim();
  const phone = dto.phone.trim();
  const note = dto.note?.trim() || null;

  const hotline = await prisma.employeeHotline.findFirst({
    where: { id: dto.sourceHotlineId, employeeId: user.id, isActive: true },
    select: { id: true },
  });
  if (!hotline) {
    throw new BadRequestException(
      'Hotline không hợp lệ hoặc đã tắt. Vui lòng chọn hotline khác.',
    );
  }

  const existing = await findByPhoneForEmployee(prisma, user.id, phone);
  if (existing) {
    throwPhoneDuplicate({
      message: 'Số điện thoại này đã thuộc khách hàng của bạn.',
      existing: mapExisting(existing),
    });
  }

  const created = await prisma.customer.create({
    data: {
      employeeId: user.id,
      fullName,
      note,
      status: 'KHACH_MOI',
      sourceHotlineId: hotline.id,
      phones: { create: { phone, sortOrder: 0 } },
    },
    select: { id: true },
  });

  return loadDetail(created.id);
}

export async function addCustomerPhone(
  prisma: PrismaService,
  user: RequestUser,
  id: string,
  dto: AddCustomerPhoneDto,
  loadDetail: (id: string) => Promise<unknown>,
) {
  const phone = dto.phone.trim();
  const existing = await prisma.customer.findUnique({
    where: { id },
    include: {
      phones: { select: { id: true } },
      facebook: { select: { id: true } },
    },
  });
  if (!existing) {
    throw new NotFoundException('Không tìm thấy khách hàng');
  }
  assertCanAccess(user, existing.employeeId);
  if (existing.isHidden) {
    throw new BadRequestException(
      'Không thêm số điện thoại cho khách đã ẩn. Hãy khôi phục trước.',
    );
  }
  if (existing.phones.length > 0) {
    throw new BadRequestException('Khách này đã có số điện thoại.');
  }

  const taken = await findByPhoneForEmployee(prisma, existing.employeeId, phone);
  if (taken && taken.id !== id) {
    const mergeAllowed = !taken.facebook;
    throwPhoneDuplicate({
      message: mergeAllowed
        ? 'Số điện thoại này đã thuộc khách chỉ có SĐT — có thể gộp hồ sơ Facebook vào.'
        : 'Số điện thoại này đã thuộc khách khác có liên hệ Facebook.',
      existing: mapExisting(taken),
      mergeAllowed,
      phone,
      source: { id, fullName: existing.fullName },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.customerPhone.create({
      data: { customerId: id, phone, sortOrder: 0 },
    });
    await tx.customer.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  });

  return loadDetail(id);
}

export async function acknowledgePhoneDuplicate(
  prisma: PrismaService,
  user: RequestUser,
  id: string,
  dto: AcknowledgePhoneDuplicateDto,
  loadDetail: (id: string) => Promise<unknown>,
) {
  const fullName = dto.fullName.trim();
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundException('Không tìm thấy khách hàng');
  }
  assertCanAccess(user, existing.employeeId);

  await prisma.customer.update({
    where: { id },
    data: {
      fullName,
      isHidden: false,
      autoRestoredAt: null,
    },
  });

  return loadDetail(id);
}

export async function mergeFacebookIntoPhoneHolder(
  prisma: PrismaService,
  user: RequestUser,
  dto: MergeFacebookDto,
  loadDetail: (id: string) => Promise<unknown>,
) {
  const sourceId = dto.sourceCustomerId;
  const targetId = dto.targetCustomerId;
  const phone = dto.phone.trim();
  if (sourceId === targetId) {
    throw new BadRequestException('Không thể gộp vào chính hồ sơ đó.');
  }

  const source = await prisma.customer.findUnique({
    where: { id: sourceId },
    include: { facebook: { select: { id: true } } },
  });
  if (!source?.facebook) {
    throw new BadRequestException('Khách nguồn phải có liên hệ Facebook để gộp.');
  }
  assertCanAccess(user, source.employeeId);

  const target = await prisma.customer.findUnique({
    where: { id: targetId },
    include: {
      facebook: { select: { id: true } },
      phones: { select: { phone: true } },
    },
  });
  if (!target) {
    throw new NotFoundException(
      user.role === 'ADMIN'
        ? 'Không tìm thấy khách đích.'
        : 'Không tìm thấy khách đích hoặc không thuộc tài khoản của bạn.',
    );
  }
  assertCanAccess(user, target.employeeId);
  if (target.facebook) {
    throw new ConflictException({
      statusCode: 409,
      code: 'MERGE_TARGET_HAS_FACEBOOK',
      message: 'Khách đích đã có liên hệ Facebook — không gộp tự động.',
    });
  }
  if (!target.phones.some((p) => p.phone === phone)) {
    throw new ConflictException({
      statusCode: 409,
      code: 'MERGE_PHONE_MISMATCH',
      message: 'Số điện thoại không thuộc khách đích — không thể gộp.',
    });
  }

  const owner = await findByPhoneForEmployee(prisma, target.employeeId, phone);
  if (!owner || owner.id !== targetId) {
    throw new ConflictException({
      statusCode: 409,
      code: 'MERGE_PHONE_MISMATCH',
      message: 'Số điện thoại không khớp khách đích trên hệ thống.',
    });
  }

  const mergedName = target.fullName.trim() || source.fullName.trim();

  await prisma.$transaction(async (tx) => {
    await tx.customerFacebook.update({
      where: { customerId: sourceId },
      data: { customerId: targetId },
    });
    await tx.customerCareNote.updateMany({
      where: { customerId: sourceId },
      data: { customerId: targetId },
    });
    const targetMaps = await tx.lodatCustomerMap.findMany({
      where: { customerId: targetId },
      select: { lodatId: true },
    });
    const targetLodatIds = targetMaps.map((m) => m.lodatId);
    if (targetLodatIds.length > 0) {
      await tx.lodatCustomerMap.deleteMany({
        where: { customerId: sourceId, lodatId: { in: targetLodatIds } },
      });
    }
    await tx.lodatCustomerMap.updateMany({
      where: { customerId: sourceId },
      data: { customerId: targetId },
    });
    await tx.customer.update({
      where: { id: targetId },
      data: { fullName: mergedName, isHidden: false, autoRestoredAt: null },
    });
    await tx.customer.delete({ where: { id: sourceId } });
  });

  return loadDetail(targetId);
}

export async function listContactChannels(prisma: PrismaService, user: RequestUser) {
  const owner =
    user.role === 'ADMIN' ? {} : { employeeId: user.id };

  const fbGroups = await prisma.customerFacebook.groupBy({
    by: ['employeeFacebookUid'],
    where: {
      employeeFacebookUid: { not: null },
      customer: owner,
    },
    _count: { _all: true },
  });

  const uids = fbGroups
    .map((g) => g.employeeFacebookUid?.trim())
    .filter((uid): uid is string => Boolean(uid));

  const profiles = uids.length
    ? await prisma.employeeFacebookProfile.findMany({
        where: { facebookUid: { in: uids } },
        select: { facebookUid: true, nickname: true },
        orderBy: { id: 'desc' },
      })
    : [];
  const nickByUid = new Map<string, string>();
  for (const p of profiles) {
    if (!nickByUid.has(p.facebookUid)) {
      nickByUid.set(p.facebookUid, p.nickname?.trim() || '');
    }
  }

  const fbItems = fbGroups
    .map((g) => {
      const uid = g.employeeFacebookUid?.trim() ?? '';
      if (!uid) return null;
      const nick = nickByUid.get(uid)?.trim();
      return {
        value: `fb:${uid}`,
        label: nick || uid,
        type: 'facebook' as const,
        customerCount: g._count._all,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.customerCount - a.customerCount || a.label.localeCompare(b.label, 'vi'));

  const hotlineGroups = await prisma.customer.groupBy({
    by: ['sourceHotlineId'],
    where: {
      ...owner,
      sourceHotlineId: { not: null },
    },
    _count: { _all: true },
  });

  const hotlineIds = hotlineGroups
    .map((g) => g.sourceHotlineId)
    .filter((id): id is string => Boolean(id));
  const hotlines = hotlineIds.length
    ? await prisma.employeeHotline.findMany({
        where: { id: { in: hotlineIds } },
        select: { id: true, phone: true, label: true },
      })
    : [];
  const hotlineById = new Map(hotlines.map((h) => [h.id, h]));

  const hotlineItems = hotlineGroups
    .map((g) => {
      const id = g.sourceHotlineId;
      if (!id) return null;
      const h = hotlineById.get(id);
      if (!h) return null;
      const label = h.label?.trim()
        ? `${h.phone} (${h.label.trim()})`
        : h.phone;
      return {
        value: `hotline:${id}`,
        label,
        type: 'hotline' as const,
        customerCount: g._count._all,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.customerCount - a.customerCount || a.label.localeCompare(b.label, 'vi'));

  return { items: [...fbItems, ...hotlineItems] };
}
