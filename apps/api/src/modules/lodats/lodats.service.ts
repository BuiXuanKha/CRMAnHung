import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import type { ListLodatsQueryDto, UpdateLodatSaleStatusDto } from './dto/lodat.dto';

const ADDRESS_INCLUDE = {
  province: { select: { name: true, isHidden: true } },
  district: { select: { name: true, isHidden: true } },
  ward: { select: { name: true, isHidden: true } },
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { objectKey: true },
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
    select: { objectKey: true },
  },
  maps: {
    where: { isActive: true },
    take: 1,
    orderBy: [{ updatedAt: 'desc' as const }],
    include: {
      customer: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.LodatInclude;

type LodatRow = Prisma.LodatGetPayload<{ include: typeof LIST_INCLUDE }>;

@Injectable()
export class LodatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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

  private coverKeys(row: LodatRow): string[] {
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
    const keys = this.coverKeys(row);
    const rawStatus = activeMap?.status ?? 'TAM_DUNG';
    const status =
      rawStatus === 'DANG_BAN' || rawStatus === 'TAM_DUNG'
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
      updatedAt: updatedAt.toISOString(),
    };
  }

  private ownershipWhere(user: RequestUser): Prisma.LodatWhereInput {
    if (user.role === 'ADMIN') return {};
    return { createdByEmployeeId: user.id };
  }

  private assertCanAccess(user: RequestUser, createdByEmployeeId: string) {
    if (user.role === 'ADMIN') return;
    if (createdByEmployeeId !== user.id) {
      throw new ForbiddenException('Không có quyền với lô đất này.');
    }
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
    } else if (query.status) {
      and.push({
        maps: { some: { isActive: true, status: query.status } },
      });
    } else if (!query.includePaused) {
      and.push({
        maps: { some: { isActive: true, status: 'DANG_BAN' } },
      });
    }

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

    const rows = await this.prisma.lodat.findMany({
      where: { AND: and },
      include: LIST_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 500,
    });

    const items = rows
      .map((row) => this.mapRow(row))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return { items, total: items.length };
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
    return this.mapRow(row);
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

    const refreshed = await this.prisma.lodat.findUniqueOrThrow({
      where: { id },
      include: LIST_INCLUDE,
    });
    return this.mapRow(refreshed);
  }
}
