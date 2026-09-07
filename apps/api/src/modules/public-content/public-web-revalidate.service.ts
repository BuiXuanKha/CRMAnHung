import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PUBLIC_LISTING_PATH } from '@crmanhung/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicSlug } from './public-slug';
import { guestHubRevalidatePaths } from './public-listing-hub-slugs';

/**
 * Gọi Next on-demand revalidate qua loopback.
 * Không dùng https://anhungland.com/api/… — nginx `/api/` đi Nest.
 */
@Injectable()
export class PublicWebRevalidateService {
  private readonly logger = new Logger(PublicWebRevalidateService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async revalidateListing(
    slug: string,
    opts?: { includeHome?: boolean; extraPaths?: string[] },
  ): Promise<void> {
    await this.revalidateListings([slug], opts);
  }

  /** Catalog + sitemap + listing pages + current `/xa/…` hubs (BUG-070). */
  async revalidateListings(
    slugs: string[],
    opts?: { includeHome?: boolean; extraPaths?: string[] },
  ): Promise<void> {
    const uniqueSlugs = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))];
    const paths: string[] = uniqueSlugs.map((slug) => `${PUBLIC_LISTING_PATH}/${slug}`);
    paths.push(PUBLIC_LISTING_PATH, '/sitemap.xml');
    if (opts?.includeHome) paths.push('/');
    for (const slug of uniqueSlugs) {
      paths.push(...(await this.currentHubPaths(slug)));
    }
    if (opts?.extraPaths?.length) paths.push(...opts.extraPaths);
    await this.revalidatePaths(paths);
  }

  async revalidatePost(
    category: string,
    slug: string,
    opts?: { includeHome?: boolean },
  ): Promise<void> {
    const paths = [`/${category}/${slug}`, `/${category}`, '/sitemap.xml'];
    if (opts?.includeHome) paths.push('/');
    await this.revalidatePaths(paths);
  }

  async revalidatePaths(paths: string[]): Promise<void> {
    const unique = this.uniquePaths(paths);
    if (unique.length === 0) return;
    const secret = this.config.get<string>('REVALIDATE_SECRET')?.trim();
    const origin = (
      this.config.get<string>('PUBLIC_WEB_ORIGIN')?.trim() || 'http://127.0.0.1:5001'
    ).replace(/\/$/, '');
    if (!secret) {
      this.logger.warn('REVALIDATE_SECRET missing — skip on-demand revalidate');
      return;
    }
    const url = `${origin}/api/revalidate`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': secret,
        },
        body: JSON.stringify({ paths: unique }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(
          `revalidate ${res.status} ${url} paths=${unique.join(',')}: ${text.slice(0, 200)}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `revalidate failed ${url} paths=${unique.join(',')}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private uniquePaths(paths: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of paths) {
      const path = raw.trim();
      if (!path || seen.has(path)) continue;
      seen.add(path);
      out.push(path);
    }
    return out;
  }

  private async currentHubPaths(slug: string): Promise<string[]> {
    const row = await this.prisma.publicLotListing.findUnique({
      where: { slug },
      select: {
        lodat: {
          select: {
            projectLotId: true,
            address: {
              select: {
                detail: true,
                wardId: true,
                ward: { select: { name: true } },
              },
            },
            projectLot: {
              select: {
                address: {
                  select: {
                    detail: true,
                    wardId: true,
                    ward: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    const addr = row?.lodat?.projectLotId
      ? row.lodat.projectLot?.address
      : row?.lodat?.address;
    if (!addr?.wardId) return [];
    const hub = await this.prisma.publicCommuneHub.findUnique({
      where: { wardId: addr.wardId },
      select: { slug: true },
    });
    const communeSlug =
      hub?.slug ?? (addr.ward?.name ? toPublicSlug(addr.ward.name, 60, 'xa') : null);
    const placeSlug = addr.detail?.trim()
      ? toPublicSlug(addr.detail, 60, 'khu')
      : null;
    return guestHubRevalidatePaths({ communeSlug, placeSlug });
  }
}
