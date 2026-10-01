CREATE TABLE "PersonalNote" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "content" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "PersonalNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PersonalNote_userId_updatedAt_idx" ON "PersonalNote"("userId", "updatedAt");
