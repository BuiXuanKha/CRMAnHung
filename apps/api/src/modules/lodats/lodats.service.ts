import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { countPublicImageKeyRefs } from '../../storage/retarget-public-key';
import type {
  ChangeLodatOwnerDto,
  CreateLodatDto,
  ListLodatsQueryDto,
  UpdateLodatDto,
  UpdateLodatImageRotationDto,
  UpdateLodatSaleStatusDto,
} from './dto/lodat.dto';
import { listLodatTransactionHistory } from './lodat-transaction-history';
import {
  copyPublicImageToSeoLotKey,
  retargetLodatSeoImages,
  uniqueSeoLotImageKey,
} from './lodat-seo-image-upload';
import {
  facebookPageUrlFromRawMeta,
  LODAT_KIND_LABELS,
  LODAT_SALE_STATUS_LABELS,
  LodatKind,
  LodatSaleStatus,
  formatLodatWebUpdateArea,
  formatLodatWebUpdateMeters,
  formatLodatWebUpdatePrice,
  formatLodatWebUpdateText,
  parseLodatWebUpdateChanges,
  type LodatWebUpdateChange,
} from '@crmanhung/shared';
import { PublicContentService } from '../public-content/public-content.service';

const ADDRESS_INCLUDE = {
  province: { select: { name: true, isHidden: true } },
  district: { select: { name: true, isHidden: true } },
  ward: { select: { id: true, name: true, isHidden: true } },
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { id: true, objectKey: true },
  },
} satisfies Prisma.AddressInclude;

const LIST_INCLUDE = {
  address: { include: ADDRESS_INCLUDE },
  projectLot: {
    include: {
      address: { include: ADDRESS_INCLUDE },
    },
  },
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { id: true, objectKey: true, rotationDeg: true },
  },
  maps: {
    where: { isActive: true },
    take: 1,
    orderBy: [{ updatedAt: 'desc' as const }],
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          isHidden: true,
          phones: {
            orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
            select: { phone: true, label: true },
          },
          facebook: {
            select: {
              customerUid: true,
              threadId: true,
              facebookName: true,
              scanSource: true,
              scanSourceLabel: true,
              employeeFacebookUid: true,
              rawMeta: true,
              avatarObjectKey: true,
            },
          },
        },
      },
    },
  },
  createdBy: { select: { id: true, fullName: true } },
  publicListing: {
    select: { bodyHtml: true, needsWebUpdate: true, needsWebUpdateChanges: true },
  },
} satisfies Prisma.LodatInclude;

type LodatRow = Prisma.LodatGetPayload<{ include: typeof LIST_INCLUDE }>;

type GalleryImage = {
  id: string | null;
  url: string;
  rotationDeg: number;
  source: 'lodat' | 'address';
};

@Injectable()
export class LodatsService {
  private readonly logger = new Logger(LodatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly publicContent: PublicContentService,
  ) {}

