import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  PUBLIC_MEDIA_ACCEPT_MIME,
  PUBLIC_MEDIA_MAX_BYTES,
  listingBodyToExcerpt,
} from '@crmanhung/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import type { UpdatePublicListingDraftDto } from './dto/public-listing.dto';
import type { CreatePublicPostDto } from './dto/public-post.dto';
import { PublicWebRevalidateService } from './public-web-revalidate.service';
import { formatM, kindLabel, toListingPublicSlug, toPublicSlug } from './public-slug';

const POST_CATEGORIES = new Set([
  'tin-tuc',
  'du-an',
  'kien-thuc',
  'kinh-nghiem',
  'lien-he',
  'chinh-sach',
]);

type PublicPostRow = {
  id: string;
  slug: string;
  category: string;
  status: string;
  title: string;
  coverImageUrl: string | null;
  bodyHtml: string;
  excerpt: string;
  metaDescription: string | null;
  authorLabel: string;
  publishedAt: Date | null;
  updatedAt: Date;
};

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
    private readonly revalidate: PublicWebRevalidateService,
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

  /** Old guest lot slug → current slug (Next issues 301). */
  async findLotSlugRedirect(fromSlug: string): Promise<{ toSlug: string } | null> {
    const row = await this.prisma.publicLotSlugRedirect.findUnique({
      where: { fromSlug },
      select: { toSlug: true },
    });
    return row ?? null;
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
    const bodyHtml = dto.bodyHtml ?? '';
    const excerpt =
      listingBodyToExcerpt(bodyHtml) ||
      [dto.title.trim(), dto.location.trim()].filter(Boolean).join('. ');
    const data = {
      title: dto.title.trim(),
      location: dto.location.trim(),
      priceMode: dto.priceMode,
      priceLabel,
      excerpt,
      bodyHtml,
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
            slug: await this.uniqueSlug(toListingPublicSlug(dto.title, dto.location)),
            isPublished: false,
            ...data,
          },
          include: { lodat: { include: LODAT_INCLUDE } },
        });
    if (saved.isPublished) {
      await this.revalidate.revalidateListing(saved.slug);
    }
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
      await this.unpublishSiblingProjectLotListings(lodat.id, lodat.projectLotId);
      const created = await this.prisma.publicLotListing.create({
        data: {
          lodatId: lodat.id,
          slug: await this.uniqueSlug(toListingPublicSlug(title, location)),
          title,
          location,
          isPublished: true,
          priceMode: 'CONTACT',
          priceLabel: null,
          excerpt: [title, location].filter(Boolean).join('. '),
          bodyHtml: '',
          publishedAt: new Date(),
        },
        include: { lodat: { include: LODAT_INCLUDE } },
      });
      await this.revalidate.revalidateListing(created.slug, { includeHome: true });
      return this.toAdminRow(created);
    }
    const wasPublished = existing.isPublished;
    if (isPublished && !wasPublished) {
      await this.unpublishSiblingProjectLotListings(lodat.id, lodat.projectLotId);
    }
    const saved = await this.prisma.publicLotListing.update({
      where: { id: existing.id },
      data: {
        isPublished,
        ...(isPublished && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      },
      include: { lodat: { include: LODAT_INCLUDE } },
    });
    await this.revalidate.revalidateListing(saved.slug, {
      includeHome: isPublished !== wasPublished,
    });
    return this.toAdminRow(saved);
  }

  private async unpublishListingById(id: string, slug: string): Promise<void> {
    await this.prisma.publicLotListing.update({
      where: { id },
      data: { isPublished: false },
    });
    await this.revalidate.revalidateListing(slug, { includeHome: true });
  }

  /** Một số lô kho (ProjectLot) — chỉ một listing public cùng lúc. */
  private async unpublishSiblingProjectLotListings(
    lodatId: string,
    projectLotId: string | null | undefined,
  ): Promise<void> {
    if (!projectLotId) return;
    const siblings = await this.prisma.publicLotListing.findMany({
      where: {
        isPublished: true,
        lodat: { projectLotId, id: { not: lodatId } },
      },
      select: { id: true, slug: true },
    });
    for (const row of siblings) {
      await this.unpublishListingById(row.id, row.slug);
    }
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
      bodyHtml: row.bodyHtml ?? '',
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
      bodyHtml: row.bodyHtml ?? '',
      coverImageUrl: this.coverUrl(lodat),
      ...(row.metaDescription ? { metaDescription: row.metaDescription } : {}),
      ...(row.publishedAt ? { publishedAt: row.publishedAt.toISOString() } : {}),
      updatedAt: row.updatedAt.toISOString(),
      kindLabel: kindLabel(kind),
      areaLabel: formatM(areaM2 ?? null, 'm²'),
      frontageLabel: formatM(frontageM ?? null, 'm'),
      directionLabel: direction?.trim() || null,
    };
  }

  async listAdminPosts() {
    const rows = await this.prisma.publicPost.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toAdminPost(row));
  }

  async createPost(dto: CreatePublicPostDto) {
    this.assertPublishablePost(dto.status, dto.coverImageUrl, dto.bodyHtml);
    const bodyHtml = dto.bodyHtml ?? '';
    const excerpt =
      dto.excerpt?.trim() ||
      listingBodyToExcerpt(bodyHtml) ||
      dto.title.trim();
    const slug = await this.uniquePostSlug(dto.category, toPublicSlug(dto.title));
    const isPublished = dto.status === 'PUBLISHED';
    const saved = await this.prisma.publicPost.create({
      data: {
        title: dto.title.trim(),
        category: dto.category,
        status: dto.status,
        coverImageUrl: dto.coverImageUrl?.trim() || null,
        bodyHtml,
        excerpt,
        slug,
        publishedAt: isPublished ? new Date() : null,
      },
    });
    if (isPublished) {
      await this.revalidate.revalidatePost(saved.category, saved.slug, {
        includeHome: true,
      });
    }
    return this.toAdminPost(saved);
  }

  async setPostStatus(id: string, status: 'DRAFT' | 'PUBLISHED') {
    const existing = await this.prisma.publicPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy bài viết.');
    if (status === 'PUBLISHED') {
      this.assertPublishablePost(status, existing.coverImageUrl, existing.bodyHtml);
    }
    const wasPublished = existing.status === 'PUBLISHED';
    const saved = await this.prisma.publicPost.update({
      where: { id },
      data: {
        status,
        ...(status === 'PUBLISHED' && !existing.publishedAt
          ? { publishedAt: new Date() }
          : {}),
      },
    });
    if (wasPublished || status === 'PUBLISHED') {
      await this.revalidate.revalidatePost(saved.category, saved.slug, {
        includeHome: wasPublished !== (status === 'PUBLISHED'),
      });
    }
    return this.toAdminPost(saved);
  }

  async listPublishedPosts(category?: string) {
    const where: { status: string; category?: string } = { status: 'PUBLISHED' };
    if (category) {
      if (!POST_CATEGORIES.has(category)) {
        throw new BadRequestException('Chuyên mục không hợp lệ');
      }
      where.category = category;
    }
    const rows = await this.prisma.publicPost.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    });
    return { items: rows.map((row) => this.toGuestPost(row)) };
  }

  async getPublishedPost(category: string, slug: string) {
    if (!POST_CATEGORIES.has(category)) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    const row = await this.prisma.publicPost.findUnique({
      where: { category_slug: { category, slug } },
    });
    if (!row || row.status !== 'PUBLISHED') {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return this.toGuestPost(row);
  }

  private assertPublishablePost(
    status: string,
    coverImageUrl: string | null | undefined,
    bodyHtml: string | null | undefined,
  ) {
    if (status !== 'PUBLISHED') return;
    if (!coverImageUrl?.trim()) {
      throw new BadRequestException('Chọn ảnh bìa trước khi xuất bản');
    }
    if (!listingBodyToExcerpt(bodyHtml)) {
      throw new BadRequestException('Nhập nội dung bài trước khi xuất bản');
    }
  }

  private async uniquePostSlug(category: string, base: string): Promise<string> {
    const root = base || 'bai-viet';
    let slug = root;
    let n = 2;
    while (
      await this.prisma.publicPost.findUnique({
        where: { category_slug: { category, slug } },
      })
    ) {
      slug = `${root.slice(0, 50)}-${n}`;
      n += 1;
    }
    return slug;
  }

  private toAdminPost(row: PublicPostRow) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      status: row.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      coverImageUrl: row.coverImageUrl,
      bodyHtml: row.bodyHtml ?? '',
      excerpt: row.excerpt,
    };
  }

  private toGuestPost(row: PublicPostRow) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      coverImageUrl: row.coverImageUrl,
      bodyHtml: row.bodyHtml ?? '',
      excerpt: row.excerpt.trim() || row.title,
      ...(row.metaDescription ? { metaDescription: row.metaDescription } : {}),
      authorLabel: row.authorLabel,
      ...(row.publishedAt ? { publishedAt: row.publishedAt.toISOString() } : {}),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
