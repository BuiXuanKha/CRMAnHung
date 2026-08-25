import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  TransactionPartyRole,
  TransactionStatus,
  TransactionType,
} from '@crmanhung/shared';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { assertCanAccess as assertCustomerAccess } from '../customers/customers-view';
import type {
  CreateTransactionDto,
  ListTransactionsQueryDto,
  TransactionPartyInputDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import {
  buildSnapshotCreate,
  LODAT_SNAPSHOT_INCLUDE,
  type LodatSnapshotRow,
} from './transactions-snapshot';
import {
  DETAIL_INCLUDE,
  keywordWhere,
  LIST_INCLUDE,
  OPEN_EXISTS_BODY,
  OPEN_STATUSES,
  statsFromItems,
  toDetail,
  toListItem,
} from './transactions-view';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(user: RequestUser, query: ListTransactionsQueryDto) {
    const where: Prisma.TransactionWhereInput = {
      AND: [
        this.ownershipWhere(user, query.createdByEmployeeId),
        query.type ? { type: query.type } : {},
        query.status ? { status: query.status } : {},
        ...keywordWhere(query.keyword),
      ],
    };
    const rows = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: LIST_INCLUDE,
    });
    const items = rows.map(toListItem);
    return { items, total: items.length, stats: statsFromItems(items) };
  }

  async getById(user: RequestUser, id: string) {
    const row = await this.requireDetail(id);
    this.assertCanAccessTx(user, row.createdByEmployeeId);
    return toDetail(row, this.storage);
  }

  async getOpen(user: RequestUser, lodatId: string) {
    const lodat = await this.prisma.lodat.findUnique({
      where: { id: lodatId },
      select: { id: true, createdByEmployeeId: true },
    });
    if (!lodat) throw new NotFoundException('Không tìm thấy lô đất.');
    this.assertCanAccessLodat(user, lodat.createdByEmployeeId);
    const open = await this.findOpenId(lodat.id);
    return { id: open };
  }

  async create(user: RequestUser, dto: CreateTransactionDto) {
    const { lodat, map } = await this.resolveLodatMap(user, dto);
    this.assertCreateRules(dto);

    const open = await this.findOpenId(lodat.id);
    if (open) this.throwOpenExists(open);

    await this.assertPartyCustomers(user, [...dto.sellers, ...dto.buyers]);

    const sale = this.parsePrice(dto.salePriceVnd) ?? 0n;
    const tax = this.parsePrice(dto.taxPriceVnd);
    const commission =
      dto.type === TransactionType.RECORD ? 0n : (this.parsePrice(dto.commissionVnd) ?? 0n);
    const snapshot = buildSnapshotCreate(lodat, map);

    try {
      const created = await this.prisma.transaction.create({
        data: {
          code: await this.nextCode(),
          lodatId: lodat.id,
          lodatCustomerMapId: map.id,
          type: dto.type,
          status: TransactionStatus.DA_COC,
          notaryAppointmentAt: this.parseDate(dto.notaryAppointmentAt) ?? null,
          salePriceVnd: sale,
          taxPriceVnd: tax ?? null,
          commissionVnd: commission,
          note: dto.note?.trim() || null,
          createdByEmployeeId: user.id,
          parties: { create: this.partyRows(dto.sellers, dto.buyers) },
          snapshot: { create: snapshot },
        },
        include: DETAIL_INCLUDE,
      });
      return toDetail(created, this.storage);
    } catch (err) {
      await this.rethrowOpenConflict(err, lodat.id);
      throw err;
    }
  }

  async update(user: RequestUser, id: string, dto: UpdateTransactionDto) {
    const current = await this.requireDetail(id);
    this.assertCanAccessTx(user, current.createdByEmployeeId);
    this.assertUpdateRules(dto);

    const nextStatus = dto.status ?? current.status;
    if (
      OPEN_STATUSES.includes(nextStatus as (typeof OPEN_STATUSES)[number]) &&
      nextStatus !== current.status
    ) {
      const other = await this.findOpenId(current.lodatId, current.id);
      if (other) this.throwOpenExists(other);
    }

    if (dto.sellers && dto.buyers) {
      await this.assertPartyCustomers(user, [...dto.sellers, ...dto.buyers]);
    }

    const commission =
      current.type === TransactionType.RECORD
        ? 0n
        : dto.commissionVnd !== undefined
          ? (this.parsePrice(dto.commissionVnd) ?? 0n)
          : current.commissionVnd;

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (dto.sellers && dto.buyers) {
          await tx.transactionParty.deleteMany({ where: { transactionId: id } });
          await tx.transactionParty.createMany({
            data: this.partyRows(dto.sellers, dto.buyers).map((p) => ({
              ...p,
              transactionId: id,
            })),
          });
        }
        return tx.transaction.update({
          where: { id },
          data: {
            status: nextStatus,
            cancelReason:
              nextStatus === TransactionStatus.HUY
                ? (dto.cancelReason?.trim() ?? current.cancelReason)
                : null,
            notaryAppointmentAt:
              dto.notaryAppointmentAt !== undefined
                ? this.parseDate(dto.notaryAppointmentAt) ?? null
                : undefined,
            salePriceVnd:
              dto.salePriceVnd !== undefined
                ? (this.parsePrice(dto.salePriceVnd) ?? 0n)
                : undefined,
            taxPriceVnd:
              dto.taxPriceVnd !== undefined ? (this.parsePrice(dto.taxPriceVnd) ?? null) : undefined,
            commissionVnd: commission,
            note: dto.note !== undefined ? dto.note?.trim() || null : undefined,
            completedAt:
              nextStatus === TransactionStatus.HOAN_TAT
                ? (current.completedAt ?? new Date())
                : null,
          },
          include: DETAIL_INCLUDE,
        });
      });
      return toDetail(updated, this.storage);
    } catch (err) {
      await this.rethrowOpenConflict(err, current.lodatId);
      throw err;
    }
  }

  async remove(user: RequestUser, id: string) {
    const row = await this.prisma.transaction.findUnique({
      where: { id },
      select: { id: true, status: true, createdByEmployeeId: true, lodatCustomerMapId: true },
    });
    if (!row) throw new NotFoundException('Không tìm thấy giao dịch.');
    this.assertCanAccessTx(user, row.createdByEmployeeId);

    await this.prisma.$transaction(async (tx) => {
      if (OPEN_STATUSES.includes(row.status as (typeof OPEN_STATUSES)[number])) {
        await tx.lodatCustomerMap.update({
          where: { id: row.lodatCustomerMapId },
          data: { status: 'DANG_BAN' },
        });
      }
      await tx.transaction.delete({ where: { id } });
    });
  }

  private ownershipWhere(
    user: RequestUser,
    createdByEmployeeId?: string,
  ): Prisma.TransactionWhereInput {
    if (user.role !== 'ADMIN') return { createdByEmployeeId: user.id };
    if (createdByEmployeeId) return { createdByEmployeeId };
    return {};
  }

  private assertCanAccessTx(user: RequestUser, createdByEmployeeId: string) {
    if (user.role === 'ADMIN') return;
    if (createdByEmployeeId !== user.id) {
      throw new ForbiddenException('Không có quyền với giao dịch này.');
    }
  }

  private assertCanAccessLodat(user: RequestUser, createdByEmployeeId: string) {
    if (user.role === 'ADMIN') return;
    if (createdByEmployeeId !== user.id) {
      throw new ForbiddenException('Không có quyền với lô đất này.');
    }
  }

  private async requireDetail(id: string) {
    const row = await this.prisma.transaction.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!row) throw new NotFoundException('Không tìm thấy giao dịch.');
    return row;
  }

  private async findOpenId(lodatId: string, exceptId?: string) {
    const row = await this.prisma.transaction.findFirst({
      where: {
        lodatId,
        status: { in: [...OPEN_STATUSES] },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  private throwOpenExists(id: string): never {
    throw new ConflictException({ ...OPEN_EXISTS_BODY, existing: { id } });
  }

  private async rethrowOpenConflict(err: unknown, lodatId: string): Promise<void> {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') return;
    const open = await this.findOpenId(lodatId);
    if (open) this.throwOpenExists(open);
  }

  private async resolveLodatMap(user: RequestUser, dto: CreateTransactionDto) {
    let mapId = dto.lodatCustomerMapId?.trim() || '';
    let lodatId = dto.lodatId?.trim() || '';

    if (mapId) {
      const map = await this.prisma.lodatCustomerMap.findUnique({
        where: { id: mapId },
        include: { lodat: { include: LODAT_SNAPSHOT_INCLUDE } },
      });
      if (!map) throw new NotFoundException('Không tìm thấy map lô–khách.');
      if (lodatId && map.lodatId !== lodatId) {
        throw new BadRequestException('Map không thuộc lô đất đã chọn.');
      }
      this.assertCanAccessLodat(user, map.lodat.createdByEmployeeId);
      return { lodat: map.lodat, map };
    }

    const lodat = await this.prisma.lodat.findUnique({
      where: { id: lodatId },
      include: LODAT_SNAPSHOT_INCLUDE,
    });
    if (!lodat) throw new NotFoundException('Không tìm thấy lô đất.');
    this.assertCanAccessLodat(user, lodat.createdByEmployeeId);
    const map = await this.prisma.lodatCustomerMap.findFirst({
      where: { lodatId: lodat.id, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!map) throw new BadRequestException('Lô chưa có chủ để tạo giao dịch.');
    return { lodat, map };
  }

  private async assertPartyCustomers(user: RequestUser, parties: TransactionPartyInputDto[]) {
    const ids = [
      ...new Set(parties.map((p) => p.customerId?.trim()).filter((id): id is string => Boolean(id))),
    ];
    if (!ids.length) return;
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: ids } },
      select: { id: true, employeeId: true },
    });
    if (customers.length !== ids.length) {
      throw new BadRequestException('Không tìm thấy khách trong bên giao dịch.');
    }
    for (const c of customers) {
      assertCustomerAccess(user, c.employeeId);
    }
  }

  private partyRows(sellers: TransactionPartyInputDto[], buyers: TransactionPartyInputDto[]) {
    return [
      ...sellers.map((p, i) => ({
        role: TransactionPartyRole.SELLER,
        customerId: p.customerId?.trim() || null,
        freeTextName: p.freeTextName.trim(),
        sortOrder: p.sortOrder ?? i,
      })),
      ...buyers.map((p, i) => ({
        role: TransactionPartyRole.BUYER,
        customerId: p.customerId?.trim() || null,
        freeTextName: p.freeTextName.trim(),
        sortOrder: p.sortOrder ?? i,
      })),
    ];
  }

  private assertCreateRules(dto: CreateTransactionDto) {
    if (!dto.lodatId?.trim() && !dto.lodatCustomerMapId?.trim()) {
      throw new BadRequestException('Thiếu lô đất.');
    }
    if (dto.type === TransactionType.OWN && !dto.notaryAppointmentAt) {
      throw new BadRequestException('Giao dịch của tôi cần ngày hẹn công chứng.');
    }
  }

  private assertUpdateRules(dto: UpdateTransactionDto) {
    if (dto.status === TransactionStatus.HUY && !dto.cancelReason?.trim()) {
      throw new BadRequestException('Cần lý do khi hủy giao dịch.');
    }
    if ((dto.sellers && !dto.buyers) || (!dto.sellers && dto.buyers)) {
      throw new BadRequestException('Cần đủ người bán và người mua.');
    }
  }

  private parsePrice(value: unknown): bigint | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const raw = String(value).replace(/[^\d]/g, '');
    if (!raw) return null;
    try {
      return BigInt(raw);
    } catch {
      throw new BadRequestException('Giá không hợp lệ.');
    }
  }

  private parseDate(value: string | null | undefined): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const d = new Date(value);
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
    const prefix = `GD-${year}-`;
    const last = await this.prisma.transaction.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    let max = 0;
    const m = last?.code.match(/^GD-\d{4}-(\d+)$/);
    if (m) max = Number(m[1]);
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }
}
