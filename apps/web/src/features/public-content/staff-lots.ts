import {
  LodatKind,
  LodatSaleStatus,
  PublicPostStatus,
  listingBodyToExcerpt,
  type LodatListItem,
  type PublicWebDashboard,
  type PublicWebLotRow,
  type PublicWebPostRow,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import { toListingPublicSlug } from './display';
import { plainTextToListingBodyHtml, suggestPublicExcerpt, suggestPublicPrice } from './listing-copy';

export function buildStaffOpenLots(
  plots: LodatListItem[],
  listings: PublicWebLotRow[],
): PublicWebStaffLotRow[] {
  return plots
    .filter((plot) => plot.status === LodatSaleStatus.DANG_BAN)
    .map((plot) => {
      const listing = listings.find((row) => row.lodatId === plot.id);
      const suggested = suggestPublicPrice(plot.priceVnd);
      const priceMode = listing?.priceMode ?? suggested.priceMode;
      const priceLabel =
        priceMode === 'AMOUNT' ? (listing?.priceLabel ?? suggested.priceLabel) : null;
      const staffName = plot.createdByEmployeeName?.trim() || '—';
      const title = listing?.title ?? plot.title;
      const location = listing?.location ?? plot.address ?? '';
      const kind = plot.kind ?? LodatKind.DAT;
      const areaM2 = plot.areaM2 ?? null;
      const frontageM = plot.frontageM ?? null;
      const direction = plot.direction ?? null;
      const suggestedExcerpt = suggestPublicExcerpt({
        title,
        location,
        kind,
        areaM2,
        frontageM,
        direction,
      });
      const bodyHtml =
        listing?.bodyHtml?.trim() ||
        plainTextToListingBodyHtml(listing?.excerpt?.trim() || suggestedExcerpt);
      const excerpt =
        listing?.excerpt?.trim() ||
        listingBodyToExcerpt(bodyHtml) ||
        suggestedExcerpt;
      return {
        id: listing?.id ?? `pending-${plot.id}`,
        lodatId: plot.id,
        slug: listing?.slug ?? toListingPublicSlug(title, location),
        title,
        location,
        coverImageUrl: listing?.coverImageUrl ?? plot.coverImageUrl ?? null,
        isPublished: listing?.isPublished ?? false,
        priceMode,
        priceLabel,
        excerpt,
        bodyHtml,
        staffName,
        kind,
        areaM2,
        frontageM,
        direction,
        priceVnd: plot.priceVnd ?? null,
        ...(listing?.seoTitle != null ? { seoTitle: listing.seoTitle } : {}),
      };
    });
}

export function buildPublicWebDashboard(
  lots: PublicWebLotRow[],
  posts: PublicWebPostRow[],
  staffOpen: PublicWebStaffLotRow[],
): PublicWebDashboard {
  return {
    publishedLotCount: staffOpen.filter((row) => row.isPublished).length,
    pendingLotCount: staffOpen.filter((row) => !row.isPublished).length,
    publishedPostCount: posts.filter((row) => row.status === PublicPostStatus.PUBLISHED).length,
    draftPostCount: posts.filter((row) => row.status === PublicPostStatus.DRAFT).length,
    recentLots: lots.slice(0, 8),
    recentPosts: posts.slice(0, 8),
  };
}
