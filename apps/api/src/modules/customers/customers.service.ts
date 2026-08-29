import {
  BadRequestException,
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
import type { AddCustomerPhoneDto } from './dto/add-customer-phone.dto';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import type { AcknowledgePhoneDuplicateDto } from './dto/acknowledge-phone-duplicate.dto';
import type { MergeFacebookDto } from './dto/merge-facebook.dto';
import { normalizeCareBudget } from './care-budget';
import { budgetFilterWhere, contactChannelWhere, lodatFilterWhere, needFilterWhere } from './customers-filters';
import {
  acknowledgePhoneDuplicate,
  addCustomerPhone,
  createManualCustomer,
  listContactChannels,
  mergeFacebookIntoPhoneHolder,
} from './customers-phone';
import {
  LIST_INCLUDE,
  assertCanAccess,
  emptyCareSummary,
  loadCareNotes,
  loadCareSummaries,
  loadLodatCounts,
  loadProfiles,
  toListItem,
} from './customers-view';
import { LodatsService } from '../lodats/lodats.service';
import { FromExtensionService } from './from-extension.service';

const MESSAGE_SENDERS = new Set(['customer', 'me', 'page', 'unknown']);

function toBudgetNumber(value: bigint | number | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === 'bigint' ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toMessageSender(raw: string | null | undefined): 'customer' | 'me' | 'page' | 'unknown' {
  const v = (raw ?? '').trim();
  if (MESSAGE_SENDERS.has(v)) return v as 'customer' | 'me' | 'page' | 'unknown';
  return 'unknown';
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly lodats: LodatsService,
    private readonly fromExtension: FromExtensionService,
  ) {}

  async list(user: RequestUser, query: ListCustomersQueryDto) {
    const and: Prisma.CustomerWhereInput[] = [];

    if (user.role !== 'ADMIN') {
      and.push({ employeeId: user.id });
    }

    if (query.hiddenOnly) {
      and.push({ isHidden: true });
    } else if (!query.includeHidden) {
      and.push({ isHidden: false });
    }

    if (query.status) {
      and.push({ status: query.status });
    }

    const keyword = query.keyword?.trim();
    if (keyword) {
      and.push({
        OR: [
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
        ],
      });
    }

    const budget = budgetFilterWhere(query.budgetFilter);
    if (budget) and.push(budget);
    const channel = contactChannelWhere(query.contactChannel);
    if (channel) and.push(channel);
    const need = needFilterWhere(query.needFilter);
    if (need) and.push(need);
    const lodat = lodatFilterWhere(query.lodatFilter);
    if (lodat) and.push(lodat);

    const where: Prisma.CustomerWhereInput = and.length ? { AND: and } : {};
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const offset = Math.max(query.offset ?? 0, 0);
    const orderBy = [
      { isPinned: 'desc' as const },
      { pinnedAt: { sort: 'desc' as const, nulls: 'last' as const } },
      { updatedAt: 'desc' as const },
    ];

    const [total, rows] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy,
        skip: offset,
        take: limit,
      }),
    ]);

    const ids = rows.map((row) => row.id);
    const [profiles, careByCustomer, lodatCounts] = await Promise.all([
      loadProfiles(this.prisma),
      loadCareSummaries(this.prisma, ids),
      loadLodatCounts(this.prisma, ids),
    ]);
    const items = rows.map((row) =>
      toListItem(
        this.storage,
        row,
        profiles,
        careByCustomer.get(row.id) ?? emptyCareSummary(),
        lodatCounts.get(row.id) ?? 0,
      ),
    );
    return { items, total };
  }

  async getById(user: RequestUser, id: string) {
    const row = await this.prisma.customer.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    assertCanAccess(user, row.employeeId);
    const profiles = await loadProfiles(this.prisma);
    const [careSummary, careNotes, lodatCounts] = await Promise.all([
      loadCareSummaries(this.prisma, [row.id]),
      loadCareNotes(this.prisma, row.id),
      loadLodatCounts(this.prisma, [row.id]),
    ]);
    return {
      ...toListItem(
        this.storage,
        row,
        profiles,
        careSummary.get(row.id) ?? emptyCareSummary(),
        lodatCounts.get(row.id) ?? 0,
      ),
      careNotes,
    };
  }

  async listLodats(user: RequestUser, id: string) {
    const row = await this.prisma.customer.findUnique({
      where: { id },
      select: { id: true, employeeId: true },
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    assertCanAccess(user, row.employeeId);
    return this.lodats.listForCustomer(user, row.id);
  }

  async listMessages(user: RequestUser, id: string) {
    const row = await this.prisma.customer.findUnique({
      where: { id },
      select: { employeeId: true, facebook: { select: { id: true } } },
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    assertCanAccess(user, row.employeeId);
    if (!row.facebook) {
      return { messages: [] };
    }

    const messages = await this.prisma.customerMessengerMessage.findMany({
      where: { customerFacebookId: row.facebook.id },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      },
    });

    const cdnReady = this.storage.isConfigured();
    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        body: msg.body,
        sender: toMessageSender(msg.sender),
        sortOrder: msg.sortOrder,
        images: msg.images
          .filter((img) => img.objectKey)
          .map((img) => ({
            id: img.id,
            url: cdnReady ? this.storage.publicUrl(img.objectKey) : '',
            rotationDeg: img.rotationDeg ?? 0,
          }))
          .filter((img) => img.url),
      })),
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
    assertCanAccess(user, existing.employeeId);

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
    const profiles = await loadProfiles(this.prisma);
    const [careSummary, careNotes, lodatCounts] = await Promise.all([
      loadCareSummaries(this.prisma, [row.id]),
      loadCareNotes(this.prisma, row.id),
      loadLodatCounts(this.prisma, [row.id]),
    ]);
    return {
      ...toListItem(
        this.storage,
        row,
        profiles,
        careSummary.get(row.id) ?? emptyCareSummary(),
        lodatCounts.get(row.id) ?? 0,
      ),
      careNotes,
    };
  }

  create(user: RequestUser, dto: CreateCustomerDto) {
    return createManualCustomer(this.prisma, user, dto, (id) => this.getById(user, id));
  }

  fromExtensionIngest(user: RequestUser, body: unknown) {
    return this.fromExtension.ingest(user, body);
  }

  listChannels(user: RequestUser) {
    return listContactChannels(this.prisma, user);
  }

  acknowledgeDuplicate(
    user: RequestUser,
    id: string,
    dto: AcknowledgePhoneDuplicateDto,
  ) {
    return acknowledgePhoneDuplicate(this.prisma, user, id, dto, (cid) =>
      this.getById(user, cid),
    );
  }

  mergeFacebook(user: RequestUser, dto: MergeFacebookDto) {
    return mergeFacebookIntoPhoneHolder(this.prisma, user, dto, (id) =>
      this.getById(user, id),
    );
  }

  async addCare(user: RequestUser, id: string, dto: UpdateCustomerCareDto) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    assertCanAccess(user, existing.employeeId);
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

  async addPhone(user: RequestUser, id: string, dto: AddCustomerPhoneDto) {
    return addCustomerPhone(this.prisma, user, id, dto, (cid) => this.getById(user, cid));
  }
}
