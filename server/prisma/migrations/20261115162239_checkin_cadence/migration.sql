-- CreateEnum
CREATE TYPE "CheckinCadence" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "checkinCadence" "CheckinCadence" NOT NULL DEFAULT 'WEEKLY';
