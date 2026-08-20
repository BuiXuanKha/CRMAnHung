import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import type { UpdateCustomerDto } from './dto/update-customer.dto';
import type { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { CUSTOMER_STATUSES, type CustomerStatusValue } from './customer-status';

const LIST_INCLUDE = {
  employee: { select: { fullName: true } },
  sourceHotline: { select: { id: true, phone: true, label: true } },
  facebook: true,
} as const;

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

function profileByUid(profiles: ProfileLookup[]): Map<string, ProfileLookup> {
  const map = new Map<string, ProfileLookup>();
  for (const profile of profiles) {
    map.set(profile.facebookUid, profile);
  }
  return map;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

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
    const items = rows.map((row) => this.toListItem(row, profiles));
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
    return { ...this.toListItem(row, profiles), careNotes: [] };
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
    return { ...this.toListItem(row, profiles), careNotes: [] };
  }

  createNotReady(): never {
    throw new BadRequestException(
      'Chưa thêm được khách bằng SĐT — chưa copy bảng số điện thoại.',
    );
  }

  careNotReady(): never {
    throw new BadRequestException(
      'Chưa ghi được chăm sóc — chưa copy lịch sử chăm sóc.',
    );
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

  private toListItem(row: CustomerRow, profiles: Map<string, ProfileLookup>) {
    const facebook = row.facebook
      ? {
          customerUid: row.facebook.customerUid,
          threadId: row.facebook.threadId,
          facebookName: row.facebook.facebookName,
          avatarUrl: row.facebook.avatarUrl,
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
      primaryPhone: null,
      phones: [],
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
      latestNeedSummary: null,
      latestCareNote: null,
      lodatCount: 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