  private async syncPublicListing(
    lodatId: string,
    changes?: LodatWebUpdateChange[],
  ): Promise<void> {
    try {
      await this.publicContent.syncListingFromLodat(lodatId, {
        ...(changes?.length ? { changes } : {}),
      });
    } catch (err) {
      this.logger.warn(
        `Public listing sync skipped for lodat ${lodatId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /** Snapshot thuộc tính CRM ảnh hưởng bài web (để liệt kê cũ → mới). */
  private webFacingSnapshot(row: LodatRow): {
    title: string;
    address: string;
    areaM2: number | null;
    frontageM: number | null;
    direction: string;
    kind: string;
    status: string;
    priceVnd: number | null;
    priceNote: string;
  } {
    const mapped = this.mapRow(row);
    return {
      title: mapped.title,
      address: mapped.address?.trim() || '',
      areaM2: mapped.areaM2 ?? null,
      frontageM: mapped.frontageM ?? null,
      direction: mapped.direction?.trim() || '',
      kind: mapped.kind,
      status: mapped.status,
      priceVnd: mapped.priceVnd ?? null,
      priceNote: mapped.priceNote?.trim() || '',
    };
  }

  private diffWebFacingChanges(
    before: ReturnType<LodatsService['webFacingSnapshot']>,
    after: ReturnType<LodatsService['webFacingSnapshot']>,
  ): LodatWebUpdateChange[] {
    const push = (
      key: string,
      label: string,
      from: string,
      to: string,
      out: LodatWebUpdateChange[],
    ) => {
      if (from === to) return;
      out.push({ key, label, from, to });
    };
    const out: LodatWebUpdateChange[] = [];
    push(
      'title',
      'Tiêu đề',
      formatLodatWebUpdateText(before.title),
      formatLodatWebUpdateText(after.title),
      out,
    );
    push(
      'address',
      'Địa chỉ',
      formatLodatWebUpdateText(before.address),
      formatLodatWebUpdateText(after.address),
      out,
    );
    push(
      'areaM2',
      'Diện tích',
      formatLodatWebUpdateArea(before.areaM2),
      formatLodatWebUpdateArea(after.areaM2),
      out,
    );
    push(
      'frontageM',
      'Mặt tiền',
      formatLodatWebUpdateMeters(before.frontageM),
      formatLodatWebUpdateMeters(after.frontageM),
      out,
    );
    push(
      'direction',
      'Hướng',
      formatLodatWebUpdateText(before.direction),
      formatLodatWebUpdateText(after.direction),
      out,
    );
    const kindLabel = (k: string) =>
      k === LodatKind.NHA || k === 'NHA'
        ? LODAT_KIND_LABELS[LodatKind.NHA]
        : LODAT_KIND_LABELS[LodatKind.DAT];
    push('kind', 'Phân loại', kindLabel(before.kind), kindLabel(after.kind), out);
    const statusLabel = (s: string) => {
      if (
        s === LodatSaleStatus.DANG_BAN ||
        s === LodatSaleStatus.TAM_DUNG ||
        s === LodatSaleStatus.KHONG_BAN ||
        s === LodatSaleStatus.DAT_COC ||
        s === LodatSaleStatus.DA_BAN
      ) {
        return LODAT_SALE_STATUS_LABELS[s];
      }
      return s || '—';
    };
    push(
      'status',
      'Trạng thái bán',
      statusLabel(before.status),
      statusLabel(after.status),
      out,
    );
    push(
      'priceVnd',
      'Giá',
      formatLodatWebUpdatePrice(before.priceVnd),
      formatLodatWebUpdatePrice(after.priceVnd),
      out,
    );
    push(
      'priceNote',
      'Ghi chú giá',
      formatLodatWebUpdateText(before.priceNote),
      formatLodatWebUpdateText(after.priceNote),
      out,
    );
    return out;
  }

  private async ensurePublicListing(lodatId: string): Promise<void> {
    try {
      await this.publicContent.ensureListingForLodat(lodatId);
    } catch (err) {
      this.logger.warn(
        `Public listing ensure skipped for lodat ${lodatId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private publicUrl(objectKey: string | null | undefined): string | null {
    if (!objectKey) return null;
    if (!this.storage.isConfigured()) return null;
    return this.storage.publicUrl(objectKey);
  }

  private toPriceNumber(value: bigint | number | null | undefined): number | null {
    if (value == null) return null;
    const n = typeof value === 'bigint' ? Number(value) : Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private formatAddress(addr: {
    detail: string | null;
    ward?: { name: string; isHidden: boolean } | null;
    district?: { name: string; isHidden: boolean } | null;
    province?: { name: string; isHidden: boolean } | null;
  } | null): string | null {
    if (!addr) return null;
    const parts = [
      addr.detail?.trim() || null,
      addr.ward && !addr.ward.isHidden ? addr.ward.name : null,
      addr.district && !addr.district.isHidden ? addr.district.name : null,
      addr.province && !addr.province.isHidden ? addr.province.name : null,
    ].filter(Boolean) as string[];
    return parts.length ? parts.join(', ') : null;
  }

  private resolveAddress(row: LodatRow) {
    if (row.projectLotId && row.projectLot?.address) {
      return row.projectLot.address;
    }
    return row.address;
  }

  /** CDN keys follow title+address at create/edit — not deferred to Đăng web. */
  private async retargetImagesAfterWrite(row: LodatRow): Promise<LodatRow> {
    if (row.projectLotId || !row.images.length) return row;
    try {
      const moved = await retargetLodatSeoImages(this.prisma, this.storage, {
        lodatId: row.id,
        title: row.title?.trim() || 'Lô đất',
        location: this.formatAddress(this.resolveAddress(row)),
        images: row.images,
      });
      if (!moved) return row;
      return this.prisma.lodat.findUniqueOrThrow({
        where: { id: row.id },
        include: LIST_INCLUDE,
      });
    } catch (err) {
      this.logger.warn(
        `SEO image retarget skipped for lodat ${row.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return row;
    }
  }

  /** Keys for cover thumbnail — keep object-key merge order. */
  private coverObjectKeys(row: LodatRow): string[] {
    const addr = this.resolveAddress(row);
    const addressKeys =
      row.projectLotId && addr?.images
        ? addr.images.map((i) => i.objectKey).filter(Boolean)
        : [];
    const lodatKeys = row.images.map((i) => i.objectKey).filter(Boolean);
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const key of [...addressKeys, ...lodatKeys]) {
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(key);
    }
    return merged;
  }

  private galleryImages(row: LodatRow): GalleryImage[] {
    const addr = this.resolveAddress(row);
    const out: GalleryImage[] = [];
    const seen = new Set<string>();

    if (row.projectLotId && addr?.images) {
      for (const img of addr.images) {
        if (!img.objectKey || seen.has(img.objectKey)) continue;
        const url = this.publicUrl(img.objectKey);
        if (!url) continue;
        seen.add(img.objectKey);
        out.push({
          id: null,
          url,
          rotationDeg: 0,
          source: 'address',
        });
      }
    }

    for (const img of row.images) {
      if (!img.objectKey || seen.has(img.objectKey)) continue;
      const url = this.publicUrl(img.objectKey);
      if (!url) continue;
      seen.add(img.objectKey);
      out.push({
        id: img.id,
        url,
        rotationDeg: ((img.rotationDeg % 360) + 360) % 360,
        source: 'lodat',
      });
    }

    return out;
  }

  private wardMeta(row: LodatRow): { wardId: string | null; wardName: string | null } {
    const addr = this.resolveAddress(row);
    const ward = addr?.ward;
    if (!ward || ward.isHidden) {
      return { wardId: ward?.id ?? null, wardName: null };
    }
    return { wardId: ward.id, wardName: ward.name };
  }

  private mapRow(row: LodatRow) {
    const activeMap = row.maps[0] ?? null;
    const lot = row.projectLot;
    const isProject = Boolean(row.projectLotId);
    const title =
      (isProject ? lot?.title : row.title)?.trim() ||
      row.title?.trim() ||
      lot?.title?.trim() ||
      'Lô đất';
    const areaM2 = isProject ? (lot?.areaM2 ?? row.areaM2) : row.areaM2;
    const frontageM = isProject
      ? (lot?.frontageM ?? row.frontageM)
      : row.frontageM;
    const direction = isProject
      ? (lot?.direction ?? row.direction)
      : row.direction;
    const keys = this.coverObjectKeys(row);
    const rawStatus = activeMap?.status ?? 'TAM_DUNG';
    const status =
      rawStatus === 'DANG_BAN' ||
      rawStatus === 'TAM_DUNG' ||
      rawStatus === 'KHONG_BAN'
        ? rawStatus
        : 'TAM_DUNG';
    const kind = row.propertyKind === 'NHA' ? 'NHA' : 'DAT';
    const updatedAt =
      activeMap && activeMap.updatedAt > row.updatedAt
        ? activeMap.updatedAt
        : row.updatedAt;

    return {
      id: row.id,
      title,
      address: this.formatAddress(this.resolveAddress(row)),
      areaM2: areaM2 ?? null,
      frontageM: frontageM ?? null,
      direction: direction?.trim() || null,
      priceVnd: this.toPriceNumber(activeMap?.priceVnd),
      priceNote: activeMap?.priceNote ?? null,
      brokerFeeNote: activeMap?.brokerFeeNote ?? null,
      commissionPercent: null as number | null,
      kind,
      status,
      coverImageUrl: this.publicUrl(keys[0] ?? null),
      extraPhotoCount: Math.max(0, keys.length - 1),
      customerHint: activeMap?.customer?.fullName ?? null,
      projectLotId: row.projectLotId ?? null,
      createdByEmployeeName: row.createdBy?.fullName ?? null,
      hasWebBody: Boolean(row.publicListing?.bodyHtml?.trim()),
      needsWebUpdate: Boolean(row.publicListing?.needsWebUpdate),
      needsWebUpdateChanges: parseLodatWebUpdateChanges(
        row.publicListing?.needsWebUpdateChanges,
      ),
      updatedAt: updatedAt.toISOString(),
    };
  }

  private async mapDetail(row: LodatRow, user: RequestUser) {
    const base = this.mapRow(row);
    const images = this.galleryImages(row);
    const activeMap = row.maps[0] ?? null;
    const customer = activeMap?.customer;
    const note =
      (row.projectLotId ? row.projectLot?.note : null) || row.note || null;
    const { wardName } = this.wardMeta(row);
    const isProject = Boolean(row.projectLotId);
    const canAccess =
      user.role === 'ADMIN' || row.createdByEmployeeId === user.id;
    const [ownerHistory, transactionHistory] = await Promise.all([
      this.listOwnerHistory(row.id),
      listLodatTransactionHistory(this.prisma, row.id),
    ]);
    return {
      ...base,
      note: note?.trim() || null,
      addressId: isProject ? null : (row.addressId ?? null),
      mapNote: activeMap?.note ?? null,
      images,
      imageUrls: images.map((i) => i.url),
      wardName,
      owner: customer
        ? {
            customerId: customer.id,
            fullName: customer.fullName,
            isHidden: customer.isHidden,
            phones: (customer.phones ?? []).map((ph) => ({
              phone: ph.phone,
              label: ph.label ?? null,
            })),
            facebook: customer.facebook
              ? {
                  customerUid: customer.facebook.customerUid,
                  threadId: customer.facebook.threadId,
                  facebookName: customer.facebook.facebookName,
                  avatarUrl: this.publicUrl(customer.facebook.avatarObjectKey),
                  scanSource: customer.facebook.scanSource,
                  scanSourceLabel: customer.facebook.scanSourceLabel,
                  employeeFacebookUid: customer.facebook.employeeFacebookUid,
                  pageUrl: facebookPageUrlFromRawMeta(customer.facebook.rawMeta),
                }
              : null,
          }
        : null,
      canEditSpecs: canAccess && !isProject,
      canEditMap: canAccess,
      // Owner: Admin không đổi chủ — chỉ NV tạo luồng.
      canChangeOwner:
        user.role !== 'ADMIN' && row.createdByEmployeeId === user.id,
      canEditImages: canAccess,
      ownerHistory,
      transactionHistory,
    };
  }

  private async listOwnerHistory(lodatId: string) {
    const maps = await this.prisma.lodatCustomerMap.findMany({
      where: { lodatId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: {
        customer: { select: { id: true, fullName: true } },
      },
    });
    return maps.map((m) => ({
      id: m.id,
      customerId: m.customerId,
      fullName: m.customer.fullName,
      isActive: m.isActive,
      status: m.status,
      priceVnd: this.toPriceNumber(m.priceVnd),
      startedAt: m.createdAt.toISOString(),
      endedAt: m.endedAt?.toISOString() ?? null,
    }));
  }

  private ownershipWhere(user: RequestUser): Prisma.LodatWhereInput {
    if (user.role === 'ADMIN') return {};
    return { createdByEmployeeId: user.id };
  }

  private assertCanAccess(user: RequestUser, createdByEmployeeId: string) {
    if (user.role === 'ADMIN') return;
    if (createdByEmployeeId !== user.id) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }
  }

  /** Lọc cột chạy trên API để phân trang đúng (lodats.md §12.1.2). */
  private columnFilterWhere(query: ListLodatsQueryDto): Prisma.LodatWhereInput[] {
    const and: Prisma.LodatWhereInput[] = [];

    if (query.priceBracket) {
      const pb = query.priceBracket;
      const M = 1_000_000;
      const priceCond: Prisma.LodatCustomerMapWhereInput =
        pb === 'no_price'
          ? { OR: [{ priceVnd: null }, { priceVnd: { lte: 0 } }] }
          : pb === 'lt_500m'
            ? { priceVnd: { gt: 0, lt: 500 * M } }
            : pb === '500m_1b'
              ? { priceVnd: { gte: 500 * M, lt: 1000 * M } }
              : pb === '1b_15b'
                ? { priceVnd: { gte: 1000 * M, lt: 1500 * M } }
                : pb === '15b_2b'
                  ? { priceVnd: { gte: 1500 * M, lt: 2000 * M } }
                  : pb === '2b_25b'
                    ? { priceVnd: { gte: 2000 * M, lt: 2500 * M } }
                    : pb === '25b_3b'
                      ? { priceVnd: { gte: 2500 * M, lt: 3000 * M } }
                      : { priceVnd: { gte: 3000 * M } };
      and.push({ maps: { some: { isActive: true, ...priceCond } } });
    }

    if (query.areaBracket) {
      const range: Prisma.FloatNullableFilter =
        query.areaBracket === '1_100'
          ? { gte: 1, lte: 100 }
          : query.areaBracket === '100_200'
            ? { gt: 100, lte: 200 }
            : { gt: 200 };
      and.push({
        OR: [
          { AND: [{ projectLotId: null }, { areaM2: range }] },
          { projectLot: { areaM2: range } },
        ],
      });
    }

    const direction = query.direction?.trim();
    if (direction) {
      and.push({
        OR: [
          {
            AND: [
              { projectLotId: null },
              { direction: { equals: direction, mode: 'insensitive' } },
            ],
          },
          { projectLot: { direction: { equals: direction, mode: 'insensitive' } } },
        ],
      });
    }

    if (query.photo) {
      const hasPhoto: Prisma.LodatWhereInput = {
        OR: [
          { images: { some: {} } },
          { projectLot: { address: { images: { some: {} } } } },
        ],
      };
      and.push(query.photo === 'has' ? hasPhoto : { NOT: hasPhoto });
    }

    if (query.addressFilter === 'has') {
      and.push({
        OR: [{ addressId: { not: null } }, { projectLotId: { not: null } }],
      });
    } else if (query.addressFilter === 'empty') {
      and.push({ addressId: null, projectLotId: null });
    }

    if (query.webBody === 'has') {
      and.push({
        publicListing: { is: { bodyHtml: { not: '' } } },
      });
    } else if (query.webBody === 'empty') {
      and.push({
        OR: [
          { publicListing: { is: null } },
          { publicListing: { is: { bodyHtml: '' } } },
        ],
      });
    }

    return and;
  }

  async list(user: RequestUser, query: ListLodatsQueryDto) {
    const and: Prisma.LodatWhereInput[] = [this.ownershipWhere(user)];
    // Chỉ hiện lô đã gắn chủ (có map active)
    and.push({ maps: { some: { isActive: true } } });

    if (query.kind) {
      and.push({ propertyKind: query.kind });
    }

    if (query.pausedOnly) {
      and.push({
        maps: { some: { isActive: true, status: 'TAM_DUNG' } },
      });
    } else if (query.statusIn !== undefined) {
      if (query.statusIn.length === 0) {
        and.push({ id: { in: [] } });
      } else {
        and.push({
          maps: {
            some: { isActive: true, status: { in: query.statusIn } },
          },
        });
      }
    } else if (query.status) {
      and.push({
        maps: { some: { isActive: true, status: query.status } },
      });
    } else if (!query.includePaused) {
      and.push({
        maps: { some: { isActive: true, status: 'DANG_BAN' } },
      });
    }

    and.push(...this.columnFilterWhere(query));

    const keyword = String(query.keyword || '').trim();
    if (keyword) {
      and.push({
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { direction: { contains: keyword, mode: 'insensitive' } },
          { note: { contains: keyword, mode: 'insensitive' } },
          {
            address: {
              OR: [
                { detail: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
                { ward: { name: { contains: keyword, mode: 'insensitive' } } },
                {
                  district: { name: { contains: keyword, mode: 'insensitive' } },
                },
                {
                  province: { name: { contains: keyword, mode: 'insensitive' } },
                },
              ],
            },
          },
          {
            projectLot: {
              OR: [
                { title: { contains: keyword, mode: 'insensitive' } },
                { direction: { contains: keyword, mode: 'insensitive' } },
                {
                  address: {
                    OR: [
                      { detail: { contains: keyword, mode: 'insensitive' } },
                      {
                        description: {
                          contains: keyword,
                          mode: 'insensitive',
                        },
                      },
                      {
                        ward: {
                          name: { contains: keyword, mode: 'insensitive' },
                        },
                      },
                      {
                        district: {
                          name: { contains: keyword, mode: 'insensitive' },
                        },
                      },
                      {
                        province: {
                          name: { contains: keyword, mode: 'insensitive' },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            maps: {
              some: {
                isActive: true,
                customer: {
                  fullName: { contains: keyword, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      });
    }

    const take = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const skip = Math.max(query.offset ?? 0, 0);
    const where: Prisma.LodatWhereInput = { AND: and };

    const [rows, total] = await Promise.all([
      this.prisma.lodat.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.prisma.lodat.count({ where }),
    ]);

    return { items: rows.map((row) => this.mapRow(row)), total };
  }

  /**
   * Lô đang gắn khách (map active) — panel phải / chi tiết khách.
   * ADMIN xem mọi lô của khách; STAFF chỉ lô mình tạo.
   */
  async listForCustomer(user: RequestUser, customerId: string) {
    const and: Prisma.LodatWhereInput[] = [
      this.ownershipWhere(user),
      {
        maps: {
          some: { customerId, isActive: true },
        },
      },
    ];
    const rows = await this.prisma.lodat.findMany({
      where: { AND: and },
      include: LIST_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
    const items = rows.map((row) => {
      const mapped = this.mapRow(row);
      return {
        id: mapped.id,
        title: mapped.title,
        address: mapped.address,
        areaM2: mapped.areaM2,
        frontageM: mapped.frontageM,
        direction: mapped.direction,
        priceVnd: mapped.priceVnd,
        coverImageUrl: mapped.coverImageUrl,
        extraPhotoCount: mapped.extraPhotoCount,
        status: mapped.status,
      };
    });
    return { items };
  }

  async getById(user: RequestUser, id: string) {
    const row = await this.prisma.lodat.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }
    this.assertCanAccess(user, row.createdByEmployeeId);
    if (!row.maps.length) {
      throw new NotFoundException('Lô đất chưa gắn chủ.');
    }
    return this.mapDetail(row, user);
  }

  async updateSaleStatus(
    user: RequestUser,
    id: string,
    dto: UpdateLodatSaleStatusDto,
  ) {
    const row = await this.prisma.lodat.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }
    this.assertCanAccess(user, row.createdByEmployeeId);
    const activeMap = row.maps[0];
    if (!activeMap) {
      throw new NotFoundException('Lô đất chưa gắn chủ.');
    }

    await this.prisma.lodatCustomerMap.update({
      where: { id: activeMap.id },
      data: { status: dto.status },
    });
    // DB sort theo lodat.updatedAt — chạm khi chỉ map đổi để lô nổi lên đầu list
    await this.prisma.lodat.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const refreshed = await this.prisma.lodat.findUniqueOrThrow({
      where: { id },
      include: LIST_INCLUDE,
    });
    const changes = this.diffWebFacingChanges(
      this.webFacingSnapshot(row),
      this.webFacingSnapshot(refreshed),
    );
    await this.syncPublicListing(id, changes);
    return this.mapDetail(refreshed, user);
  }

  /**
   * Đổi chủ trong luồng NV (lodats.md §0.3 / §12.4.4):
   * đóng map active → tạo map mới (giá/trạng thái từ form, thiếu thì copy).
   */
  async changeOwner(user: RequestUser, id: string, dto: ChangeLodatOwnerDto) {
    const customerId = String(dto.customerId || '').trim();
    if (!customerId) {
      throw new BadRequestException('Chọn khách làm chủ mới.');
    }

    // Owner 2026-09-05: Admin không đổi chủ lô — chỉ NV giữ luồng.
    if (user.role === 'ADMIN') {
      throw new ForbiddenException(
        'Admin không đổi chủ lô. Chỉ nhân viên giữ luồng mới được đổi chủ.',
      );
    }

    const row = await this.prisma.lodat.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }
    this.assertCanAccess(user, row.createdByEmployeeId);

    // BUG-059: không đổi chủ khi còn GD mở (Đã cọc / Đã công chứng).
    const openTx = await this.prisma.transaction.findFirst({
      where: {
        lodatId: id,
        status: { in: ['DA_COC', 'DA_CONG_CHUNG'] },
      },
      select: { id: true },
    });
    if (openTx) {
      throw new ConflictException(
        'Lô này đang trong trạng thái giao dịch nên không đổi được chủ.',
      );
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, employeeId: true, isHidden: true, fullName: true },
    });
    if (!customer || customer.isHidden) {
      throw new NotFoundException('Không tìm thấy khách hàng.');
    }
    if (customer.employeeId !== user.id) {
      throw new NotFoundException('Không tìm thấy khách hàng.');
    }

    const activeMap = row.maps[0] ?? null;
    if (activeMap && activeMap.customerId === customer.id) {
      throw new BadRequestException('Khách này đã là chủ hiện tại.');
    }

    const now = new Date();
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.lodatCustomerMap.updateMany({
          where: { lodatId: id, isActive: true },
          data: { isActive: false, endedAt: now },
        });
        await tx.lodatCustomerMap.create({
          data: {
            lodatId: id,
            customerId: customer.id,
            priceVnd:
              dto.priceVnd !== undefined
                ? this.parsePrice(dto.priceVnd) ?? null
                : (activeMap?.priceVnd ?? null),
            priceNote:
              dto.priceNote !== undefined
                ? dto.priceNote?.trim() || null
                : (activeMap?.priceNote ?? null),
            brokerFeeNote:
              dto.brokerFeeNote !== undefined
                ? dto.brokerFeeNote?.trim() || null
                : (activeMap?.brokerFeeNote ?? null),
            note:
              dto.mapNote !== undefined
                ? dto.mapNote?.trim() || null
                : (activeMap?.note ?? null),
            status: dto.status ?? activeMap?.status ?? 'DANG_BAN',
            isActive: true,
            createdByEmployeeId: user.id,
          },
        });
        await tx.lodat.update({
          where: { id },
          data: { updatedAt: now },
        });
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Lô đang có chủ active khác (thao tác trùng). Thử lại.',
        );
      }
      throw err;
    }

    const refreshed = await this.prisma.lodat.findUniqueOrThrow({
      where: { id },
      include: LIST_INCLUDE,
    });
    await this.ensurePublicListing(id);
    return this.mapDetail(refreshed, user);
  }

  async listSameWard(user: RequestUser, id: string) {
    const row = await this.prisma.lodat.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }
    this.assertCanAccess(user, row.createdByEmployeeId);
    if (!row.maps.length) {
      throw new NotFoundException('Lô đất chưa gắn chủ.');
    }

    const { wardId, wardName } = this.wardMeta(row);
    if (!wardId) {
      return { wardName: null, items: [], total: 0 };
    }

    // Gợi ý cùng xã: Mở bán + Dừng bán; ẩn Không bán (hồ sơ chủ chưa rao).
    const and: Prisma.LodatWhereInput[] = [
      this.ownershipWhere(user),
      {
        maps: {
          some: {
            isActive: true,
            status: {
              in: [LodatSaleStatus.DANG_BAN, LodatSaleStatus.TAM_DUNG],
            },
          },
        },
      },
      { id: { not: id } },
      {
        OR: [
          { address: { wardId } },
          { projectLot: { address: { wardId } } },
        ],
      },
    ];

    const rows = await this.prisma.lodat.findMany({
      where: { AND: and },
      include: LIST_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 40,
    });

    const items = rows
      .filter((r) => r.maps.length > 0)
      .map((r) => this.mapRow(r))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return { wardName, items, total: items.length };
  }

  async updateImageRotation(
    user: RequestUser,
    lodatId: string,
    imageId: string,
    dto: UpdateLodatImageRotationDto,
  ) {
    const row = await this.prisma.lodat.findUnique({
      where: { id: lodatId },
      include: LIST_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }
    this.assertCanAccess(user, row.createdByEmployeeId);

    const image = await this.prisma.lodatImage.findFirst({
      where: { id: imageId, lodatId },
    });
    if (!image) {
      throw new NotFoundException(
        'Không tìm thấy ảnh lô (ảnh dự án chung không lưu xoay tại đây).',
      );
    }

    const rotationDeg = ((dto.rotationDeg % 360) + 360) % 360;
    if (rotationDeg % 90 !== 0) {
      throw new BadRequestException('Góc xoay phải là bội số của 90°.');
    }
    await this.prisma.lodatImage.update({
      where: { id: image.id },
      data: { rotationDeg },
    });

    const refreshed = await this.prisma.lodat.findUniqueOrThrow({
      where: { id: lodatId },
      include: LIST_INCLUDE,
    });
    return this.mapDetail(refreshed, user);
  }

  private parseOptionalNumber(value: unknown): number | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    if (!Number.isFinite(n)) {
      throw new BadRequestException('Số không hợp lệ.');
    }
    if (n < 0) {
      throw new BadRequestException('Diện tích / mặt tiền không được âm.');
    }
    return n;
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

  /** Kho lô của một địa chỉ PROJECT — picker form tạo lô (§12.5). */
  async listProjectLots(user: RequestUser, addressId: string) {
    const addr = await this.prisma.address.findUnique({
      where: { id: addressId },
      select: { id: true, kind: true, isHidden: true },
    });
    if (!addr || addr.isHidden) {
      throw new NotFoundException('Không tìm thấy địa chỉ.');
    }
    if (addr.kind !== 'PROJECT') {
      throw new BadRequestException('Địa chỉ này không phải dự án.');
    }
    const lots = await this.prisma.projectLot.findMany({
      where: { addressId, isHidden: false },
      orderBy: [{ title: 'asc' }, { createdAt: 'asc' }],
      include: {
        lodats: {
          where: {
            createdByEmployeeId: user.id,
            maps: { some: { isActive: true } },
          },
          select: { id: true },
        },
      },
    });
    return {
      addressId,
      items: lots.map((lot) => ({
        id: lot.id,
        title: lot.title,
        areaM2: lot.areaM2 ?? null,
        frontageM: lot.frontageM ?? null,
        direction: lot.direction?.trim() || null,
        note: lot.note?.trim() || null,
        takenByMe: lot.lodats.length > 0,
      })),
    };
  }

  /**
   * Tạo lô từ khách (§12.5): dân (addressId REGULAR + specs)
   * hoặc dự án (projectLotId trỏ kho). Khách = chủ gắn ngay (map active).
   */

  private static readonly TEMP_IMAGE_TTL_MS = 24 * 60 * 60 * 1000;

  /** Xoá ảnh tạm quá hạn (orphan form tạo lô). */
  private async purgeExpiredTempImages(): Promise<void> {
    const cutoff = new Date(Date.now() - LodatsService.TEMP_IMAGE_TTL_MS);
    const expired = await this.prisma.lodatTempImage.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true, objectKey: true },
      take: 100,
    });
    for (const row of expired) {
      await this.prisma.lodatTempImage.delete({ where: { id: row.id } }).catch(() => undefined);
      const refs = await countPublicImageKeyRefs(this.prisma, row.objectKey);
      if (refs === 0) {
        try {
          await this.storage.delete(row.objectKey, 'public');
        } catch {
          // orphan ok
        }
      }
    }
  }


  /**
   * Gắn ảnh temp của NV vào lô: copy SEO → LodatImage → xoá temp.
   * Trả về số ảnh đã gắn.
   */
  private async attachTempImages(
    user: RequestUser,
    lodatId: string,
    tempImageIds: string[],
    opts: { title: string; location: string | null; startSortOrder: number },
  ): Promise<number> {
    const tempIds = tempImageIds.slice(0, 5);
    if (!tempIds.length) return 0;
    const temps = await this.prisma.lodatTempImage.findMany({
      where: { id: { in: tempIds }, createdByEmployeeId: user.id },
    });
    const ordered = tempIds
      .map((id) => temps.find((t) => t.id === id))
      .filter((t): t is (typeof temps)[number] => Boolean(t));
    if (ordered.length !== tempIds.length) {
      throw new BadRequestException('Một số ảnh tạm không còn hợp lệ. Chọn lại ảnh.');
    }
    let sortOrder = opts.startSortOrder;
    for (const temp of ordered) {
      const objectKey = await copyPublicImageToSeoLotKey(this.storage, temp.objectKey, {
        lodatId,
        title: opts.title,
        location: opts.location,
        index: sortOrder + 1,
      });
      await this.prisma.lodatImage.create({
        data: {
          lodatId,
          objectKey,
          sortOrder,
          rotationDeg: 0,
        },
      });
      sortOrder += 1;
      await this.prisma.lodatTempImage.delete({ where: { id: temp.id } });
      const refs = await countPublicImageKeyRefs(this.prisma, temp.objectKey);
      if (refs === 0) {
        try {
          await this.storage.delete(temp.objectKey, 'public');
        } catch {
          // orphan ok
        }
      }
    }
    return ordered.length;
  }

  async uploadTempImage(
    user: RequestUser,
    sessionId: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    const session = String(sessionId || '').trim();
    if (session.length < 8 || session.length > 80) {
      throw new BadRequestException('Session upload không hợp lệ.');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(session)) {
      throw new BadRequestException('Session upload không hợp lệ.');
    }
    await this.purgeExpiredTempImages();
    const existing = await this.prisma.lodatTempImage.count({
      where: { sessionId: session, createdByEmployeeId: user.id },
    });
    if (existing >= 5) {
      throw new BadRequestException('Tối đa 5 ảnh tạm mỗi lần tạo lô.');
    }
    const objectKey = `lodats/temp/${user.id}/${session}/${randomUUID()}.webp`;
    const uploaded = await this.storage.upload({
      folder: `lodats/temp/${user.id}`,
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      objectKey,
      contentFileName: `${randomUUID()}.webp`,
    });
    const row = await this.prisma.lodatTempImage.create({
      data: {
        sessionId: session,
        objectKey: uploaded.objectKey,
        createdByEmployeeId: user.id,
      },
    });
    return {
      id: row.id,
      sessionId: row.sessionId,
      objectKey: row.objectKey,
      url: this.publicUrl(row.objectKey) ?? uploaded.url,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteTempImage(user: RequestUser, tempImageId: string) {
    const row = await this.prisma.lodatTempImage.findFirst({
      where: { id: tempImageId, createdByEmployeeId: user.id },
    });
    if (!row) throw new NotFoundException('Không tìm thấy ảnh tạm.');
    await this.prisma.lodatTempImage.delete({ where: { id: row.id } });
    const refs = await countPublicImageKeyRefs(this.prisma, row.objectKey);
    if (refs === 0) {
      try {
        await this.storage.delete(row.objectKey, 'public');
      } catch {
        // orphan ok
      }
    }
    return { ok: true as const };
  }

  async create(user: RequestUser, dto: CreateLodatDto) {
    if (user.role === 'ADMIN') {
      throw new ForbiddenException(
        'Admin không tạo lô đất từ menu khách. Nhân viên tạo lô từ hồ sơ khách của mình.',
      );
    }
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true, employeeId: true, isHidden: true },
    });
    if (!customer || customer.isHidden) {
      throw new NotFoundException('Không tìm thấy khách hàng.');
    }
    if (customer.employeeId !== user.id) {
      throw new NotFoundException('Không tìm thấy khách hàng.');
    }

    const isProject = Boolean(dto.projectLotId);
    if (isProject === Boolean(dto.addressId)) {
      throw new BadRequestException(
        'Chọn địa chỉ đất dân hoặc lô kho dự án (một trong hai).',
      );
    }

    let lodatData: Prisma.LodatCreateInput;
    if (isProject) {
      const lot = await this.prisma.projectLot.findUnique({
        where: { id: dto.projectLotId! },
        select: { id: true, isHidden: true },
      });
      if (!lot || lot.isHidden) {
        throw new NotFoundException('Không tìm thấy lô trong kho dự án.');
      }
      // 1 luồng active / NV / lô kho (§0.2)
      const existing = await this.prisma.lodat.findFirst({
        where: {
          projectLotId: lot.id,
          createdByEmployeeId: user.id,
          maps: { some: { isActive: true } },
        },
        select: { id: true },
      });
      if (existing) {
        throw new BadRequestException(
          'Bạn đang giữ một luồng mở trên lô kho này. Đổi chủ trong luồng đó thay vì tạo mới.',
        );
      }
      lodatData = {
        projectLot: { connect: { id: lot.id } },
        propertyKind: dto.kind ?? 'DAT',
        createdBy: { connect: { id: user.id } },
      };
    } else {
      const title = String(dto.title ?? '').trim();
      if (!title) {
        throw new BadRequestException('Cần nhập tiêu đề lô đất.');
      }
      const addrTarget = await this.prisma.address.findUnique({
        where: { id: dto.addressId! },
        select: { id: true, kind: true, isHidden: true },
      });
      if (!addrTarget || addrTarget.isHidden) {
        throw new NotFoundException('Không tìm thấy địa chỉ.');
      }
      if (addrTarget.kind !== 'REGULAR') {
        throw new BadRequestException('Lô đất dân chỉ chọn địa chỉ loại Đất dân.');
      }
      lodatData = {
        title,
        address: { connect: { id: addrTarget.id } },
        areaM2: this.parseOptionalNumber(dto.areaM2) ?? null,
        frontageM: this.parseOptionalNumber(dto.frontageM) ?? null,
        direction: dto.direction?.trim() || null,
        note: dto.note?.trim() || null,
        propertyKind: dto.kind ?? 'DAT',
        createdBy: { connect: { id: user.id } },
      };
    }

    const created = await this.prisma.lodat.create({
      data: {
        ...lodatData,
        maps: {
          create: {
            customer: { connect: { id: customer.id } },
            priceVnd: this.parsePrice(dto.priceVnd) ?? null,
            priceNote: dto.priceNote?.trim() || null,
            brokerFeeNote: dto.brokerFeeNote?.trim() || null,
            note: dto.mapNote?.trim() || null,
            status: dto.status ?? 'KHONG_BAN',
            isActive: true,
            createdBy: { connect: { id: user.id } },
          },
        },
      },
      select: { id: true },
    });

    const chatIds = (dto.chatImageIds ?? []).slice(0, 5);
    const tempIds = (dto.tempImageIds ?? []).slice(0, 5);
    if (chatIds.length + tempIds.length > 5) {
      await this.prisma.lodat.delete({ where: { id: created.id } }).catch(() => undefined);
      throw new BadRequestException('Tối đa 5 ảnh (chat + file).');
    }

    await this.purgeExpiredTempImages();

    // Ảnh chat reuse + ảnh temp — copy sang key SEO của lô.
    // BUG-034: lỗi copy/ghi ảnh → xóa lô vừa tạo (không để mồ côi / retry trùng).
    if (chatIds.length || tempIds.length) {
      const copiedKeys: string[] = [];
      const claimedTempIds: string[] = [];
      try {
        const createdFull = await this.prisma.lodat.findUniqueOrThrow({
          where: { id: created.id },
          include: LIST_INCLUDE,
        });
        const title =
          createdFull.title?.trim() ||
          createdFull.projectLot?.title?.trim() ||
          'Lô đất';
        const location = this.formatAddress(this.resolveAddress(createdFull));
        let sortOrder = 0;

        if (chatIds.length) {
          const chatImages = await this.prisma.customerMessengerImage.findMany({
            where: {
              id: { in: chatIds },
              message: { customerFacebook: { customerId: customer.id } },
            },
            orderBy: [{ createdAt: 'asc' }],
            select: { id: true, objectKey: true, rotationDeg: true },
          });
          const ordered = chatIds
            .map((id) => chatImages.find((img) => img.id === id))
            .filter((img): img is (typeof chatImages)[number] => Boolean(img));
          for (let i = 0; i < ordered.length; i += 1) {
            const img = ordered[i]!;
            copiedKeys.push(
              await copyPublicImageToSeoLotKey(this.storage, img.objectKey, {
                lodatId: created.id,
                title,
                location,
                index: sortOrder + 1,
              }),
            );
            await this.prisma.lodatImage.create({
              data: {
                lodatId: created.id,
                objectKey: copiedKeys[copiedKeys.length - 1]!,
                sortOrder: sortOrder,
                rotationDeg: ((img.rotationDeg % 360) + 360) % 360,
              },
            });
            sortOrder += 1;
          }
        }

        if (tempIds.length) {
          const temps = await this.prisma.lodatTempImage.findMany({
            where: {
              id: { in: tempIds },
              createdByEmployeeId: user.id,
            },
          });
          const orderedTemps = tempIds
            .map((id) => temps.find((t) => t.id === id))
            .filter((t): t is (typeof temps)[number] => Boolean(t));
          if (orderedTemps.length !== tempIds.length) {
            throw new BadRequestException('Một số ảnh tạm không còn hợp lệ. Chọn lại ảnh.');
          }
          for (const temp of orderedTemps) {
            copiedKeys.push(
              await copyPublicImageToSeoLotKey(this.storage, temp.objectKey, {
                lodatId: created.id,
                title,
                location,
                index: sortOrder + 1,
              }),
            );
            await this.prisma.lodatImage.create({
              data: {
                lodatId: created.id,
                objectKey: copiedKeys[copiedKeys.length - 1]!,
                sortOrder: sortOrder,
                rotationDeg: 0,
              },
            });
            sortOrder += 1;
            claimedTempIds.push(temp.id);
          }
          // Xoá bản ghi temp + object tạm (đã copy sang SEO).
          for (const temp of orderedTemps) {
            await this.prisma.lodatTempImage.delete({ where: { id: temp.id } });
            const refs = await countPublicImageKeyRefs(this.prisma, temp.objectKey);
            if (refs === 0) {
              try {
                await this.storage.delete(temp.objectKey, 'public');
              } catch {
                // orphan ok
              }
            }
          }
        }
      } catch (err) {
        this.logger.warn(
          `Image attach failed for lodat ${created.id}; rolling back create`,
          err instanceof Error ? err.stack : err,
        );
        await this.prisma.lodat.delete({ where: { id: created.id } }).catch((delErr) => {
          this.logger.error(
            `Failed to roll back lodat ${created.id} after image error`,
            delErr instanceof Error ? delErr.stack : delErr,
          );
        });
        for (const key of copiedKeys) {
          await this.storage.delete(key, 'public');
        }
        throw err;
      }
    }

    const refreshed = await this.prisma.lodat.findUniqueOrThrow({
      where: { id: created.id },
      include: LIST_INCLUDE,
    });
    await this.ensurePublicListing(created.id);
    return this.mapDetail(refreshed, user);
  }


  async update(user: RequestUser, id: string, dto: UpdateLodatDto) {
    const row = await this.prisma.lodat.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });
    if (!row) throw new NotFoundException('Không tìm thấy lô đất.');
    this.assertCanAccess(user, row.createdByEmployeeId);
    const activeMap = row.maps[0];
    if (!activeMap) throw new NotFoundException('Lô đất chưa gắn chủ.');

    const isProject = Boolean(row.projectLotId);
    const lodatData: Prisma.LodatUpdateInput = {};
    const beforeSnap = this.webFacingSnapshot(row);

    if (!isProject) {
      if (dto.title !== undefined) {
        const title = String(dto.title ?? '').trim();
        if (!title) throw new BadRequestException('Cần nhập tiêu đề lô đất.');
        lodatData.title = title;
      }
      if (dto.addressId !== undefined) {
        if (!dto.addressId) {
          throw new BadRequestException('Cần chọn địa chỉ đất dân.');
        }
        const addr = await this.prisma.address.findUnique({
          where: { id: dto.addressId },
        });
        if (!addr || addr.isHidden) {
          throw new NotFoundException('Không tìm thấy địa chỉ.');
        }
        if (addr.kind !== 'REGULAR') {
          throw new BadRequestException('Lô đất dân chỉ chọn địa chỉ loại Đất dân.');
        }
        lodatData.address = { connect: { id: addr.id } };
      }
      if (dto.areaM2 !== undefined) {
        lodatData.areaM2 = this.parseOptionalNumber(dto.areaM2) ?? null;
      }
      if (dto.frontageM !== undefined) {
        lodatData.frontageM = this.parseOptionalNumber(dto.frontageM) ?? null;
      }
      if (dto.direction !== undefined) {
        const d = dto.direction?.trim() || null;
        lodatData.direction = d;
      }
      if (dto.note !== undefined) {
        lodatData.note = dto.note?.trim() || null;
      }
      if (dto.kind !== undefined) {
        lodatData.propertyKind = dto.kind;
      }
    } else if (
      dto.title !== undefined ||
      dto.addressId !== undefined ||
      dto.areaM2 !== undefined ||
      dto.frontageM !== undefined ||
      dto.direction !== undefined ||
      dto.note !== undefined ||
      dto.kind !== undefined
    ) {
      // Ignore / soft-reject specs on project lots — map fields still apply below.
      // Only reject if client sent only specs with no map fields? Allow ignore for UX.
    }

    const mapData: Prisma.LodatCustomerMapUpdateInput = {};
    if (dto.status !== undefined) mapData.status = dto.status;
    if (dto.priceVnd !== undefined) {
      mapData.priceVnd = this.parsePrice(dto.priceVnd) ?? null;
    }
    if (dto.priceNote !== undefined) {
      mapData.priceNote = dto.priceNote?.trim() || null;
    }
    if (dto.brokerFeeNote !== undefined) {
      mapData.brokerFeeNote = dto.brokerFeeNote?.trim() || null;
    }
    if (dto.mapNote !== undefined) {
      mapData.note = dto.mapNote?.trim() || null;
    }

    if (Object.keys(lodatData).length) {
      await this.prisma.lodat.update({ where: { id }, data: lodatData });
    }
    if (Object.keys(mapData).length) {
      await this.prisma.lodatCustomerMap.update({
        where: { id: activeMap.id },
        data: mapData,
      });
      if (!Object.keys(lodatData).length) {
        // DB sort theo lodat.updatedAt — chạm khi chỉ map đổi
        await this.prisma.lodat.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
      }
    }

    const tempIds = (dto.tempImageIds ?? []).slice(0, 5);
    if (tempIds.length) {
      await this.purgeExpiredTempImages();
      const current = await this.prisma.lodat.findUniqueOrThrow({
        where: { id },
        include: LIST_INCLUDE,
      });
      const existingLodatImages = current.images.length;
      if (existingLodatImages + tempIds.length > 5) {
        throw new BadRequestException('Tối đa 5 ảnh lô đất.');
      }
      const title =
        (current.projectLotId ? current.projectLot?.title : current.title)?.trim() ||
        current.title?.trim() ||
        current.projectLot?.title?.trim() ||
        'Lô đất';
      const location = this.formatAddress(this.resolveAddress(current));
      await this.attachTempImages(user, id, tempIds, {
        title,
        location,
        startSortOrder: existingLodatImages,
      });
      if (!Object.keys(lodatData).length && !Object.keys(mapData).length) {
        await this.prisma.lodat.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
      }
    }

    const refreshed = await this.prisma.lodat.findUniqueOrThrow({
      where: { id },
      include: LIST_INCLUDE,
    });
    const afterWrite = await this.retargetImagesAfterWrite(refreshed);
    const changes = this.diffWebFacingChanges(beforeSnap, this.webFacingSnapshot(afterWrite));
    const mapped = this.mapDetail(afterWrite, user);
    await this.syncPublicListing(id, changes);
    return mapped;
  }

  async addImage(
    user: RequestUser,
    lodatId: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    const row = await this.prisma.lodat.findUnique({
      where: { id: lodatId },
      include: LIST_INCLUDE,
    });
    if (!row) throw new NotFoundException('Không tìm thấy lô đất.');
    this.assertCanAccess(user, row.createdByEmployeeId);
    if (row.images.length >= 5) {
      throw new BadRequestException('Tối đa 5 ảnh lô đất.');
    }
    const title =
      (row.projectLotId ? row.projectLot?.title : row.title)?.trim() ||
      row.title?.trim() ||
      row.projectLot?.title?.trim() ||
      'Lô đất';
    const location = this.formatAddress(this.resolveAddress(row));
    const { objectKey, fileName } = await uniqueSeoLotImageKey(this.storage, {
      lodatId,
      title,
      location,
      index: row.images.length + 1,
      originalName: file.originalname,
      mime: file.mimetype,
    });
    const uploaded = await this.storage.upload({
      folder: `lodats/${lodatId}`,
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      objectKey,
      contentFileName: fileName,
    });
    await this.prisma.lodatImage.create({
      data: {
        lodatId,
        objectKey: uploaded.objectKey,
        sortOrder: row.images.length,
        rotationDeg: 0,
      },
    });
    const refreshed = await this.prisma.lodat.findUniqueOrThrow({
      where: { id: lodatId },
      include: LIST_INCLUDE,
    });
    return this.mapDetail(await this.retargetImagesAfterWrite(refreshed), user);
  }

  async deleteImage(user: RequestUser, lodatId: string, imageId: string) {
    const row = await this.prisma.lodat.findUnique({ where: { id: lodatId } });
    if (!row) throw new NotFoundException('Không tìm thấy lô đất.');
    this.assertCanAccess(user, row.createdByEmployeeId);
    const image = await this.prisma.lodatImage.findFirst({
      where: { id: imageId, lodatId },
    });
    if (!image) throw new NotFoundException('Không tìm thấy ảnh lô.');
    await this.prisma.lodatImage.delete({ where: { id: imageId } });
    // BUG-060: đếm đủ ref (snapshot GD, địa chỉ, …) — GD cũ còn share key cũng an toàn.
    const refs = await countPublicImageKeyRefs(this.prisma, image.objectKey);
    if (refs === 0) {
      try {
        await this.storage.delete(image.objectKey, 'public');
      } catch {
        // orphan ok
      }
    }
    const refreshed = await this.prisma.lodat.findUniqueOrThrow({
      where: { id: lodatId },
      include: LIST_INCLUDE,
    });
    return this.mapDetail(await this.retargetImagesAfterWrite(refreshed), user);
  }
}
