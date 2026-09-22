CREATE TABLE "WeightGoal" (
 "userId" TEXT NOT NULL,
 "startWeight" DOUBLE PRECISION NOT NULL,
 "currentWeight" DOUBLE PRECISION NOT NULL,
 "targetWeight" DOUBLE PRECISION NOT NULL,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WeightGoal_pkey" PRIMARY KEY ("userId"),
 CONSTRAINT "WeightGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "WeightGoal_valid_weights" CHECK ("startWeight" > 0 AND "startWeight" <= 1000 AND "currentWeight" > 0 AND "currentWeight" <= 1000 AND "targetWeight" > 0 AND "targetWeight" <= 1000)
);
