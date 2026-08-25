import { Prisma } from '@prisma/client';

const RANGE_MAX = 9_000_000_000_000_000;

function overlap(rangeMin: number, rangeMax: number): Prisma.CustomerWhereInput {
  return {
    AND: [
      {
        OR: [{ budgetMinVnd: null }, { budgetMinVnd: { lte: BigInt(rangeMax) } }],
      },
      {
        OR: [{ budgetMaxVnd: null }, { budgetMaxVnd: { gte: BigInt(rangeMin) } }],
      },
    ],
  };
}

export function budgetFilterWhere(
  key: string | undefined,
): Prisma.CustomerWhereInput | null {
  switch (key) {
    case 'none':
      return { budgetMinVnd: null, budgetMaxVnd: null };
    case 'has':
      return {
        OR: [{ budgetMinVnd: { not: null } }, { budgetMaxVnd: { not: null } }],
      };
    case 'lt_1b':
      return overlap(0, 1_000_000_000);
    case '1b_2b':
      return overlap(1_000_000_000, 2_000_000_000);
    case 'gt_2b':
      return overlap(2_000_000_000, RANGE_MAX);
    default:
      return null;
  }
}

export function needFilterWhere(
  key: string | undefined,
): Prisma.CustomerWhereInput | null {
  const hasNeed: Prisma.CustomerWhereInput = {
    careNotes: {
      some: {
        AND: [{ needSummary: { not: null } }, { needSummary: { not: '' } }],
      },
    },
  };
  if (key === 'has') return hasNeed;
  if (key === 'empty') return { NOT: hasNeed };
  return null;
}

export function lodatFilterWhere(
  key: string | undefined,
): Prisma.CustomerWhereInput | null {
  const hasLodat: Prisma.CustomerWhereInput = {
    lodatMaps: { some: { isActive: true } },
  };
  if (key === 'has') return hasLodat;
  if (key === 'empty') return { NOT: hasLodat };
  return null;
}

export function contactChannelWhere(
  raw: string | undefined,
): Prisma.CustomerWhereInput | null {
  const value = raw?.trim() ?? '';
  if (!value) return null;
  if (value.startsWith('fb:')) {
    const uid = value.slice(3).trim();
    if (!uid) return null;
    return { facebook: { is: { employeeFacebookUid: uid } } };
  }
  if (value.startsWith('hotline:')) {
    const id = value.slice(8).trim();
    if (!id) return null;
    return { sourceHotlineId: id };
  }
  return null;
}
