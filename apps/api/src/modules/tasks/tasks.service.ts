import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { assertCanAccess as assertCustomerAccess } from '../customers/customers-view';
import type { CreateWorkTaskDto } from './dto/task.dto';

const TARGET_TYPES = ['CUSTOMER', 'LODAT', 'TRANSACTION', 'TITLE_SERVICE'] as const;
type TargetType = (typeof TARGET_TYPES)[number];

function parseDueOn(raw: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new BadRequestException('Chọn hạn làm việc.');
  }
  const due = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(due.getTime())) {
    throw new BadRequestException('Chọn hạn làm việc.');
  }
  return due;
}

function dueOnYmd(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: RequestUser) {
    const rows = await this.prisma.workTask.findMany({
      where: { employeeId: user.id },
      orderBy: [{ dueOn: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
    return {
      items: rows.map((row) => this.toItem(row)),
      total: rows.length,
    };
  }

  async create(user: RequestUser, dto: CreateWorkTaskDto) {
    const content = dto.content.trim();
    if (!content) throw new BadRequestException('Nhập nội dung công việc.');
    const dueOn = parseDueOn(dto.dueOn);
    const target = await this.resolveTarget(user, dto.targetType, dto.targetId);

    const row = await this.prisma.workTask.create({
      data: {
        employeeId: user.id,
        content,
        dueOn,
        targetType: target.type,
        customerId: target.customerId,
        lodatId: target.lodatId,
        transactionId: target.transactionId,
        titleServiceId: target.titleServiceId,
        targetLabel: target.label,
      },
    });
    return this.toItem(row);
  }

  private toItem(row: {
    id: string;
    content: string;
    dueOn: Date;
    targetType: string;
    customerId: string | null;
    lodatId: string | null;
    transactionId: string | null;
    titleServiceId: string | null;
    targetLabel: string;
    createdAt: Date;
  }) {
    const targetId =
      row.customerId ?? row.lodatId ?? row.transactionId ?? row.titleServiceId ?? '';
    return {
      id: row.id,
      content: row.content,
      dueOn: dueOnYmd(row.dueOn),
      targetType: row.targetType,
      targetId,
      targetLabel: row.targetLabel,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async resolveTarget(user: RequestUser, type: TargetType, targetId: string) {
    if (type === 'CUSTOMER') {
      const row = await this.prisma.customer.findUnique({
        where: { id: targetId },
        select: { id: true, fullName: true, employeeId: true },
      });
      if (!row) throw new NotFoundException('Không tìm thấy khách hàng.');
      assertCustomerAccess(user, row.employeeId);
      return {
        type,
        label: row.fullName.trim() || 'Khách hàng',
        customerId: row.id,
        lodatId: null as string | null,
        transactionId: null as string | null,
        titleServiceId: null as string | null,
      };
    }

    if (type === 'LODAT') {
      const row = await this.prisma.lodat.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          title: true,
          createdByEmployeeId: true,
          projectLot: { select: { title: true } },
        },
      });
      if (!row) throw new NotFoundException('Không tìm thấy lô đất.');
      if (user.role !== 'ADMIN' && row.createdByEmployeeId !== user.id) {
        throw new NotFoundException('Không tìm thấy lô đất.');
      }
      const label = row.title?.trim() || row.projectLot?.title?.trim() || 'Lô đất';
      return {
        type,
        label,
        customerId: null,
        lodatId: row.id,
        transactionId: null,
        titleServiceId: null,
      };
    }

    if (type === 'TRANSACTION') {
      const row = await this.prisma.transaction.findUnique({
        where: { id: targetId },
        select: { id: true, code: true, createdByEmployeeId: true },
      });
      if (!row) throw new NotFoundException('Không tìm thấy giao dịch.');
      if (user.role !== 'ADMIN' && row.createdByEmployeeId !== user.id) {
        throw new NotFoundException('Không tìm thấy giao dịch.');
      }
      return {
        type,
        label: row.code,
        customerId: null,
        lodatId: null,
        transactionId: row.id,
        titleServiceId: null,
      };
    }

    const row = await this.prisma.titleService.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        createdByEmployeeId: true,
        customer: { select: { fullName: true } },
      },
    });
    if (!row) throw new NotFoundException('Không tìm thấy hồ sơ sổ đỏ.');
    if (user.role !== 'ADMIN' && row.createdByEmployeeId !== user.id) {
      throw new NotFoundException('Không tìm thấy hồ sơ sổ đỏ.');
    }
    return {
      type,
      label: row.customer.fullName.trim() || 'Khách hàng',
      customerId: null,
      lodatId: null,
      transactionId: null,
      titleServiceId: row.id,
    };
  }
}
