import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { guestLotShareUrl } from '@crmanhung/shared';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { userAvatarUrl } from '../users/users-view';

const SHARE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SHARE_CODE_LEN = 5;
const MAX_CODE_ATTEMPTS = 12;

@Injectable()
export class LotSharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {}

  async createOrGetShareLink(user: RequestUser, lodatId: string) {
    const lodat = await this.prisma.lodat.findUnique({
      where: { id: lodatId },
      select: { id: true, createdByEmployeeId: true },
    });
    if (!lodat) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }
    if (user.role !== 'ADMIN' && lodat.createdByEmployeeId !== user.id) {
      throw new NotFoundException('Không tìm thấy lô đất.');
    }

    const listing = await this.prisma.publicLotListing.findUnique({
      where: { lodatId },
      select: { id: true, slug: true, isPublished: true },
    });
    if (!listing?.isPublished) {
      throw new BadRequestException('Lô chưa đăng lên web khách — cần publish trước khi share.');
    }

    return this.createOrGetShareLinkForListing(user, listing);
  }

  /** NV đăng nhập share từ trang công khai (theo slug). */
  async createOrGetShareLinkBySlug(user: RequestUser, slug: string) {
    const listing = await this.prisma.publicLotListing.findUnique({
      where: { slug: slug.trim() },
      select: { id: true, slug: true, isPublished: true },
    });
    if (!listing?.isPublished) {
      throw new BadRequestException('Lô chưa đăng lên web khách — cần publish trước khi share.');
    }
    // By design: any active STAFF/ADMIN may create their own shareCode on a
    // published listing; guest sees that staff's hotline (not the lodat owner).
    return this.createOrGetShareLinkForListing(user, listing);
  }

  private async createOrGetShareLinkForListing(
    user: RequestUser,
    listing: { id: string; slug: string },
  ) {
    const employee = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, fullName: true, phone: true, isActive: true },
    });
    if (!employee?.isActive) {
      throw new BadRequestException('Tài khoản không hoạt động.');
    }
    const phone = employee.phone?.trim();
    if (!phone) {
      throw new BadRequestException(
        'Tài khoản chưa có SĐT — Admin cập nhật SĐT trong Quản lý người dùng.',
      );
    }

    const existing = await this.prisma.publicLotShare.findUnique({
      where: {
        employeeId_publicListingId: {
          employeeId: user.id,
          publicListingId: listing.id,
        },
      },
      select: { shareCode: true },
    });

    const shareCode =
      existing?.shareCode ??
      (await this.createShareCode(user.id, listing.id));

    const origin = this.config.get<string>('PUBLIC_SITE_ORIGIN');
    const url = guestLotShareUrl(listing.slug, shareCode, origin);

    return {
      shareCode,
      slug: listing.slug,
      url,
    };
  }

  async resolveShareCode(shareCode: string) {
    const code = shareCode.trim().toUpperCase();
    const row = await this.prisma.publicLotShare.findUnique({
      where: { shareCode: code },
      include: {
        employee: {
          select: { fullName: true, phone: true, isActive: true, avatarObjectKey: true },
        },
        publicListing: { select: { slug: true, isPublished: true } },
      },
    });
    if (!row || !row.publicListing.isPublished || !row.employee.isActive) {
      throw new NotFoundException('Link share không hợp lệ.');
    }
    const phone = row.employee.phone?.trim();
    if (!phone) {
      throw new NotFoundException('Link share không hợp lệ.');
    }
    const avatarUrl = userAvatarUrl(this.storage, row.employee.avatarObjectKey);
    return {
      shareCode: row.shareCode,
      listingSlug: row.publicListing.slug,
      employeeId: row.employeeId,
      employee: {
        fullName: row.employee.fullName,
        phone,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      visitCount: row.visitCount,
    };
  }

  async recordVisit(shareCode: string) {
    const code = shareCode.trim().toUpperCase();
    try {
      const row = await this.prisma.publicLotShare.update({
        where: { shareCode: code },
        data: { visitCount: { increment: 1 } },
        select: { visitCount: true, publicListing: { select: { isPublished: true } } },
      });
      if (!row.publicListing.isPublished) {
        throw new NotFoundException('Link share không hợp lệ.');
      }
      return { ok: true as const, visitCount: row.visitCount };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('Link share không hợp lệ.');
      }
      throw err;
    }
  }

  /**
   * Public page view: cookie share hợp lệ → NV; không / mã không còn → Truy cập trực tiếp.
   * JWT NV → không đếm.
   */
  async recordPublicPageView(shareCode: string | undefined, hasBearerToken: boolean) {
    if (hasBearerToken) {
      return { ok: true as const, viewCount: 0 };
    }
    const code = shareCode?.trim().toUpperCase() ?? '';
    if (code) {
      const share = await this.findActiveShare(code);
      if (share) {
        return this.incrementEmployeeView(share.employeeId);
      }
    }
    return this.incrementDirectView();
  }

  /** Cookie share còn hạn: mỗi lần khách đổi/tải trang public → +1 cho NV. */
  async recordAttributedPageView(shareCode: string, hasBearerToken: boolean) {
    if (hasBearerToken) {
      return { ok: true as const, viewCount: 0 };
    }
    const share = await this.findActiveShare(shareCode.trim().toUpperCase());
    if (!share) {
      throw new NotFoundException('Link share không hợp lệ.');
    }
    return this.incrementEmployeeView(share.employeeId);
  }

  private async findActiveShare(shareCode: string) {
    if (!shareCode) return null;
    const share = await this.prisma.publicLotShare.findUnique({
      where: { shareCode },
      select: {
        employeeId: true,
        employee: { select: { isActive: true } },
        publicListing: { select: { isPublished: true } },
      },
    });
    if (!share || !share.publicListing.isPublished || !share.employee.isActive) {
      return null;
    }
    return share;
  }

  private async incrementEmployeeView(employeeId: string) {
    const row = await this.prisma.publicShareViewStat.upsert({
      where: { employeeId },
      create: { employeeId, viewCount: 1 },
      update: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    return { ok: true as const, viewCount: row.viewCount };
  }

  private async incrementDirectView() {
    const row = await this.prisma.publicDirectViewStat.upsert({
      where: { id: 'direct' },
      create: { id: 'direct', viewCount: 1 },
      update: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    return { ok: true as const, viewCount: row.viewCount };
  }

  private async createShareCode(employeeId: string, publicListingId: string): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const shareCode = this.randomShareCode();
      try {
        await this.prisma.publicLotShare.create({
          data: { shareCode, employeeId, publicListingId },
        });
        return shareCode;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          const target = String(err.meta?.target ?? '');
          if (target.includes('employeeId') && target.includes('publicListingId')) {
            const existing = await this.prisma.publicLotShare.findUnique({
              where: {
                employeeId_publicListingId: { employeeId, publicListingId },
              },
              select: { shareCode: true },
            });
            if (existing) return existing.shareCode;
          }
          continue;
        }
        throw err;
      }
    }
    throw new BadRequestException('Không tạo được mã share — thử lại sau.');
  }

  /** ADMIN thống kê: mỗi NV, số listing đã tạo mã share + lượt xem trực tiếp. */
  async listEmployeeShareStats() {
    const [users, grouped, viewRows, directRow] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: { in: ['STAFF', 'ADMIN'] } },
        select: {
          id: true,
          fullName: true,
          username: true,
          phone: true,
          role: true,
          isActive: true,
          avatarObjectKey: true,
        },
      }),
      this.prisma.publicLotShare.groupBy({
        by: ['employeeId'],
        _count: { _all: true },
      }),
      this.prisma.publicShareViewStat.findMany({
        select: { employeeId: true, viewCount: true },
      }),
      this.prisma.publicDirectViewStat.findUnique({
        where: { id: 'direct' },
        select: { viewCount: true },
      }),
    ]);
    const countByEmployee = new Map(
      grouped.map((row) => [row.employeeId, row._count._all]),
    );
    const viewsByEmployee = new Map(
      viewRows.map((row) => [row.employeeId, row.viewCount]),
    );
    const items = users
      .map((user) => ({
        employeeId: user.id,
        fullName: user.fullName,
        username: user.username,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        avatarUrl: userAvatarUrl(this.storage, user.avatarObjectKey),
        sharedListingCount: countByEmployee.get(user.id) ?? 0,
        attributedViewCount: viewsByEmployee.get(user.id) ?? 0,
      }))
      .sort((a, b) => {
        const byViews = b.attributedViewCount - a.attributedViewCount;
        if (byViews !== 0) return byViews;
        const byShare = b.sharedListingCount - a.sharedListingCount;
        if (byShare !== 0) return byShare;
        return a.fullName.localeCompare(b.fullName, 'vi');
      });
    return {
      items,
      total: items.length,
      directViewCount: directRow?.viewCount ?? 0,
    };
  }

  private randomShareCode(): string {
    const bytes = randomBytes(SHARE_CODE_LEN);
    return Array.from(bytes, (b) => SHARE_CODE_CHARS[b % SHARE_CODE_CHARS.length]!).join('');
  }
}
