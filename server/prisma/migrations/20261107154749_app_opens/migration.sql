-- CreateTable
CREATE TABLE "AppOpen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "AppOpen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppOpen_userId_idx" ON "AppOpen"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppOpen_userId_day_key" ON "AppOpen"("userId", "day");

-- AddForeignKey
ALTER TABLE "AppOpen" ADD CONSTRAINT "AppOpen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
