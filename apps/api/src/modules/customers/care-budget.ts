/** Known care-form chips — keep in sync with CUSTOMER_BUDGET_BRACKETS in shared. */
const CARE_BUDGET_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [500_000_000, 1_000_000_000],
  [1_000_000_000, 1_500_000_000],
  [1_500_000_000, 2_000_000_000],
  [2_000_000_000, 2_500_000_000],
];

export type CareBudget = {
  ok: true;
  min: number | null;
  max: number | null;
} | {
  ok: false;
};

function toNullableInt(value: number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeCareBudget(
  minRaw: number | null | undefined,
  maxRaw: number | null | undefined,
): CareBudget {
  const min = toNullableInt(minRaw);
  const max = toNullableInt(maxRaw);
  if (min === null && max === null) return { ok: true, min: null, max: null };
  if (min === null || max === null) return { ok: false };
  const known = CARE_BUDGET_PAIRS.some(([a, b]) => a === min && b === max);
  if (known) return { ok: true, min, max };
  if (min > 0 && max >= min) return { ok: true, min, max };
  return { ok: false };
}
