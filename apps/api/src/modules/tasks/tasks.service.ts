import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { compareWorkTasksForList } from '@crmanhung/shared';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { assertCanAccess as assertCustomerAccess } from '../customers/customers-view';
import type { CreateWorkTaskDto, PinWorkTaskDto } from './dto/task.dto';

const TARGET_TYPES = ['NONE', 'CUSTOMER', 'LODAT', 'TRANSACTION', 'TITLE_SERVICE'] as const;
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
      take: 200,
    });
    const items = rows
      .map((row) => this.toItem(row))
      .sort(compareWorkTasksForList);
    return {
      items,
      total: items.length,
    };
  }

  async create(user: RequestUser, dto: CreateWorkTaskDto) {
    const content = dto.content.trim();
    if (!content) throw new BadRequestException('Nhập nội dung công việc.');
    const dueOn = parseDueOn(dto.dueOn);
    const targetType = (dto.targetType ?? 'NONE') as TargetType;
    const target =
      targetType === 'NONE'
        ? {
            type: 'NONE' as const,
            label: '',
            customerId: null as string | null,
            lodatId: null as string | null,
            transactionId: null as string | null,
            titleServiceId: null as string | null,
          }
        : await this.resolveTarget(user, targetType, dto.targetId ?? '');

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workTask.create({
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

      // Thêm công việc trên sổ đỏ = xử lý hồ sơ → ghi luôn bước tiến độ «Công việc».
      if (target.type === 'TITLE_SERVICE' && target.titleServiceId) {
        await tx.titleServiceProgress.create({
          data: {
            titleServiceId: target.titleServiceId,
            stepType: 'CONG_VIEC',
            note: content,
            happenedAt: new Date(),
            workTaskId: created.id,
            createdByEmployeeId: user.id,
          },
        });
        await tx.titleService.update({
          where: { id: target.titleServiceId },
          data: { updatedAt: new Date() },
        });
      }

      return created;
    });

    return this.toItem(row);
  }

  async pin(user: RequestUser, id: string, dto: PinWorkTaskDto) {
    const current = await this.requireOwnOpen(user, id);
    const updated = await this.prisma.workTask.update({
      where: { id },
      data: {
        isPinned: dto.pinned,
        pinnedAt: dto.pinned ? (current.pinnedAt ?? new Date()) : null,
      },
    });
    return this.toItem(updated);
  }

  async complete(user: RequestUser, id: string) {
    const current = await this.requireOwnOpen(user, id);
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.workTask.update({
        where: { id },
        data: { completedAt: now },
      });

      // Bước tiến độ Công việc gắn việc này → hangtag Đã hoàn thành.
      const linked = await tx.titleServiceProgress.updateMany({
        where: { workTaskId: id, completedAt: null },
        data: { completedAt: now },
      });

      // Việc cũ (trước khi có workTaskId): khớp sổ đỏ + CONG_VIEC + cùng nội dung.
      if (
        linked.count === 0 &&
        current.targetType === 'TITLE_SERVICE' &&
        current.titleServiceId
      ) {
        await tx.titleServiceProgress.updateMany({
          where: {
            titleServiceId: current.titleServiceId,
            stepType: 'CONG_VIEC',
            workTaskId: null,
            completedAt: null,
            note: current.content,
          },
          data: { completedAt: now, workTaskId: id },
        });
      }

      if (current.titleServiceId) {
        await tx.titleService.update({
          where: { id: current.titleServiceId },
          data: { updatedAt: now },
        });
      }

      return row;
    });
    return this.toItem(updated);
  }

  /** Own open task only — even Admin cannot see another employee's tasks (404). */
  private async requireOwnOpen(user: RequestUser, id: string) {
    const row = await this.prisma.workTask.findUnique({ where: { id } });
    if (!row || row.employeeId !== user.id || row.completedAt) {
      throw new NotFoundException('Không tìm thấy công việc.');
    }
    return row;
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
    isPinned: boolean;
    pinnedAt: Date | null;
    completedAt: Date | null;
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
      isPinned: row.isPinned,
      pinnedAt: row.pinnedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async resolveTarget(user: RequestUser, type: Exclude<TargetType, 'NONE'>, targetId: string) {
    if (!targetId.trim()) {
      throw new BadRequestException('Chọn nguồn công việc.');
    }
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
