import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { assertCanAccess as assertCustomerAccess } from '../customers/customers-view';
import type {
  AddTitleServiceAttachmentDto,
  AddTitleServiceMoneyDto,
  AddTitleServiceProgressDto,
  CreateTitleServiceDto,
  ListTitleServicesQueryDto,
  PinTitleServiceDto,
  UpdateTitleServiceDto,
} from './dto/title-service.dto';
import {
  DETAIL_INCLUDE,
  DONE_STATUSES,
  LIST_INCLUDE,
  TITLE_DOC_KINDS,
  TITLE_FILE_MAX_BYTES,
  TITLE_FILE_MIMES,
  TITLE_MONEY_KIND,
  TITLE_STATUS,
  TITLE_STATUSES,
  keywordWhere,
  toDetail,
  toListItem,
} from './title-services-view';

const SIGNED_URL_TTL_SEC = 15 * 60;

@Injectable()
export class TitleServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(user: RequestUser, query: ListTitleServicesQueryDto) {
    const where: Prisma.TitleServiceWhereInput = {
      AND: [
        this.ownershipWhere(user, query.createdByEmployeeId),
        query.status ? { status: query.status } : {},
        ...keywordWhere(query.keyword),
      ],
    };
    const take = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const skip = Math.max(query.offset ?? 0, 0);
    const [rows, total, thuAgg, chiAgg] = await Promise.all([
      this.prisma.titleService.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { pinnedAt: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take,
        include: LIST_INCLUDE,
      }),
      this.prisma.titleService.count({ where }),
      this.prisma.titleServiceMoney.aggregate({
        where: { kind: TITLE_MONEY_KIND.THU, titleService: where },
        _sum: { amountVnd: true },
      }),
      this.prisma.titleServiceMoney.aggregate({
        where: { kind: TITLE_MONEY_KIND.CHI, titleService: where },
        _sum: { amountVnd: true },
      }),
    ]);
    const items = rows.map(toListItem);
    const thuSum = thuAgg._sum.amountVnd;
    const chiSum = chiAgg._sum.amountVnd;
    return {
      items,
      total,
      stats: {
        totalThuVnd: thuSum == null ? 0 : Number(thuSum),
        totalChiVnd: chiSum == null ? 0 : Number(chiSum),
      },
    };
  }

  async getById(user: RequestUser, id: string) {
    const row = await this.requireDetail(id);
    this.assertCanAccess(user, row.createdByEmployeeId);
    return toDetail(row);
  }

  async create(user: RequestUser, dto: CreateTitleServiceDto) {
    if (user.role === 'ADMIN') {
      throw new ForbiddenException(
        'Admin không tạo dịch vụ sổ đỏ. Nhân viên tạo hồ sơ từ khách của mình.',
      );
    }
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

    // BUG-054: race 2 tab cùng nextCode → P2002 code; thử lại mã mới vài lần.
    const maxAttempts = 3;
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
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
      } catch (err) {
        if (this.isCodeUniqueConflict(err) && attempt < maxAttempts - 1) {
          lastErr = err;
          continue;
        }
        throw err;
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new ConflictException('Không cấp được mã hồ sơ sổ đỏ. Thử lại.');
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
      select: {
        id: true,
        createdByEmployeeId: true,
        attachments: { select: { objectKey: true } },
      },
    });
    if (!row) throw new NotFoundException('Không tìm thấy hồ sơ sổ đỏ.');
    this.assertCanAccess(user, row.createdByEmployeeId);
    await this.prisma.titleService.delete({ where: { id } });
    await this.deletePrivateKeys(row.attachments.map((a) => a.objectKey));
  }

  async addAttachment(
    user: RequestUser,
    id: string,
    dto: AddTitleServiceAttachmentDto,
    file: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    await this.requireOwned(user, id);
    if (!(TITLE_DOC_KINDS as readonly string[]).includes(dto.kind)) {
      throw new BadRequestException('Loại giấy tờ không hợp lệ.');
    }
    this.assertUploadFile(file);
    const fileName = this.safeFileName(file.originalname);
    const uploaded = await this.storage.uploadPrivate({
      folder: `title-services/${id}`,
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: fileName,
    });
    try {
      const updated = await this.prisma.titleService.update({
        where: { id },
        data: {
          attachments: {
            create: {
              kind: dto.kind,
              fileName,
              objectKey: uploaded.objectKey,
              createdByEmployeeId: user.id,
            },
          },
        },
        include: DETAIL_INCLUDE,
      });
      return toDetail(updated);
    } catch (err) {
      await this.storage.delete(uploaded.objectKey, 'private');
      throw err;
    }
  }

  async attachmentSignedUrl(user: RequestUser, id: string, attachmentId: string) {
    const row = await this.requireOwned(user, id);
    const att = row.attachments.find((a) => a.id === attachmentId);
    if (!att) throw new NotFoundException('Không tìm thấy tài liệu.');
    try {
      await this.prisma.titleServiceAttachmentView.create({
        data: {
          attachmentId: att.id,
          viewedByEmployeeId: user.id,
        },
      });
    } catch {
      // Không chặn xem file nếu ghi nhật ký lỗi.
    }
    const expiresIn = SIGNED_URL_TTL_SEC;
    const url = await this.storage.getPrivateSignedUrl(att.objectKey, expiresIn);
    return {
      url,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  async removeAttachment(user: RequestUser, id: string, attachmentId: string) {
    const row = await this.requireOwned(user, id);
    const att = row.attachments.find((a) => a.id === attachmentId);
    if (!att) throw new NotFoundException('Không tìm thấy tài liệu.');
    await this.prisma.$transaction([
      this.prisma.titleServiceAttachment.delete({ where: { id: attachmentId } }),
      this.prisma.titleService.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);
    await this.storage.delete(att.objectKey, 'private');
  }

  async addProgress(user: RequestUser, id: string, dto: AddTitleServiceProgressDto) {
    await this.requireOwned(user, id);
    const happenedAt = this.parseDate(dto.happenedAt) ?? new Date();
    const updated = await this.prisma.titleService.update({
      where: { id },
      data: {
        progress: {
          create: {
            stepType: dto.stepType,
            note: dto.note?.trim() || null,
            happenedAt,
            createdByEmployeeId: user.id,
          },
        },
      },
      include: DETAIL_INCLUDE,
    });
    return toDetail(updated);
  }

  async addMoney(user: RequestUser, id: string, dto: AddTitleServiceMoneyDto) {
    await this.requireOwned(user, id);
    const amount = this.parsePrice(dto.amountVnd);
    if (amount == null || amount <= 0n) {
      throw new BadRequestException('Nhập số tiền hợp lệ.');
    }
    const happenedAt = this.parseDate(dto.happenedAt) ?? new Date();
    const updated = await this.prisma.titleService.update({
      where: { id },
      data: {
        moneyEntries: {
          create: {
            kind: dto.kind,
            title: dto.title.trim(),
            amountVnd: amount,
            note: dto.note?.trim() || null,
            happenedAt,
            createdByEmployeeId: user.id,
          },
        },
      },
      include: DETAIL_INCLUDE,
    });
    return toDetail(updated);
  }

  async removeProgress(user: RequestUser, id: string, progressId: string) {
    const row = await this.requireOwned(user, id);
    const entry = row.progress.find((p) => p.id === progressId);
    if (!entry) throw new NotFoundException('Không tìm thấy bước tiến độ.');
    await this.prisma.$transaction([
      this.prisma.titleServiceProgress.delete({ where: { id: progressId } }),
      this.prisma.titleService.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);
  }

  async removeMoney(user: RequestUser, id: string, moneyId: string) {
    const row = await this.requireOwned(user, id);
    const entry = row.moneyEntries.find((e) => e.id === moneyId);
    if (!entry) throw new NotFoundException('Không tìm thấy khoản tiền.');
    await this.prisma.$transaction([
      this.prisma.titleServiceMoney.delete({ where: { id: moneyId } }),
      this.prisma.titleService.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);
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
      throw new NotFoundException('Không tìm thấy hồ sơ sổ đỏ.');
    }
  }

  private async requireOwned(user: RequestUser, id: string) {
    const row = await this.requireDetail(id);
    this.assertCanAccess(user, row.createdByEmployeeId);
    return row;
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
    // Max số thật — không orderBy code (chuỗi sai sau 9999).
    const rows = await this.prisma.titleService.findMany({
      where: { code: { startsWith: prefix } },
      select: { code: true },
    });
    let max = 0;
    for (const row of rows) {
      const m = row.code.match(/^SD-\d{4}-(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }

  private isCodeUniqueConflict(err: unknown): boolean {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') {
      return false;
    }
    const target = err.meta?.target;
    if (Array.isArray(target)) {
      return target.some((x) => String(x).toLowerCase().includes('code'));
    }
    return String(target ?? '').toLowerCase().includes('code');
  }

  private assertUploadFile(file: { buffer: Buffer; mimetype: string }) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Thiếu file tài liệu.');
    }
    if (file.buffer.length > TITLE_FILE_MAX_BYTES) {
      throw new BadRequestException('File tối đa 12 MB.');
    }
    const mime = String(file.mimetype || '').toLowerCase();
    if (!(TITLE_FILE_MIMES as readonly string[]).includes(mime)) {
      throw new BadRequestException('Chỉ nhận ảnh (JPEG/PNG/WebP/GIF) hoặc PDF.');
    }
  }

  private safeFileName(original?: string): string {
    const raw = (original ?? '').split(/[/\\]/).pop()?.trim() || 'tai-lieu';
    return raw.replace(/[^\w.\- ()à-ỹÀ-Ỹ]/gi, '_').slice(0, 180) || 'tai-lieu';
  }

  private async deletePrivateKeys(keys: string[]) {
    for (const key of keys) {
      if (!key) continue;
      await this.storage.delete(key, 'private');
    }
  }
}
