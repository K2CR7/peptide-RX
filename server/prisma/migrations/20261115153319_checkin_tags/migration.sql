-- AlterTable
ALTER TABLE "Checkin" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
