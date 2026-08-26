import type { PrismaService } from '../../prisma/prisma.service';
import {
  TX_PARTY,
  TX_STATUS,
  TX_TYPE,
  toMoney,
} from '../transactions/transactions-view';

const TX_TYPES = new Set<string>(Object.values(TX_TYPE));
const TX_STATUSES = new Set<string>(Object.values(TX_STATUS));

function names(
  parties: { role: string; freeTextName: string; sortOrder: number }[],
  role: string,
): string[] {
  return parties
    .filter((p) => p.role === role)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => p.freeTextName.trim())
    .filter(Boolean);
}

/** GD của lô — quyền đã lọc ở getById (lodats.md §12.3.5). */
export async function listLodatTransactionHistory(
  prisma: PrismaService,
  lodatId: string,
) {
  const rows = await prisma.transaction.findMany({
    where: { lodatId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      parties: {
        select: { role: true, freeTextName: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    type: TX_TYPES.has(row.type) ? row.type : TX_TYPE.OWN,
    status: TX_STATUSES.has(row.status) ? row.status : TX_STATUS.DA_COC,
    salePriceVnd: toMoney(row.salePriceVnd),
    sellerNames: names(row.parties, TX_PARTY.SELLER),
    buyerNames: names(row.parties, TX_PARTY.BUYER),
    createdAt: row.createdAt.toISOString(),
  }));
}
