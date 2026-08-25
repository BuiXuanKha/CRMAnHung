import type { PrismaService } from '../../prisma/prisma.service';

const TX_TYPES = new Set(['OWN', 'RECORD']);
const TX_STATUSES = new Set(['DA_COC', 'DA_CONG_CHUNG', 'HOAN_TAT', 'HUY']);

function displayCode(id: string): string {
  const tail = id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `GD-${tail || 'XXXXXX'}`;
}

function names(
  parties: { role: string; fullName: string }[],
  role: string,
): string[] {
  return parties
    .filter((p) => p.role === role)
    .map((p) => p.fullName.trim())
    .filter(Boolean);
}

/** GD gắn mọi map của lô — quyền đã lọc ở getById (lodats.md §12.3.5). */
export async function listLodatTransactionHistory(
  prisma: PrismaService,
  lodatId: string,
) {
  const rows = await prisma.transaction.findMany({
    where: { lodatCustomerMap: { lodatId } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      parties: {
        select: { role: true, fullName: true },
        orderBy: { id: 'asc' },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    code: displayCode(row.id),
    type: TX_TYPES.has(row.type) ? row.type : 'OWN',
    status: TX_STATUSES.has(row.status) ? row.status : 'DA_COC',
    salePriceVnd: row.amountVnd ?? null,
    sellerNames: names(row.parties, 'SELLER'),
    buyerNames: names(row.parties, 'BUYER'),
    createdAt: row.createdAt.toISOString(),
  }));
}
