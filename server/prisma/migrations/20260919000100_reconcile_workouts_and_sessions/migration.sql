BEGIN;
ALTER TABLE "WorkoutSet" ADD COLUMN IF NOT EXISTS "repsCount" INTEGER NOT NULL DEFAULT 0;
DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Exercise' AND column_name = 'repsCount') THEN
  IF EXISTS (SELECT 1 FROM "Exercise" e WHERE e."repsCount" <> 0 AND NOT EXISTS
   (SELECT 1 FROM "WorkoutSet" s WHERE s."exerciseId" = e.id AND s."repsCount" = e."repsCount")) THEN
   RAISE EXCEPTION 'Legacy Exercise.repsCount requires a data migration before proceeding';
  END IF;
  ALTER TABLE "Exercise" DROP COLUMN "repsCount";
 END IF;
END $$;
-- Inspected legacy records use Moscow midnight (21:00 UTC).
-- Preserve already-normalized midnight; stop on unknown times.
DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM "Workout" WHERE "date"::time NOT IN (TIME '00:00:00', TIME '21:00:00')) THEN
  RAISE EXCEPTION 'Unexpected workout time; verify the legacy timezone before migrating';
 END IF;
END $$;
ALTER TABLE "Workout" ALTER COLUMN "date" TYPE DATE
 USING (CASE WHEN "date"::time = TIME '21:00:00' THEN "date" + INTERVAL '3 hours' ELSE "date" END)::date;
UPDATE "Workout" SET
 "month" = EXTRACT(MONTH FROM "date"),
 "year" = EXTRACT(YEAR FROM "date"),
 "weekNumber" = CEIL((EXTRACT(DAY FROM "date") + EXTRACT(ISODOW FROM date_trunc('month', "date")) - 1) / 7);
CREATE TABLE "Session" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
COMMIT;
