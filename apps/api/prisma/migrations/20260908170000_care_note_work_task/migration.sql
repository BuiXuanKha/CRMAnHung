-- Link care notes created from WorkTask; mark done when task completes.
ALTER TABLE "CustomerCareNote" ADD COLUMN IF NOT EXISTS "workTaskId" TEXT;
ALTER TABLE "CustomerCareNote" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerCareNote_workTaskId_key"
  ON "CustomerCareNote"("workTaskId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CustomerCareNote_workTaskId_fkey'
  ) THEN
    ALTER TABLE "CustomerCareNote"
      ADD CONSTRAINT "CustomerCareNote_workTaskId_fkey"
      FOREIGN KEY ("workTaskId") REFERENCES "WorkTask"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
