import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PUBLIC_MEDIA_ACCEPT_MIME,
  PUBLIC_MEDIA_MAX_BYTES,
} from '@crmanhung/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import type { UpdatePublicListingDraftDto } from './dto/public-listing.dto';
import { formatM, kindLabel, toPublicSlug } from './public-slug';

const ADDR_SELECT = {
  detail: true,
  ward: { select: { name: true, isHidden: true } },
  district: { select: { name: true, isHidden: true } },
  province: { select: { name: true, isHidden: true } },
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { objectKey: true },
  },
} satisfies Prisma.AddressSelect;

const LODAT_INCLUDE = {
  address: { select: ADDR_SELECT },
  projectLot: {
    select: {
      title: true,
      areaM2: true,
      frontageM: true,
      direction: true,
      address: { select: ADDR_SELECT },
    },
  },
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { objectKey: true },
  },
  maps: {
    where: { isActive: true },
    take: 1,
    select: { status: true },
  },
} satisfies Prisma.LodatInclude;

type LodatLoaded = Prisma.LodatGetPayload<{ include: typeof LODAT_INCLUDE }>;
type ListingRow = Prisma.PublicLotListingGetPayload<{ include: { lodat: { include: typeof LODAT_INCLUDE } } }>;

@Injectable()
export class PublicContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async listPublished() {
    const rows = await this.prisma.publicLotListing.findMany({
      where: { isPublished: true },
      include: { lodat: { include: LODAT_INCLUDE } },
      orderBy: { updatedAt: 'desc' },
    });
    return { items: rows.filter((row) => this.isOpenSale(row.lodat)).map((row) => this.toCatalog(row)) };
  }

  async getPublishedBySlug(slug: string) {
    const row = await this.prisma.publicLotListing.findUnique({
      where: { slug },
      include: { lodat: { include: LODAT_INCLUDE } },
    });
    if (!row?.isPublished || !this.isOpenSale(row.lodat)) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return this.toCatalog(row);
  }

  async listAdminLots() {
    const rows = await this.prisma.publicLotListing.findMany({
      include: { lodat: { include: LODAT_INCLUDE } },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toAdminRow(row));
  }

  async uploadPublicMedia(file: {
    buffer: Buffer;
    mimetype: string;
    originalname?: string;
  }) {
    const mime = String(file.mimetype || '').toLowerCase();
    if (!(PUBLIC_MEDIA_ACCEPT_MIME as readonly string[]).includes(mime)) {
      throw new BadRequestException('Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.');
    }
    if (!file.buffer?.length) {
      throw new BadRequestException('Thiếu file ảnh.');
    }
    if (file.buffer.length > PUBLIC_MEDIA_MAX_BYTES) {
      throw new PayloadTooLargeException('Ảnh tối đa 5 MB.');
    }
    const uploaded = await this.storage.upload({
      folder: 'public-web',
      buffer: file.buffer,
      contentType: mime,
      originalName: file.originalname,
    });
    return { url: uploaded.url, objectKey: uploaded.objectKey };
  }

  async updateDraft(id: string, dto: UpdatePublicListingDraftDto) {
    if (dto.priceMode === 'AMOUNT' && !dto.priceLabel?.trim()) {
      throw new BadRequestException('Nhập giá công khai hoặc chọn Liên hệ');
    }
    const lodat = await this.requireOpenLodat(id);
    const existing = await this.prisma.publicLotListing.findUnique({
      where: { lodatId: lodat.id },
    });
    const priceLabel = dto.priceMode === 'CONTACT' ? null : dto.priceLabel?.trim() || null;
    const data = {
      title: dto.title.trim(),
      location: dto.location.trim(),
      priceMode: dto.priceMode,
      priceLabel,
      excerpt: dto.excerpt.trim(),
    };
    const saved = existing
      ? await this.prisma.publicLotListing.update({
          where: { id: existing.id },
          data,
          include: { lodat: { include: LODAT_INCLUDE } },
        })
      : await this.prisma.publicLotListing.create({
          data: {
            lodatId: lodat.id,
            slug: await this.uniqueSlug(toPublicSlug(dto.title)),
            isPublished: false,
            ...data,
          },
          include: { lodat: { include: LODAT_INCLUDE } },
        });
    return this.toAdminRow(saved);
  }

  async setPublished(id: string, isPublished: boolean) {
    const lodat = await this.requireOpenLodat(id);
    const existing = await this.prisma.publicLotListing.findUnique({
      where: { lodatId: lodat.id },
    });
    if (!existing) {
      if (!isPublished) {
        throw new NotFoundException('Chưa có bài đăng cho lô này');
      }
      const title = this.lodatTitle(lodat);
      const location = this.lodatLocation(lodat);
      const created = await this.prisma.publicLotListing.create({
        data: {
          lodatId: lodat.id,
          slug: await this.uniqueSlug(toPublicSlug(title)),
          title,
          location,
          isPublished: true,
          priceMode: 'CONTACT',
          priceLabel: null,
          excerpt: [title, location].filter(Boolean).join('. '),
        },
        include: { lodat: { include: LODAT_INCLUDE } },
      });
      return this.toAdminRow(created);
    }
    const saved = await this.prisma.publicLotListing.update({
      where: { id: existing.id },
      data: { isPublished },
      include: { lodat: { include: LODAT_INCLUDE } },
    });
    return this.toAdminRow(saved);
  }

  private async requireOpenLodat(id: string): Promise<LodatLoaded> {
    const byListing = await this.prisma.publicLotListing.findFirst({
      where: { OR: [{ id }, { lodatId: id }] },
      select: { lodatId: true },
    });
    const lodatId = byListing?.lodatId ?? id;
    const lodat = await this.prisma.lodat.findUnique({
      where: { id: lodatId },
      include: LODAT_INCLUDE,
    });
    if (!lodat) throw new NotFoundException('Không tìm thấy lô đang mở bán.');
    if (!this.isOpenSale(lodat)) {
      throw new BadRequestException('Chỉ đăng lô đang Mở bán.');
    }
    return lodat;
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    let n = 2;
    while (await this.prisma.publicLotListing.findUnique({ where: { slug } })) {
      slug = `${base.slice(0, 50)}-${n}`;
      n += 1;
    }
    return slug;
  }

  private isOpenSale(lodat: LodatLoaded): boolean {
    return lodat.maps[0]?.status === 'DANG_BAN';
  }

  private lodatTitle(lodat: LodatLoaded): string {
    const isProject = Boolean(lodat.projectLotId);
    return (
      (isProject ? lodat.projectLot?.title : lodat.title)?.trim() ||
      lodat.title?.trim() ||
      lodat.projectLot?.title?.trim() ||
      'Lô đất'
    );
  }

  private lodatLocation(lodat: LodatLoaded): string {
    const addr = lodat.projectLotId && lodat.projectLot?.address
      ? lodat.projectLot.address
      : lodat.address;
    if (!addr) return '';
    const parts = [
      addr.detail?.trim() || null,
      addr.ward && !addr.ward.isHidden ? addr.ward.name : null,
      addr.district && !addr.district.isHidden ? addr.district.name : null,
      addr.province && !addr.province.isHidden ? addr.province.name : null,
    ].filter(Boolean) as string[];
    return parts.join(', ');
  }

  private coverUrl(lodat: LodatLoaded): string | null {
    const addr = lodat.projectLotId && lodat.projectLot?.address
      ? lodat.projectLot.address
      : lodat.address;
    const keys = [
      ...(lodat.projectLotId && addr?.images ? addr.images.map((i) => i.objectKey) : []),
      ...lodat.images.map((i) => i.objectKey),
    ].filter(Boolean);
    const first = keys[0];
    if (!first || !this.storage.isConfigured()) return null;
    return this.storage.publicUrl(first);
  }

  private toAdminRow(row: ListingRow) {
    return {
      id: row.id,
      lodatId: row.lodatId,
      slug: row.slug,
      title: row.title,
      location: row.location,
      coverImageUrl: this.coverUrl(row.lodat),
      isPublished: row.isPublished,
      priceMode: row.priceMode === 'AMOUNT' ? 'AMOUNT' : 'CONTACT',
      priceLabel: row.priceLabel,
      excerpt: row.excerpt,
    };
  }

  private toCatalog(row: ListingRow) {
    const lodat = row.lodat;
    const isProject = Boolean(lodat.projectLotId);
    const areaM2 = isProject ? (lodat.projectLot?.areaM2 ?? lodat.areaM2) : lodat.areaM2;
    const frontageM = isProject
      ? (lodat.projectLot?.frontageM ?? lodat.frontageM)
      : lodat.frontageM;
    const direction = isProject
      ? (lodat.projectLot?.direction ?? lodat.direction)
      : lodat.direction;
    const kind = lodat.propertyKind === 'NHA' ? 'NHA' : 'DAT';
    const priceLabel =
      row.priceMode === 'AMOUNT' && row.priceLabel?.trim() ? row.priceLabel.trim() : null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      location: row.location,
      priceLabel,
      excerpt: row.excerpt.trim() || [row.title, row.location].filter(Boolean).join('. '),
      coverImageUrl: this.coverUrl(lodat),
      ...(row.metaDescription ? { metaDescription: row.metaDescription } : {}),
      updatedAt: row.updatedAt.toISOString(),
      kindLabel: kindLabel(kind),
      areaLabel: formatM(areaM2 ?? null, 'm²'),
      frontageLabel: formatM(frontageM ?? null, 'm'),
      directionLabel: direction?.trim() || null,
    };
  }
}
