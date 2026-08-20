import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import type { UpdateCustomerDto } from './dto/update-customer.dto';
import type { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import type { UpdateCustomerCareDto } from './dto/update-customer-care.dto';
import { CUSTOMER_STATUSES, type CustomerStatusValue } from './customer-status';
import { normalizeCareBudget } from './care-budget';

const LIST_INCLUDE = {
  employee: { select: { fullName: true } },
  sourceHotline: { select: { id: true, phone: true, label: true } },
  facebook: true,
  phones: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
} satisfies Prisma.CustomerInclude;

type CustomerRow = Prisma.CustomerGetPayload<{ include: typeof LIST_INCLUDE }>;

type ProfileLookup = {
  id: string;
  facebookUid: string;
  nickname: string | null;
};

const STATUS_VALUES = new Set<string>(CUSTOMER_STATUSES);

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

type CareSummary = {
  latestNeedSummary: string | null;
  latestCareNote: string | null;
};

function emptyCareSummary(): CareSummary {
  return { latestNeedSummary: null, latestCareNote: null };
}

function trimText(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

function profileByUid(profiles: ProfileLookup[]): Map<string, ProfileLookup> {
  const map = new Map<string, ProfileLookup>();
  for (const profile of profiles) {
    map.set(profile.facebookUid, profile);
  }
  return map;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(user: RequestUser, query: ListCustomersQueryDto) {
    const where: Prisma.CustomerWhereInput = {};

    if (user.role !== 'ADMIN') {
      where.employeeId = user.id;
    }

    if (query.hiddenOnly) {
      where.isHidden = true;
    } else if (!query.includeHidden) {
      where.isHidden = false;
    }

    if (query.status) {
      where.status = query.status;
    }

    const keyword = query.keyword?.trim();
    if (keyword) {
      where.OR = [
        { fullName: { contains: keyword, mode: 'insensitive' } },
        { note: { contains: keyword, mode: 'insensitive' } },
        { phones: { some: { phone: { contains: keyword } } } },
        {
          careNotes: {
            some: {
              OR: [
                { needSummary: { contains: keyword, mode: 'insensitive' } },
                { note: { contains: keyword, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const rows = await this.prisma.customer.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: [
        { isPinned: 'desc' },
        { pinnedAt: { sort: 'desc', nulls: 'last' } },
        { updatedAt: 'desc' },
      ],
    });

    const profiles = await this.loadProfiles();
    const careByCustomer = await this.loadCareSummaries(rows.map((row) => row.id));
    const items = rows.map((row) =>
      this.toListItem(row, profiles, careByCustomer.get(row.id) ?? emptyCareSummary()),
    );
    return { items, total: items.length };
  }

  async getById(user: RequestUser, id: string) {
    const row = await this.prisma.customer.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    this.assertCanAccess(user, row.employeeId);
    const profiles = await this.loadProfiles();
    const [careSummary, careNotes] = await Promise.all([
      this.loadCareSummaries([row.id]),
      this.loadCareNotes(row.id),
    ]);
    return {
      ...this.toListItem(
        row,
        profiles,
        careSummary.get(row.id) ?? emptyCareSummary(),
      ),
      careNotes,
    };
  }

  async update(
    user: RequestUser,
    id: string,
    dto: UpdateCustomerDto,
  ) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    this.assertCanAccess(user, existing.employeeId);

    const data: Prisma.CustomerUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.isHidden !== undefined) data.isHidden = dto.isHidden;
    if (dto.isPinned !== undefined) {
      data.isPinned = dto.isPinned;
      data.pinnedAt = dto.isPinned ? new Date() : null;
    }

    const row = await this.prisma.customer.update({
      where: { id },
      data,
      include: LIST_INCLUDE,
    });
    const profiles = await this.loadProfiles();
    const [careSummary, careNotes] = await Promise.all([
      this.loadCareSummaries([row.id]),
      this.loadCareNotes(row.id),
    ]);
    return {
      ...this.toListItem(
        row,
        profiles,
        careSummary.get(row.id) ?? emptyCareSummary(),
      ),
      careNotes,
    };
  }

  createNotReady(): never {
    throw new BadRequestException(
      'Chưa thêm được khách bằng SĐT — form tạo (hotline, trùng số) làm sau.',
    );
  }

  async addCare(user: RequestUser, id: string, dto: UpdateCustomerCareDto) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    this.assertCanAccess(user, existing.employeeId);
    if (existing.isHidden) {
      throw new BadRequestException(
        'Không cập nhật chăm sóc cho khách đã ẩn. Hãy khôi phục trước.',
      );
    }

    const budget = normalizeCareBudget(dto.budgetMinVnd, dto.budgetMaxVnd);
    if (!budget.ok) {
      throw new BadRequestException(
        'Khoảng tài chính không hợp lệ. Hãy chọn 1 khoảng hoặc «Chưa xác định».',
      );
    }

    const latest = await this.prisma.customerCareNote.findFirst({
      where: { customerId: id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { needSummary: true, note: true },
    });

    const needSummary = (dto.needSummary ?? '').trim();
    const note = (dto.note ?? '').trim();
    const statusChanged = existing.status !== dto.status;
    const budgetChanged =
      toBudgetNumber(existing.budgetMinVnd) !== budget.min ||
      toBudgetNumber(existing.budgetMaxVnd) !== budget.max;
    const latestNeed = (latest?.needSummary ?? '').trim();
    const latestNote = (latest?.note ?? '').trim();
    const careChanged =
      (Boolean(needSummary) || Boolean(note)) &&
      (needSummary !== latestNeed || note !== latestNote);

    if (!statusChanged && !budgetChanged && !careChanged) {
      const current = await this.getById(user, id);
      return { ...current, unchanged: true };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: {
          status: dto.status,
          budgetMinVnd: budget.min == null ? null : BigInt(budget.min),
          budgetMaxVnd: budget.max == null ? null : BigInt(budget.max),
        },
      });
      if (careChanged) {
        await tx.customerCareNote.create({
          data: {
            customerId: id,
            employeeId: user.id,
            needSummary: needSummary || null,
            note,
          },
        });
      }
    });

    const current = await this.getById(user, id);
    return { ...current, unchanged: false };
  }

  private toPublicAvatarUrl(
    facebook: CustomerRow['facebook'],
  ): string | null {
    if (!facebook) return null;
    if (facebook.avatarObjectKey && this.storage.isConfigured()) {
      return this.storage.publicUrl(facebook.avatarObjectKey);
    }
    const url = facebook.avatarUrl?.trim();
    if (url && /^https?:\/\//i.test(url)) return url;
    return null;
  }

  private async loadCareSummaries(
    customerIds: string[],
  ): Promise<Map<string, CareSummary>> {
    const map = new Map<string, CareSummary>();
    if (customerIds.length === 0) return map;

    const rows = await this.prisma.customerCareNote.findMany({
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

  private async loadCareNotes(customerId: string) {
    const rows = await this.prisma.customerCareNote.findMany({
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

  private async loadProfiles(): Promise<Map<string, ProfileLookup>> {
    const rows = await this.prisma.employeeFacebookProfile.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, facebookUid: true, nickname: true },
    });
    return profileByUid(rows);
  }

  private assertCanAccess(user: RequestUser, employeeId: string) {
    if (user.role === 'ADMIN') return;
    if (employeeId !== user.id) {
      throw new ForbiddenException('Không có quyền xem khách này');
    }
  }

  private toListItem(
    row: CustomerRow,
    profiles: Map<string, ProfileLookup>,
    care: CareSummary,
  ) {
    const facebook = row.facebook
      ? {
          customerUid: row.facebook.customerUid,
          threadId: row.facebook.threadId,
          facebookName: row.facebook.facebookName,
          avatarUrl: this.toPublicAvatarUrl(row.facebook),
          scanSource: row.facebook.scanSource,
          scanSourceLabel: row.facebook.scanSourceLabel,
          employeeFacebookUid: row.facebook.employeeFacebookUid,
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
      lodatCount: 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
