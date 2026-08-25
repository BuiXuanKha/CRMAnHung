import { Prisma } from '@prisma/client';

const ADDRESS_INCLUDE = {
  province: { select: { name: true, isHidden: true } },
  district: { select: { name: true, isHidden: true } },
  ward: { select: { name: true, isHidden: true } },
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { objectKey: true },
  },
} satisfies Prisma.AddressInclude;

export const LODAT_SNAPSHOT_INCLUDE = {
  address: { include: ADDRESS_INCLUDE },
  projectLot: {
    include: { address: { include: ADDRESS_INCLUDE } },
  },
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { id: true, objectKey: true, rotationDeg: true },
  },
} satisfies Prisma.LodatInclude;

export type LodatSnapshotRow = Prisma.LodatGetPayload<{ include: typeof LODAT_SNAPSHOT_INCLUDE }>;

type MapSnap = {
  status: string;
  priceVnd: bigint | null;
  priceNote: string | null;
  brokerFeeNote: string | null;
  note: string | null;
};

type Addr = {
  detail: string | null;
  ward?: { name: string; isHidden: boolean } | null;
  district?: { name: string; isHidden: boolean } | null;
  province?: { name: string; isHidden: boolean } | null;
  images?: { objectKey: string }[];
};

function formatAddress(addr: Addr | null): string | null {
  if (!addr) return null;
  const parts = [
    addr.detail?.trim() || null,
    addr.ward && !addr.ward.isHidden ? addr.ward.name : null,
    addr.district && !addr.district.isHidden ? addr.district.name : null,
    addr.province && !addr.province.isHidden ? addr.province.name : null,
  ].filter(Boolean) as string[];
  return parts.length ? parts.join(', ') : null;
}

function resolveAddress(row: LodatSnapshotRow): Addr | null {
  if (row.projectLotId && row.projectLot?.address) return row.projectLot.address;
  return row.address;
}

export function buildSnapshotCreate(row: LodatSnapshotRow, map: MapSnap) {
  const isProject = Boolean(row.projectLotId);
  const lot = row.projectLot;
  const title =
    (isProject ? lot?.title : row.title)?.trim() ||
    row.title?.trim() ||
    lot?.title?.trim() ||
    'Lô đất';
  const addr = resolveAddress(row);
  const images: {
    objectKey: string;
    sortOrder: number;
    rotationDeg: number;
    sourceLodatImageId: string | null;
  }[] = [];
  const seen = new Set<string>();

  if (row.projectLotId && addr?.images) {
    for (const img of addr.images) {
      if (!img.objectKey || seen.has(img.objectKey)) continue;
      seen.add(img.objectKey);
      images.push({
        objectKey: img.objectKey,
        sortOrder: images.length,
        rotationDeg: 0,
        sourceLodatImageId: null,
      });
    }
  }
  for (const img of row.images) {
    if (!img.objectKey || seen.has(img.objectKey)) continue;
    seen.add(img.objectKey);
    images.push({
      objectKey: img.objectKey,
      sortOrder: images.length,
      rotationDeg: ((img.rotationDeg % 360) + 360) % 360,
      sourceLodatImageId: img.id,
    });
  }

  return {
    title,
    addressText: formatAddress(addr),
    areaM2: isProject ? (lot?.areaM2 ?? row.areaM2) : row.areaM2,
    frontageM: isProject ? (lot?.frontageM ?? row.frontageM) : row.frontageM,
    direction: (isProject ? (lot?.direction ?? row.direction) : row.direction)?.trim() || null,
    propertyKind: row.propertyKind === 'NHA' ? 'NHA' : 'DAT',
    mapStatus: map.status,
    mapPriceVnd: map.priceVnd,
    mapPriceNote: map.priceNote,
    mapBrokerFeeNote: map.brokerFeeNote,
    mapNote: map.note,
    images: { create: images },
  };
}
