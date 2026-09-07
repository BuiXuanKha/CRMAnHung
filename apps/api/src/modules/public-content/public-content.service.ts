import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import {
  PUBLIC_MEDIA_ACCEPT_MIME,
  PUBLIC_MEDIA_MAX_BYTES,
  listingBodyToExcerpt,
  listingCommuneHubPath,
  postBodyToExcerpt,
} from '@crmanhung/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import type { UpdatePublicListingDraftDto } from './dto/public-listing.dto';
import type { CreatePublicPostDto } from './dto/public-post.dto';
import { PublicWebRevalidateService } from './public-web-revalidate.service';
import { PublicCommuneHubsService } from './public-commune-hubs';
import {
  addressGeo,
  guestCatalogHubMaps,
  communeMetaForGeo,
  placeMetaForGeo,
  preferredCommuneSlugByWardId,
  type AddressGeo,
  type HubSlugMaps,
} from './public-listing-hub-slugs';
import {
  lotGuestSlugOccupied,
  nextUniqueLotGuestSlug,
} from './lot-guest-slug';
import {
  formatM,
  kindLabel,
  toListingPublicSlug,
  toPublicPostSlug,
  toPublicSlug,
} from './public-slug';
import {
  applySeoImageMove,
  planSeoAddressImageCopy,
  projectAddressSeoFields,
  retargetLodatSeoImages,
} from '../lodats/lodat-seo-image-upload';
import {
  rewritePostSeoImages,
  uniqueSeoPostImageKey,
} from './post-seo-image-upload';

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
    private readonly communeHubs: PublicCommuneHubsService,
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
    if (!row?.isPublished) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    // BUG-069: same Mở bán hub maps as catalog/sitemap — not every isPublished row.
    const { hubMaps } = await this.loadPublishedCatalog();
    return this.toCatalog(row, hubMaps);
  }

  async listCommuneHubs() {
    const { items, persisted } = await this.loadPublishedCatalog();
    const bySlug = new Map<string, { count: number; updatedAt?: string }>();
    for (const row of items) {
      const slug = row.communeSlug?.trim();
      if (!slug) continue;
      const prev = bySlug.get(slug);
      const updatedAt = row.updatedAt;
      if (prev) {
        prev.count += 1;
        if (updatedAt && (!prev.updatedAt || updatedAt > prev.updatedAt)) {
          prev.updatedAt = updatedAt;
        }
      } else {
        bySlug.set(slug, { count: 1, ...(updatedAt ? { updatedAt } : {}) });
      }
    }

    const hubs = persisted
      .map((hub) => {
        const live = bySlug.get(hub.slug);
        const updatedAt = live?.updatedAt ?? hub.updatedAt.toISOString();
        return {
          kind: 'commune' as const,
          slug: hub.slug,
          label: hub.label,
          listingCount: live?.count ?? 0,
          ...(hub.districtLabel ? { districtLabel: hub.districtLabel } : {}),
          ...(hub.provinceLabel ? { provinceLabel: hub.provinceLabel } : {}),
          ...(updatedAt ? { updatedAt } : {}),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    return { items: hubs };
  }

  async getCommuneHubDetail(communeSlug: string) {
    const slug = communeSlug.trim();
    if (!slug) throw new NotFoundException('Không tìm thấy khu vực');
    const { items, persisted } = await this.loadPublishedCatalog();
    const hub = persisted.find((row) => row.slug === slug);
    if (!hub) {
      throw new NotFoundException('Không tìm thấy khu vực');
    }
    const hubItems = items.filter((row) => row.communeSlug === slug);
    const updatedAt = hubItems
      .map((r) => r.updatedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    return {
      kind: 'commune' as const,
      slug: hub.slug,
      label: hub.label,
      listingCount: hubItems.length,
      ...(hub.districtLabel ? { districtLabel: hub.districtLabel } : {}),
      ...(hub.provinceLabel ? { provinceLabel: hub.provinceLabel } : {}),
      items: hubItems,
      ...(updatedAt ? { updatedAt } : { updatedAt: hub.updatedAt.toISOString() }),
    };
  }

  async findCommuneHubRedirect(fromSlug: string): Promise<{ toSlug: string } | null> {
    return this.communeHubs.findRedirect(fromSlug);
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

  /**
   * Old guest lot slug → current slug (Next issues 301).
   * BUG-073: only when target listing still exists (slug forever while Lodat lives).
   */
  async findLotSlugRedirect(fromSlug: string): Promise<{ toSlug: string } | null> {
    const row = await this.prisma.publicLotSlugRedirect.findUnique({
      where: { fromSlug },
      select: { toSlug: true },
    });
    if (!row) return null;
    const target = await this.prisma.publicLotListing.findUnique({
      where: { slug: row.toSlug },
      select: { id: true },
    });
    if (!target) {
      // BUG-074: orphan redirect after listing/lodat gone
      await this.prisma.publicLotSlugRedirect.deleteMany({
        where: { OR: [{ fromSlug }, { toSlug: row.toSlug }] },
      });
      return null;
    }
    return { toSlug: row.toSlug };
  }

  /**
   * Owner 2026-09-07: tạo lô / gắn chủ → đúng một listing + slug (isPublished từ đầu).
   * Idempotent. Không đổi slug nếu đã có.
   */
  async ensureListingForLodat(lodatId: string): Promise<void> {
    const existing = await this.prisma.publicLotListing.findUnique({
      where: { lodatId },
      select: { id: true, isPublished: true, slug: true },
    });
    if (existing) {
      if (!existing.isPublished) {
        const full = await this.prisma.publicLotListing.findUnique({
          where: { id: existing.id },
          select: { publishedAt: true, slug: true },
        });
        await this.prisma.publicLotListing.update({
          where: { id: existing.id },
          data: {
            isPublished: true,
            ...(!full?.publishedAt ? { publishedAt: new Date() } : {}),
          },
        });
        await this.revalidate.revalidateListing(existing.slug, { includeHome: true });
      }
      return;
    }
    const lodat = await this.prisma.lodat.findUnique({
      where: { id: lodatId },
      include: LODAT_INCLUDE,
    });
    if (!lodat) return;
    if (!lodat.maps.length) return;
    const title = this.lodatTitle(lodat);
    const location = this.lodatLocation(lodat);
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
    const hub = await this.persistCommuneHubForLodat(created.lodat);
    await this.revalidate.revalidateListing(created.slug, {
      includeHome: true,
      extraPaths: this.communeHubRevalidatePaths(hub?.slug, hub?.previousSlug),
    });
  }

  /**
   * Đồng bộ title/location overlay từ CRM (slug giữ nguyên). Revalidate hangtag/catalog.
   */
  async syncListingFromLodat(lodatId: string): Promise<void> {
    await this.ensureListingForLodat(lodatId);
    const lodat = await this.prisma.lodat.findUnique({
      where: { id: lodatId },
      include: LODAT_INCLUDE,
    });
    if (!lodat?.maps.length) return;
    const listing = await this.prisma.publicLotListing.findUnique({
      where: { lodatId },
    });
    if (!listing) return;
    const title = this.lodatTitle(lodat);
    const location = this.lodatLocation(lodat);
    const excerpt =
      listing.bodyHtml?.trim()
        ? listing.excerpt
        : [title, location].filter(Boolean).join('. ');
    const saved = await this.prisma.publicLotListing.update({
      where: { id: listing.id },
      data: {
        title,
        location,
        excerpt,
        isPublished: true,
        ...(!listing.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });
    const hub = await this.persistCommuneHubForLodat(lodat);
    await this.revalidate.revalidateListing(saved.slug, {
      includeHome: true,
      extraPaths: this.communeHubRevalidatePaths(hub?.slug, hub?.previousSlug),
    });
  }

  /** Backfill: mọi lô STAFF đang có chủ → có listing. */
  async ensureListingsForStaff(userId: string): Promise<void> {
    const lodats = await this.prisma.lodat.findMany({
      where: {
        createdByEmployeeId: userId,
        maps: { some: { isActive: true } },
      },
      select: { id: true },
    });
    for (const row of lodats) {
      await this.ensureListingForLodat(row.id);
    }
  }

  /** Keep old guest URLs working when staff/GPT đổi slug overlay. */
  private async recordLotSlugChange(oldSlug: string, newSlug: string): Promise<void> {
    if (!oldSlug || !newSlug || oldSlug === newSlug) return;
    await this.prisma.publicLotSlugRedirect.deleteMany({ where: { fromSlug: newSlug } });
    await this.prisma.publicLotSlugRedirect.upsert({
      where: { fromSlug: oldSlug },
      create: { fromSlug: oldSlug, toSlug: newSlug },
      update: { toSlug: newSlug },
    });
    await this.prisma.publicLotSlugRedirect.updateMany({
      where: { toSlug: oldSlug },
      data: { toSlug: newSlug },
    });
  }

  async listAdminLots(user: RequestUser) {
    if (user.role === 'STAFF') {
      await this.ensureListingsForStaff(user.id);
    }
    const rows = await this.prisma.publicLotListing.findMany({
      where:
        user.role === 'ADMIN'
          ? undefined
          : { lodat: { createdByEmployeeId: user.id } },
      include: { lodat: { include: LODAT_INCLUDE } },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toAdminRow(row));
  }

  async uploadPublicMedia(
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname?: string;
    },
    opts?: { title?: string; index?: number },
  ) {
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
    const title = opts?.title?.trim();
    if (title) {
      const { objectKey, fileName } = await uniqueSeoPostImageKey(this.storage, {
        title,
        index: opts?.index ?? 1,
      });
      const uploaded = await this.storage.upload({
        folder: 'public-web',
        buffer: file.buffer,
        contentType: mime,
        originalName: file.originalname,
        objectKey,
        contentFileName: fileName,
      });
      return { url: uploaded.url, objectKey: uploaded.objectKey };
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

  async updateDraft(user: RequestUser, id: string, dto: UpdatePublicListingDraftDto) {
    this.assertStaffCanWriteListing(user);
    if (dto.priceMode === 'AMOUNT' && !dto.priceLabel?.trim()) {
      throw new BadRequestException('Nhập giá công khai hoặc chọn Liên hệ');
    }
    const lodat = await this.requireLodatForCompose(id, user);
    await this.ensureListingForLodat(lodat.id);
    const existing = await this.prisma.publicLotListing.findUnique({
      where: { lodatId: lodat.id },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bài đăng web của lô.');
    }
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
      isPublished: boolean;
      publishedAt?: Date;
      metaDescription?: string | null;
      seoTitle?: string | null;
    } = {
      title: dto.title.trim(),
      location: dto.location.trim(),
      priceMode: dto.priceMode,
      priceLabel,
      excerpt,
      bodyHtml,
      isPublished: true,
      ...(!existing.publishedAt ? { publishedAt: new Date() } : {}),
    };
    if (metaDescription !== undefined) {
      data.metaDescription = metaDescription;
    }
    if (seoTitle !== undefined) {
      data.seoTitle = seoTitle;
    }
    // BUG-066: NV cannot edit URL. Ignore client `slug` — keep the stored path.
    const saved = await this.prisma.publicLotListing.update({
      where: { id: existing.id },
      data,
      include: { lodat: { include: LODAT_INCLUDE } },
    });
    const hub = await this.persistCommuneHubForLodat(saved.lodat);
    await this.revalidate.revalidateListing(saved.slug, {
      includeHome: true,
      extraPaths: this.communeHubRevalidatePaths(hub?.slug, hub?.previousSlug),
    });
    return this.toAdminRow(saved);
  }

  async setPublished(user: RequestUser, id: string, isPublished: boolean) {
    this.assertStaffCanWriteListing(user);
    // Owner 2026-09-07: no unpublish / Gỡ — listing + slug forever.
    if (!isPublished) {
      throw new BadRequestException(
        'Không hỗ trợ gỡ bài đăng web. Slug và bài giữ mãi; trạng thái khách theo CRM.',
      );
    }
    const lodat = await this.requireLodatForCompose(id, user);
    await this.ensureListingForLodat(lodat.id);
    const existing = await this.prisma.publicLotListing.findUnique({
      where: { lodatId: lodat.id },
      include: { lodat: { include: LODAT_INCLUDE } },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bài đăng web của lô.');
    }
    if (existing.isPublished) {
      return this.toAdminRow(existing);
    }
    const saved = await this.prisma.publicLotListing.update({
      where: { id: existing.id },
      data: {
        isPublished: true,
        ...(!existing.publishedAt ? { publishedAt: new Date() } : {}),
      },
      include: { lodat: { include: LODAT_INCLUDE } },
    });
    await this.ensureSeoImageKeysForLodat(lodat);
    const hub = await this.persistCommuneHubForLodat(saved.lodat);
    await this.revalidate.revalidateListing(saved.slug, {
      includeHome: true,
      extraPaths: this.communeHubRevalidatePaths(hub?.slug, hub?.previousSlug),
    });
    return this.toAdminRow(saved);
  }

  private assertStaffCanWriteListing(user: RequestUser) {
    if (user.role !== 'STAFF') {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
  }

  /** Compose/update overlay for any CRM sale status (listing always-on). */
  private async requireLodatForCompose(id: string, user: RequestUser): Promise<LodatLoaded> {
    const byListing = await this.prisma.publicLotListing.findFirst({
      where: { OR: [{ id }, { lodatId: id }] },
      select: { lodatId: true },
    });
    const lodatId = byListing?.lodatId ?? id;
    const lodat = await this.prisma.lodat.findUnique({
      where: { id: lodatId },
      include: LODAT_INCLUDE,
    });
    if (!lodat) throw new NotFoundException('Không tìm thấy lô đất.');
    this.assertCanAccessLodat(user, lodat.createdByEmployeeId);
    if (!lodat.maps.length) {
      throw new BadRequestException('Lô chưa gắn chủ — chưa có bài đăng web.');
    }
    return lodat;
  }

  private assertCanAccessLodat(user: RequestUser, createdByEmployeeId: string) {
    if (user.role !== 'STAFF' || createdByEmployeeId !== user.id) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }
  }

  private async uniqueSlug(base: string): Promise<string> {
    return nextUniqueLotGuestSlug(toPublicSlug(base, 0, 'lo-dat'), (slug) =>
      lotGuestSlugOccupied(this.prisma, slug),
    );
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

  private geosFromListings(rows: ListingRow[]): AddressGeo[] {
    return rows
      .map((row) => addressGeo(this.lodatAddress(row.lodat)))
      .filter((g): g is AddressGeo => g != null);
  }

  private communeHubRevalidatePaths(slug?: string, previousSlug?: string): string[] {
    const paths: string[] = [];
    if (slug) paths.push(listingCommuneHubPath(slug));
    if (previousSlug && previousSlug !== slug) {
      paths.push(listingCommuneHubPath(previousSlug));
    }
    return paths;
  }

  private async persistCommuneHubForLodat(lodat: LodatLoaded) {
    const geo = addressGeo(this.lodatAddress(lodat));
    if (!geo) return null;
    return this.communeHubs.persistFromGeo(geo);
  }

  /**
   * Catalog / sitemap / hubs / listing detail (BUG-069).
   * Owner 2026-09-07: mọi trạng thái bán — hangtag trên khách; không lọc Mở bán.
   */
  private async loadPublishedCatalog(): Promise<{
    items: ReturnType<PublicContentService['toCatalog']>[];
    hubMaps: HubSlugMaps;
    persisted: Awaited<ReturnType<PublicCommuneHubsService['listPersisted']>>;
  }> {
    const rows = await this.prisma.publicLotListing.findMany({
      where: { isPublished: true },
      include: { lodat: { include: LODAT_INCLUDE } },
      orderBy: { updatedAt: 'desc' },
    });
    const allGeos = this.geosFromListings(rows);
    await this.communeHubs.ensurePersisted(
      allGeos,
      preferredCommuneSlugByWardId(allGeos),
    );
    const persisted = await this.communeHubs.listPersisted();
    const persistedMap = new Map(
      persisted.map((hub) => [
        hub.wardId,
        {
          slug: hub.slug,
          label: hub.label,
          districtLabel: hub.districtLabel,
          provinceLabel: hub.provinceLabel,
        },
      ]),
    );
    const hubMaps = guestCatalogHubMaps(allGeos, persistedMap);
    const items = rows.map((row) => this.toCatalog(row, hubMaps));
    return { items, hubMaps, persisted };
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

  /** Leftover UUID/old-slug keys only — create/edit already writes SEO names. */
  private async ensureSeoImageKeysForLodat(lodat: LodatLoaded): Promise<void> {
    if (!this.storage.isConfigured()) return;
    const title = this.lodatTitle(lodat);
    const location = this.lodatLocation(lodat);
    try {
      await retargetLodatSeoImages(this.prisma, this.storage, {
        lodatId: lodat.id,
        title,
        location,
        images: lodat.images,
      });
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
    const saleStatus = lodat.maps[0]?.status ?? 'TAM_DUNG';

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
      saleStatus,
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
    let bodyHtml = dto.bodyHtml ?? '';
    let coverImageUrl = dto.coverImageUrl?.trim() || null;
    const title = dto.title.trim();
    try {
      const rewritten = await rewritePostSeoImages(this.storage, {
        title,
        coverImageUrl,
        bodyHtml,
      });
      coverImageUrl = rewritten.coverImageUrl;
      bodyHtml = rewritten.bodyHtml;
    } catch (err) {
      this.logger.warn(
        `Post SEO image rewrite skipped: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    const excerpt =
      dto.excerpt?.trim() ||
      postBodyToExcerpt(bodyHtml) ||
      title;
    const slugBase = dto.slug?.trim()
      ? toPublicPostSlug(dto.slug)
      : toPublicPostSlug(title);
    const slug = await this.uniquePostSlug(dto.category, slugBase);
    const isPublished = dto.status === 'PUBLISHED';
    const saved = await this.prisma.publicPost.create({
      data: {
        title,
        category: dto.category,
        status: dto.status,
        coverImageUrl,
        bodyHtml,
        excerpt,
        slug,
        metaDescription: dto.metaDescription?.trim() || null,
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
        includeHome: true,
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
      slug = `${root}-${n}`;
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
