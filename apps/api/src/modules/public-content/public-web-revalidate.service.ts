import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Gọi Next on-demand revalidate qua loopback.
 * Không dùng https://anhungland.com/api/… — nginx `/api/` đi Nest.
 */
@Injectable()
export class PublicWebRevalidateService {
  private readonly logger = new Logger(PublicWebRevalidateService.name);

  constructor(private readonly config: ConfigService) {}

  async revalidateListing(slug: string, opts?: { includeHome?: boolean }): Promise<void> {
    const paths = [`/mua-ban-nha-dat/${slug}`, '/mua-ban-nha-dat', '/sitemap.xml'];
    if (opts?.includeHome) paths.push('/');
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
        body: JSON.stringify({ paths }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(
          `revalidate ${res.status} ${url} paths=${paths.join(',')}: ${text.slice(0, 200)}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `revalidate failed ${url} paths=${paths.join(',')}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
