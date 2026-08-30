import {
  BadRequestException,
  Injectable,
  Logger,
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
import {
  addressGeo,
  buildHubSlugMaps,
  communeMetaForGeo,
  placeMetaForGeo,
  type HubSlugMaps,
} from './public-listing-hub-slugs';
import {
  formatM,
  kindLabel,
  reservePublicLotSlug,
  toListingPublicSlug,
  toPublicSlug,
} from './public-slug';
import {
  applySeoImageMove,
  planSeoAddressImageCopy,
  planSeoLotImageCopy,
  projectAddressSeoFields,
} from '../lodats/lodat-seo-image-upload';

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
  id: true,
  kind: true,
  detail: true,
  ward: { select: { id: true, name: true, isHidden: true } },
  district: { select: { id: true, name: true, isHidden: true } },
  province: { select: { name: true, isHidden: true } },
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { id: true, objectKey: true },
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
    select: { id: true, objectKey: true },
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
  private readonly logger = new Logger(PublicContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly revalidate: PublicWebRevalidateService,
  ) {}

  async listPublished() {
    const { items } = await this.loadPublishedCatalog();
    return { items };
  }

  async getPublishedBySlug(slug: string) {
    const row = await this.prisma.publicLotListing.findUnique({
      where: { slug },
      include: { lodat: { include: LODAT_INCLUDE } },
    });
    if (!row?.isPublished || !this.isOpenSale(row.lodat)) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    const { hubMaps } = await this.loadPublishedCatalog();
    return this.toCatalog(row, hubMaps);
  }

  async listCommuneHubs() {
    const { items, hubMaps } = await this.loadPublishedCatalog();
    const communeMetaBySlug = new Map(
      [...hubMaps.communeByWardId.values()].map((meta) => [meta.slug, meta]),
    );
    const bySlug = new Map<
      string,
      {
        label: string;
        districtLabel: string;
        provinceLabel: string;
        count: number;
        updatedAt?: string;
      }
    >();

    for (const row of items) {
      const slug = row.communeSlug?.trim();
      const label = row.communeLabel?.trim();
      if (!slug || !label) continue;
      const meta = communeMetaBySlug.get(slug);
      const prev = bySlug.get(slug);
      const updatedAt = row.updatedAt;
      if (prev) {
        prev.count += 1;
        if (updatedAt && (!prev.updatedAt || updatedAt > prev.updatedAt)) {
          prev.updatedAt = updatedAt;
        }
      } else {
        bySlug.set(slug, {
          label,
          districtLabel: meta?.districtLabel ?? '',
          provinceLabel: meta?.provinceLabel ?? '',
          count: 1,
          ...(updatedAt ? { updatedAt } : {}),
        });
      }
    }

    const hubs = [...bySlug.entries()]
      .map(([slug, meta]) => ({
        kind: 'commune' as const,
        slug,
        label: meta.label,
        listingCount: meta.count,
        ...(meta.districtLabel ? { districtLabel: meta.districtLabel } : {}),
        ...(meta.provinceLabel ? { provinceLabel: meta.provinceLabel } : {}),
        ...(meta.updatedAt ? { updatedAt: meta.updatedAt } : {}),
      }))
      .filter((h) => h.listingCount > 0)
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    return { items: hubs };
  }

  async getCommuneHubDetail(communeSlug: string) {
    const slug = communeSlug.trim();
    if (!slug) throw new NotFoundException('Không tìm thấy khu vực');
    const { items, hubMaps } = await this.loadPublishedCatalog();
    const hubItems = items.filter((row) => row.communeSlug === slug);
    if (hubItems.length === 0) {
      throw new NotFoundException('Không tìm thấy khu vực');
    }
    const meta = [...hubMaps.communeByWardId.values()].find((m) => m.slug === slug);
    const sample = hubItems[0]!;
    const updatedAt = hubItems
      .map((r) => r.updatedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    return {
      kind: 'commune' as const,
      slug,
      label: sample.communeLabel ?? meta?.label ?? slug,
      listingCount: hubItems.length,
      ...(meta?.districtLabel ? { districtLabel: meta.districtLabel } : {}),
      ...(meta?.provinceLabel ? { provinceLabel: meta.provinceLabel } : {}),
      items: hubItems,
      ...(updatedAt ? { updatedAt } : {}),
    };
  }

  async listPlaceHubs(communeSlug?: string) {
    const filter = communeSlug?.trim();
    const { items } = await this.loadPublishedCatalog();
    const byKey = new Map<
      string,
      {
        slug: string;
        label: string;
        communeSlug: string;
        communeLabel: string;
        count: number;
        updatedAt?: string;
      }
    >();

    for (const row of items) {
      const cSlug = row.communeSlug?.trim();
      const cLabel = row.communeLabel?.trim();
      const pSlug = row.placeSlug?.trim();
      const pLabel = row.placeLabel?.trim();
      if (!cSlug || !cLabel || !pSlug || !pLabel) continue;
      if (filter && cSlug !== filter) continue;
      const key = `${cSlug}/${pSlug}`;
      const prev = byKey.get(key);
      const updatedAt = row.updatedAt;
      if (prev) {
        prev.count += 1;
        if (updatedAt && (!prev.updatedAt || updatedAt > prev.updatedAt)) {
          prev.updatedAt = updatedAt;
        }
      } else {
        byKey.set(key, {
          slug: pSlug,
          label: pLabel,
          communeSlug: cSlug,
          communeLabel: cLabel,
          count: 1,
          ...(updatedAt ? { updatedAt } : {}),
        });
      }
    }

    const hubs = [...byKey.values()]
      .filter((h) => h.count > 0)
      .map(({ count, ...hub }) => ({
        kind: 'place' as const,
        slug: hub.slug,
        label: hub.label,
        communeSlug: hub.communeSlug,
        communeLabel: hub.communeLabel,
        listingCount: count,
        ...(hub.updatedAt ? { updatedAt: hub.updatedAt } : {}),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    return { items: hubs };
  }

  async getPlaceHubDetail(communeSlug: string, placeSlug: string) {
    const cSlug = communeSlug.trim();
    const pSlug = placeSlug.trim();
    if (!cSlug || !pSlug) throw new NotFoundException('Không tìm thấy khu vực');
    const { items } = await this.loadPublishedCatalog();
    const hubItems = items.filter((row) => row.communeSlug === cSlug && row.placeSlug === pSlug);
    if (hubItems.length === 0) {
      throw new NotFoundException('Không tìm thấy khu vực');
    }
    const sample = hubItems[0]!;
    const updatedAt = hubItems
      .map((r) => r.updatedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    return {
      kind: 'place' as const,
      slug: pSlug,
      label: sample.placeLabel ?? pSlug,
      communeSlug: cSlug,
      communeLabel: sample.communeLabel ?? cSlug,
      listingCount: hubItems.length,
      items: hubItems,
      ...(updatedAt ? { updatedAt } : {}),
    };
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
    // Raster → WebP (sharp) inside StorageService.upload; key ends with .webp.
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
    const metaDescription =
      dto.metaDescription !== undefined ? dto.metaDescription?.trim() || null : undefined;
    const seoTitle =
      dto.seoTitle !== undefined ? dto.seoTitle?.trim() || null : undefined;
    const data: {
      title: string;
      location: string;
      priceMode: string;
      priceLabel: string | null;
      excerpt: string;
      bodyHtml: string;
      metaDescription?: string | null;
      seoTitle?: string | null;
      slug?: string;
    } = {
      title: dto.title.trim(),
      location: dto.location.trim(),
      priceMode: dto.priceMode,
      priceLabel,
      excerpt,
      bodyHtml,
    };
    if (metaDescription !== undefined) {
      data.metaDescription = metaDescription;
    }
    if (seoTitle !== undefined) {
      data.seoTitle = seoTitle;
    }
    const slugHint = dto.slug?.trim();
    if (existing) {
      if (slugHint && slugHint !== existing.slug) {
        data.slug = await this.uniqueSlug(slugHint);
      }
      const saved = await this.prisma.publicLotListing.update({
        where: { id: existing.id },
        data,
        include: { lodat: { include: LODAT_INCLUDE } },
      });
      if (saved.isPublished) {
        await this.revalidate.revalidateListing(saved.slug);
      }
      return this.toAdminRow(saved);
    }
    const createSlug = slugHint
      ? await this.uniqueSlug(slugHint)
      : await this.uniqueSlug(toListingPublicSlug(dto.title, dto.location));
    const saved = await this.prisma.publicLotListing.create({
      data: {
        lodatId: lodat.id,
        slug: createSlug,
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
      await this.ensureSeoImageKeysForLodat(lodat);
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
    if (isPublished) {
      await this.ensureSeoImageKeysForLodat(lodat);
    }
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
    const root = reservePublicLotSlug(base);
    let slug = root;
    let n = 2;
    while (await this.prisma.publicLotListing.findUnique({ where: { slug } })) {
      slug = `${root}-${n}`;
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

  private lodatAddress(lodat: LodatLoaded) {
    return lodat.projectLotId && lodat.projectLot?.address
      ? lodat.projectLot.address
      : lodat.address;
  }

  private async loadPublishedCatalog(): Promise<{
    items: ReturnType<PublicContentService['toCatalog']>[];
    hubMaps: HubSlugMaps;
  }> {
    const rows = await this.prisma.publicLotListing.findMany({
      where: { isPublished: true },
      include: { lodat: { include: LODAT_INCLUDE } },
      orderBy: { updatedAt: 'desc' },
    });
    const open = rows.filter((row) => this.isOpenSale(row.lodat));
    const geos = open
      .map((row) => addressGeo(this.lodatAddress(row.lodat)))
      .filter((g): g is NonNullable<typeof g> => g != null);
    const hubMaps = buildHubSlugMaps(geos);
    const items = open.map((row) => this.toCatalog(row, hubMaps));
    return { items, hubMaps };
  }

  private lodatLocation(lodat: LodatLoaded): string {
    const addr = this.lodatAddress(lodat);
    if (!addr) return '';
    const parts = [
      addr.detail?.trim() || null,
      addr.ward && !addr.ward.isHidden ? addr.ward.name : null,
      addr.district && !addr.district.isHidden ? addr.district.name : null,
      addr.province && !addr.province.isHidden ? addr.province.name : null,
    ].filter(Boolean) as string[];
    return parts.join(', ');
  }

  /** Copy lot/address photos to SEO CDN keys. Chat originals stay; UUID sources drop if unused. */
  private async ensureSeoImageKeysForLodat(lodat: LodatLoaded): Promise<void> {
    if (!this.storage.isConfigured()) return;
    const title = this.lodatTitle(lodat);
    const location = this.lodatLocation(lodat);
    try {
      for (let i = 0; i < lodat.images.length; i += 1) {
        const img = lodat.images[i]!;
        const plan = await planSeoLotImageCopy(this.storage, img, {
          lodatId: lodat.id,
          title,
          location,
          index: i + 1,
        });
        if (!plan) continue;
        await applySeoImageMove(this.prisma, this.storage, plan, 'lodat');
      }
      const addr =
        lodat.projectLotId && lodat.projectLot?.address ? lodat.projectLot.address : null;
      if (!addr?.id || !addr.images?.length) return;
      const project = projectAddressSeoFields(addr);
      for (let i = 0; i < addr.images.length; i += 1) {
        const img = addr.images[i]!;
        const plan = await planSeoAddressImageCopy(this.storage, img, {
          addressId: addr.id,
          title: project.title,
          location: project.location,
          index: i + 1,
        });
        if (!plan) continue;
        await applySeoImageMove(this.prisma, this.storage, plan, 'address');
      }
    } catch (err) {
      this.logger.warn(
        `SEO image move skipped for lodat ${lodat.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private imageUrls(lodat: LodatLoaded): string[] {
    if (!this.storage.isConfigured()) return [];
    const addr =
      lodat.projectLotId && lodat.projectLot?.address
        ? lodat.projectLot.address
        : lodat.address;
    const keys = [
      ...(lodat.projectLotId && addr?.images ? addr.images.map((i) => i.objectKey) : []),
      ...lodat.images.map((i) => i.objectKey),
    ].filter(Boolean);
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const key of keys) {
      if (seen.has(key)) continue;
      seen.add(key);
      urls.push(this.storage.publicUrl(key));
    }
    return urls;
  }

  private coverUrl(lodat: LodatLoaded): string | null {
    return this.imageUrls(lodat)[0] ?? null;
  }

  private toAdminRow(row: ListingRow) {
    return {
      id: row.id,
      lodatId: row.lodatId,
      slug: row.slug,
      title: row.title,
      ...(row.seoTitle ? { seoTitle: row.seoTitle } : {}),
      location: row.location,
      coverImageUrl: this.coverUrl(row.lodat),
      isPublished: row.isPublished,
      priceMode: row.priceMode === 'AMOUNT' ? 'AMOUNT' : 'CONTACT',
      priceLabel: row.priceLabel,
      excerpt: row.excerpt,
      bodyHtml: row.bodyHtml ?? '',
    };
  }

  private toCatalog(row: ListingRow, hubMaps?: HubSlugMaps) {
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

    const addr = this.lodatAddress(lodat);
    const geo = hubMaps ? addressGeo(addr) : null;
    const commune = hubMaps ? communeMetaForGeo(hubMaps, geo) : null;
    const place = hubMaps ? placeMetaForGeo(hubMaps, geo) : null;

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      ...(row.seoTitle ? { seoTitle: row.seoTitle } : {}),
      location: row.location,
      priceLabel,
      excerpt: row.excerpt.trim() || [row.title, row.location].filter(Boolean).join('. '),
      bodyHtml: row.bodyHtml ?? '',
      coverImageUrl: this.coverUrl(lodat),
      imageUrls: this.imageUrls(lodat),
      ...(row.metaDescription ? { metaDescription: row.metaDescription } : {}),
      ...(row.publishedAt ? { publishedAt: row.publishedAt.toISOString() } : {}),
      updatedAt: row.updatedAt.toISOString(),
      kindLabel: kindLabel(kind),
      areaLabel: formatM(areaM2 ?? null, 'm²'),
      frontageLabel: formatM(frontageM ?? null, 'm'),
      directionLabel: direction?.trim() || null,
      ...(commune
        ? {
            communeSlug: commune.slug,
            communeLabel: commune.label,
          }
        : {}),
      ...(place
        ? {
            placeSlug: place.slug,
            placeLabel: place.label,
          }
        : {}),
      ...(addr?.kind ? { addressKind: addr.kind } : {}),
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
