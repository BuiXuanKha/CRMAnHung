-- Link CONG_VIEC progress rows to WorkTask; mark done when task completes.
ALTER TABLE "TitleServiceProgress" ADD COLUMN IF NOT EXISTS "workTaskId" TEXT;
ALTER TABLE "TitleServiceProgress" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "TitleServiceProgress_workTaskId_key"
  ON "TitleServiceProgress"("workTaskId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TitleServiceProgress_workTaskId_fkey'
  ) THEN
    ALTER TABLE "TitleServiceProgress"
      ADD CONSTRAINT "TitleServiceProgress_workTaskId_fkey"
      FOREIGN KEY ("workTaskId") REFERENCES "WorkTask"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
