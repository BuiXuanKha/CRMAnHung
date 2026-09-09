import {
  LodatKind,
  PublicPostStatus,
  listingBodyToExcerpt,
  resolveStaffListingPublicPrice,
  type LodatListItem,
  type PublicWebDashboard,
  type PublicWebLotRow,
  type PublicWebPostRow,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import { toListingPublicSlug } from './display';
import { plainTextToListingBodyHtml, suggestPublicExcerpt } from './listing-copy';
import { sortStaffLotsByNeedsWebUpdate } from './listing-crm-drift';

function listingNeedsCompose(listing: PublicWebLotRow | undefined): boolean {
  return !listing?.bodyHtml?.trim();
}

/** Staff Đăng web list — mọi lô đã gắn chủ; listing luôn có sau ensure API. */
export function buildStaffOpenLots(
  plots: LodatListItem[],
  listings: PublicWebLotRow[],
): PublicWebStaffLotRow[] {
  const rows = plots.map((plot) => {
    const listing = listings.find((row) => row.lodatId === plot.id);
    const needsCompose = listingNeedsCompose(listing);
    const { priceMode, priceLabel } = resolveStaffListingPublicPrice({
      crmPriceVnd: plot.priceVnd,
      listingPriceMode: listing?.priceMode,
      listingPriceLabel: listing?.priceLabel,
      needsCompose,
    });
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
      // Staff badge: «Đã soạn» vs «Chưa soạn» (reuse isPublished flag).
      isPublished: !needsCompose,
      priceMode,
      priceLabel,
      excerpt,
      bodyHtml: listing?.bodyHtml?.trim() ? bodyHtml : needsCompose ? '' : bodyHtml,
      staffName,
      kind,
      areaM2,
      frontageM,
      direction,
      priceVnd: plot.priceVnd ?? null,
      needsWebUpdate: Boolean(listing?.needsWebUpdate),
      ...(listing?.seoTitle != null ? { seoTitle: listing.seoTitle } : {}),
    };
  });
  return sortStaffLotsByNeedsWebUpdate(rows);
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
