ALTER TABLE "Exercise" ADD COLUMN "durationMinutes" INTEGER;
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_durationMinutes_check" CHECK ("durationMinutes" IS NULL OR "durationMinutes" BETWEEN 1 AND 1440);
