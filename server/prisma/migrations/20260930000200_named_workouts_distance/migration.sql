ALTER TABLE "Workout" ADD COLUMN "name" TEXT;
DROP INDEX "Workout_userId_date_key";
CREATE INDEX "Workout_userId_date_idx" ON "Workout"("userId", "date");
ALTER TABLE "Exercise" ADD COLUMN "distanceKm" DOUBLE PRECISION;
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_distanceKm_check" CHECK ("distanceKm" IS NULL OR ("durationMinutes" IS NOT NULL AND "distanceKm" >= 0 AND "distanceKm" <= 1000));
