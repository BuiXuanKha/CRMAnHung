import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { assertCanAccess as assertCustomerAccess } from '../customers/customers-view';
import type {
  CreateTitleServiceDto,
  ListTitleServicesQueryDto,
  PinTitleServiceDto,
  UpdateTitleServiceDto,
} from './dto/title-service.dto';
import {
  DETAIL_INCLUDE,
  DONE_STATUSES,
  LIST_INCLUDE,
  LIST_LIMIT,
  TITLE_STATUS,
  TITLE_STATUSES,
  keywordWhere,
  toDetail,
  toListItem,
} from './title-services-view';

@Injectable()
export class TitleServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: RequestUser, query: ListTitleServicesQueryDto) {
    const where: Prisma.TitleServiceWhereInput = {
      AND: [
        this.ownershipWhere(user, query.createdByEmployeeId),
        query.status ? { status: query.status } : {},
        ...keywordWhere(query.keyword),
      ],
    };
    const rows = await this.prisma.titleService.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { pinnedAt: 'desc' }, { updatedAt: 'desc' }],
      take: LIST_LIMIT,
      include: LIST_INCLUDE,
    });
    const items = rows.map(toListItem);
    return { items, total: items.length };
  }

  async getById(user: RequestUser, id: string) {
    const row = await this.requireDetail(id);
    this.assertCanAccess(user, row.createdByEmployeeId);
    return toDetail(row);
  }

  async create(user: RequestUser, dto: CreateTitleServiceDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId.trim() },
      select: { id: true, employeeId: true, isHidden: true },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng.');
    if (customer.isHidden) {
      throw new BadRequestException('Không tạo hồ sơ cho khách đang ẩn.');
    }
    assertCustomerAccess(user, customer.employeeId);

    const startedAt = this.parseDate(dto.startedAt) ?? new Date();
    const created = await this.prisma.titleService.create({
      data: {
        code: await this.nextCode(),
        customerId: customer.id,
        status: TITLE_STATUS.DANG_LAM,
        agreedFeeVnd: this.parsePrice(dto.agreedFeeVnd) ?? null,
        needSummary: dto.needSummary?.trim() || null,
        note: dto.note?.trim() || null,
        startedAt,
        expectedDoneAt: this.parseDate(dto.expectedDoneAt) ?? null,
        createdByEmployeeId: user.id,
      },
      include: DETAIL_INCLUDE,
    });
    return toDetail(created);
  }

  async update(user: RequestUser, id: string, dto: UpdateTitleServiceDto) {
    const current = await this.requireDetail(id);
    this.assertCanAccess(user, current.createdByEmployeeId);

    const nextStatus = dto.status ?? current.status;
    if (!TITLE_STATUSES.includes(nextStatus as (typeof TITLE_STATUSES)[number])) {
      throw new BadRequestException('Trạng thái không hợp lệ.');
    }

    const isDone = DONE_STATUSES.includes(nextStatus as (typeof DONE_STATUSES)[number]);
    const updated = await this.prisma.titleService.update({
      where: { id },
      data: {
        status: nextStatus,
        agreedFeeVnd:
          dto.agreedFeeVnd !== undefined
            ? (this.parsePrice(dto.agreedFeeVnd) ?? null)
            : undefined,
        needSummary:
          dto.needSummary !== undefined ? dto.needSummary.trim() || null : undefined,
        note: dto.note !== undefined ? dto.note.trim() || null : undefined,
        expectedDoneAt:
          dto.expectedDoneAt !== undefined
            ? (this.parseDate(dto.expectedDoneAt) ?? null)
            : undefined,
        completedAt: isDone ? (current.completedAt ?? new Date()) : null,
      },
      include: LIST_INCLUDE,
    });
    return toListItem(updated);
  }

  async pin(user: RequestUser, id: string, dto: PinTitleServiceDto) {
    const current = await this.prisma.titleService.findUnique({
      where: { id },
      select: { id: true, createdByEmployeeId: true, isPinned: true, pinnedAt: true },
    });
    if (!current) throw new NotFoundException('Không tìm thấy hồ sơ sổ đỏ.');
    this.assertCanAccess(user, current.createdByEmployeeId);

    const updated = await this.prisma.titleService.update({
      where: { id },
      data: {
        isPinned: dto.pinned,
        pinnedAt: dto.pinned ? (current.pinnedAt ?? new Date()) : null,
      },
      include: LIST_INCLUDE,
    });
    return toListItem(updated);
  }

  async remove(user: RequestUser, id: string) {
    const row = await this.prisma.titleService.findUnique({
      where: { id },
      select: { id: true, createdByEmployeeId: true },
    });
    if (!row) throw new NotFoundException('Không tìm thấy hồ sơ sổ đỏ.');
    this.assertCanAccess(user, row.createdByEmployeeId);
    await this.prisma.titleService.delete({ where: { id } });
  }

  private ownershipWhere(
    user: RequestUser,
    createdByEmployeeId?: string,
  ): Prisma.TitleServiceWhereInput {
    if (user.role !== 'ADMIN') return { createdByEmployeeId: user.id };
    if (createdByEmployeeId) return { createdByEmployeeId };
    return {};
  }

  private assertCanAccess(user: RequestUser, createdByEmployeeId: string) {
    if (user.role === 'ADMIN') return;
    if (createdByEmployeeId !== user.id) {
      throw new ForbiddenException('Không có quyền với hồ sơ sổ đỏ này.');
    }
  }

  private async requireDetail(id: string) {
    const row = await this.prisma.titleService.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!row) throw new NotFoundException('Không tìm thấy hồ sơ sổ đỏ.');
    return row;
  }

  private parsePrice(value: unknown): bigint | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const raw = String(value).replace(/[^\d]/g, '');
    if (!raw) return null;
    try {
      return BigInt(raw);
    } catch {
      throw new BadRequestException('Số tiền không hợp lệ.');
    }
  }

  private parseDate(value: string | null | undefined): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const d = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ.');
    }
    return d;
  }

  private async nextCode(): Promise<string> {
    const year = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
    }).format(new Date());
    const prefix = `SD-${year}-`;
    const last = await this.prisma.titleService.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    let max = 0;
    const m = last?.code.match(/^SD-\d{4}-(\d+)$/);
    if (m) max = Number(m[1]);
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }
}
