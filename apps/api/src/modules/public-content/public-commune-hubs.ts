import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicSlug } from './public-slug';
import {
  nextUniqueHubSlug,
  type AddressGeo,
  type CommuneSlugMeta,
} from './public-listing-hub-slugs';

export type PersistCommuneHubResult = CommuneSlugMeta & {
  previousSlug?: string;
};

function metaFromRow(row: {
  slug: string;
  label: string;
  districtLabel: string;
  provinceLabel: string;
}): CommuneSlugMeta {
  return {
    slug: row.slug,
    label: row.label,
    districtLabel: row.districtLabel,
    provinceLabel: row.provinceLabel,
  };
}

function uniqueGeos(geos: AddressGeo[]): AddressGeo[] {
  const byWard = new Map<string, AddressGeo>();
  for (const geo of geos) {
    if (!byWard.has(geo.wardId)) byWard.set(geo.wardId, geo);
  }
  return [...byWard.values()];
}

@Injectable()
export class PublicCommuneHubsService {
  constructor(private readonly prisma: PrismaService) {}

  async loadByWardId(): Promise<Map<string, CommuneSlugMeta>> {
    const rows = await this.prisma.publicCommuneHub.findMany();
    return new Map(rows.map((row) => [row.wardId, metaFromRow(row)]));
  }

  async findBySlug(slug: string) {
    const key = slug.trim();
    if (!key) return null;
    return this.prisma.publicCommuneHub.findUnique({ where: { slug: key } });
  }

  async findRedirect(fromSlug: string): Promise<{ toSlug: string } | null> {
    const key = fromSlug.trim();
    if (!key) return null;
    const row = await this.prisma.publicCommuneHubRedirect.findUnique({
      where: { fromSlug: key },
      select: { toSlug: true },
    });
    return row ?? null;
  }

  async listPersisted() {
    return this.prisma.publicCommuneHub.findMany({
      orderBy: { label: 'asc' },
    });
  }

  /**
   * Create missing hubs (keep current derived slug on first insert).
   * Rename xã → new slug + 301. Never delete when lots go to zero.
   */
  async ensurePersisted(
    geos: AddressGeo[],
    preferredSlugByWardId?: Map<string, string>,
  ): Promise<Map<string, CommuneSlugMeta>> {
    const distinct = uniqueGeos(geos);
    let byWard = await this.loadByWardId();
    for (const geo of distinct) {
      const existing = byWard.get(geo.wardId);
      const needsCreate = !existing;
      const needsRename = Boolean(existing && existing.label !== geo.wardName);
      const needsMeta =
        Boolean(existing) &&
        (existing!.districtLabel !== geo.districtName ||
          existing!.provinceLabel !== geo.provinceName);
      if (!needsCreate && !needsRename && !needsMeta) continue;
      const saved = await this.persistFromGeo(
        geo,
        needsCreate ? preferredSlugByWardId?.get(geo.wardId) : undefined,
      );
      byWard.set(geo.wardId, saved);
    }
    return byWard;
  }

  async persistFromGeo(
    geo: AddressGeo,
    preferredSlug?: string,
  ): Promise<PersistCommuneHubResult> {
    const existing = await this.prisma.publicCommuneHub.findUnique({
      where: { wardId: geo.wardId },
    });
    const nextLabel = geo.wardName;
    const districtLabel = geo.districtName;
    const provinceLabel = geo.provinceName;

    if (!existing) {
      const base = (preferredSlug?.trim() || toPublicSlug(nextLabel, 60, 'xa')).trim();
      const slug = await this.uniqueSlug(base);
      const created = await this.prisma.publicCommuneHub.create({
        data: {
          wardId: geo.wardId,
          slug,
          label: nextLabel,
          districtLabel,
          provinceLabel,
        },
      });
      return metaFromRow(created);
    }

    const labelChanged = existing.label !== nextLabel;
    let slug = existing.slug;
    let previousSlug: string | undefined;
    if (labelChanged) {
      const desired = toPublicSlug(nextLabel, 60, 'xa');
      const nextSlug = await this.uniqueSlug(desired, existing.wardId);
      if (nextSlug !== existing.slug) {
        await this.recordSlugChange(existing.slug, nextSlug);
        slug = nextSlug;
        previousSlug = existing.slug;
      }
    }

    const saved = await this.prisma.publicCommuneHub.update({
      where: { id: existing.id },
      data: {
        slug,
        label: nextLabel,
        districtLabel,
        provinceLabel,
      },
    });
    return { ...metaFromRow(saved), ...(previousSlug ? { previousSlug } : {}) };
  }

  private async uniqueSlug(base: string, exceptWardId?: string): Promise<string> {
    const root = toPublicSlug(base, 60, 'xa');
    const [hubs, redirects] = await Promise.all([
      this.prisma.publicCommuneHub.findMany({
        select: { slug: true, wardId: true },
      }),
      this.prisma.publicCommuneHubRedirect.findMany({
        select: { fromSlug: true },
      }),
    ]);
    const taken = new Set<string>();
    for (const row of hubs) {
      if (exceptWardId && row.wardId === exceptWardId) continue;
      taken.add(row.slug);
    }
    for (const row of redirects) taken.add(row.fromSlug);
    return nextUniqueHubSlug(root, taken);
  }

  private async recordSlugChange(oldSlug: string, newSlug: string): Promise<void> {
    if (!oldSlug || !newSlug || oldSlug === newSlug) return;
    await this.prisma.publicCommuneHubRedirect.deleteMany({ where: { fromSlug: newSlug } });
    await this.prisma.publicCommuneHubRedirect.upsert({
      where: { fromSlug: oldSlug },
      create: { fromSlug: oldSlug, toSlug: newSlug },
      update: { toSlug: newSlug },
    });
    await this.prisma.publicCommuneHubRedirect.updateMany({
      where: { toSlug: oldSlug },
      data: { toSlug: newSlug },
    });
  }
}
