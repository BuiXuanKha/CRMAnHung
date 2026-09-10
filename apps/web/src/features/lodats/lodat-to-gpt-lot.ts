import {
  LodatKind,
  type LodatListItem,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';

/** Minimal staff lot row for GPT modal from `/lo-dat` list item. */
export function lodatListItemToGptLot(plot: LodatListItem): PublicWebStaffLotRow {
  return {
    id: `lodat-list-${plot.id}`,
    lodatId: plot.id,
    slug: plot.id,
    title: plot.title,
    location: plot.address?.trim() || '',
    coverImageUrl: plot.coverImageUrl ?? null,
    isPublished: Boolean(plot.hasWebBody),
    priceMode: 'CONTACT',
    priceLabel: null,
    excerpt: '',
    bodyHtml: '',
    needsWebUpdate: Boolean(plot.needsWebUpdate),
    staffName: plot.createdByEmployeeName?.trim() || '—',
    kind: plot.kind ?? LodatKind.DAT,
    areaM2: plot.areaM2 ?? null,
    frontageM: plot.frontageM ?? null,
    direction: plot.direction ?? null,
    priceVnd: plot.priceVnd ?? null,
  };
}
