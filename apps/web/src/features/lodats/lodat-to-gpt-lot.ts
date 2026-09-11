import {
  LodatKind,
  resolveStaffListingPublicPrice,
  toListingPublicSlug,
  type LodatListItem,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import { suggestPublicExcerpt } from '@/features/public-content/listing-copy';

/**
 * Staff lot row for GPT modal from `/lo-dat` list or detail (`LodatDetail` extends list).
 * Price/excerpt defaults when listing overlay chưa tải.
 */
export function lodatListItemToGptLot(plot: LodatListItem): PublicWebStaffLotRow {
  const title = plot.title;
  const location = plot.address?.trim() || '';
  const kind = plot.kind ?? LodatKind.DAT;
  const areaM2 = plot.areaM2 ?? null;
  const frontageM = plot.frontageM ?? null;
  const direction = plot.direction ?? null;
  const needsCompose = !plot.hasWebBody;
  const { priceMode, priceLabel } = resolveStaffListingPublicPrice({
    crmPriceVnd: plot.priceVnd,
    listingPriceMode: null,
    listingPriceLabel: null,
    needsCompose,
  });
  const excerpt = suggestPublicExcerpt({
    title,
    location,
    kind,
    areaM2,
    frontageM,
    direction,
  });

  return {
    id: `lodat-list-${plot.id}`,
    lodatId: plot.id,
    slug: toListingPublicSlug(title, location),
    title,
    location,
    coverImageUrl: plot.coverImageUrl ?? null,
    isPublished: Boolean(plot.hasWebBody),
    priceMode,
    priceLabel,
    excerpt,
    bodyHtml: '',
    needsWebUpdate: Boolean(plot.needsWebUpdate),
    staffName: plot.createdByEmployeeName?.trim() || '—',
    kind,
    areaM2,
    frontageM,
    direction,
    priceVnd: plot.priceVnd ?? null,
  };
}
