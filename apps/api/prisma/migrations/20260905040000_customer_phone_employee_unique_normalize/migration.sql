-- BUG-018: denormalize employeeId on CustomerPhone, normalize VN mobile,
-- unique per (employeeId, phone) and (customerId, phone).

-- 1) Add employeeId (nullable until backfill)
ALTER TABLE "CustomerPhone" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;

UPDATE "CustomerPhone" AS cp
SET "employeeId" = c."employeeId"
FROM "Customer" AS c
WHERE c."id" = cp."customerId"
  AND (cp."employeeId" IS NULL OR cp."employeeId" <> c."employeeId");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "CustomerPhone" WHERE "employeeId" IS NULL) THEN
    RAISE EXCEPTION 'CustomerPhone rows missing employeeId after backfill';
  END IF;
END $$;

ALTER TABLE "CustomerPhone" ALTER COLUMN "employeeId" SET NOT NULL;

-- 2) Normalize phone → digitsFromPhoneRaw equivalent (0 + 9 digits)
CREATE OR REPLACE FUNCTION migrate_normalize_vn_phone(raw text) RETURNS text AS $$
DECLARE
  v text;
BEGIN
  v := regexp_replace(trim(coalesce(raw, '')), '[\s.\-()]', '', 'g');
  IF left(v, 3) = '+84' THEN
    v := '0' || substr(v, 4);
  END IF;
  v := regexp_replace(v, '\D', '', 'g');
  IF left(v, 2) = '84' AND length(v) = 11 THEN
    v := '0' || substr(v, 3);
  END IF;
  RETURN left(v, 10);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

UPDATE "CustomerPhone"
SET phone = migrate_normalize_vn_phone(phone)
WHERE phone IS DISTINCT FROM migrate_normalize_vn_phone(phone);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "CustomerPhone"
    WHERE phone IS NULL OR phone !~ '^0[0-9]{9}$'
  ) THEN
    RAISE EXCEPTION 'CustomerPhone has non-canonical numbers after normalize; fix before migrating';
  END IF;
END $$;

-- 3) Drop exact duplicates on same customer (keep earliest)
DELETE FROM "CustomerPhone" AS cp
USING "CustomerPhone" AS keep
WHERE cp."customerId" = keep."customerId"
  AND cp.phone = keep.phone
  AND cp.id <> keep.id
  AND (
    cp."createdAt" > keep."createdAt"
    OR (cp."createdAt" = keep."createdAt" AND cp.id > keep.id)
  );

-- 4) Fail if same NV still has the same phone on two customers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "CustomerPhone"
    GROUP BY "employeeId", phone
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate (employeeId, phone) across customers; resolve before unique index';
  END IF;
END $$;

DROP FUNCTION migrate_normalize_vn_phone(text);

-- 5) Indexes + FK
CREATE INDEX IF NOT EXISTS "CustomerPhone_employeeId_idx" ON "CustomerPhone"("employeeId");

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerPhone_customerId_phone_key"
  ON "CustomerPhone"("customerId", phone);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerPhone_employeeId_phone_key"
  ON "CustomerPhone"("employeeId", phone);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CustomerPhone_employeeId_fkey'
  ) THEN
    ALTER TABLE "CustomerPhone"
      ADD CONSTRAINT "CustomerPhone_employeeId_fkey"
      FOREIGN KEY ("employeeId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
