-- BUG-020: ensure at most one active owner map per Lodat (idempotent).
-- Index may already exist from 20260824120000; recreate safely after dedupe.

-- Keep newest active map per lodat; deactivate older duplicates.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "lodatId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC, id DESC
    ) AS rn
  FROM "LodatCustomerMap"
  WHERE "isActive" = true
)
UPDATE "LodatCustomerMap" AS m
SET
  "isActive" = false,
  "endedAt" = COALESCE(m."endedAt", NOW())
FROM ranked AS r
WHERE m.id = r.id
  AND r.rn > 1;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "LodatCustomerMap"
    WHERE "isActive" = true
    GROUP BY "lodatId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate active LodatCustomerMap remain; resolve before unique index';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "LodatCustomerMap_lodatId_active_uidx"
  ON "LodatCustomerMap"("lodatId")
  WHERE "isActive" = true;
