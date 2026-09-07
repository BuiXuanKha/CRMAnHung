import { reservePublicLotSlug } from './public-slug';

export type LotGuestSlugStore = {
  publicLotListing: {
    findUnique: (args: {
      where: { slug: string };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
  publicLotSlugRedirect: {
    findUnique: (args: {
      where: { fromSlug: string };
      select: { fromSlug: true };
    }) => Promise<{ fromSlug: string } | null>;
  };
};

/** Guest URL is taken if a live listing uses it or a 301 `fromSlug` still points away. */
export async function lotGuestSlugOccupied(
  db: LotGuestSlugStore,
  slug: string,
  excludeListingId?: string,
): Promise<boolean> {
  const listing = await db.publicLotListing.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (listing && listing.id !== excludeListingId) return true;
  const redirect = await db.publicLotSlugRedirect.findUnique({
    where: { fromSlug: slug },
    select: { fromSlug: true },
  });
  return redirect != null;
}

export async function nextUniqueLotGuestSlug(
  base: string,
  isOccupied: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = reservePublicLotSlug(base.trim() || 'lo-dat');
  let slug = root;
  let n = 2;
  while (await isOccupied(slug)) {
    slug = `${root}-${n}`;
    n += 1;
  }
  return slug;
}
