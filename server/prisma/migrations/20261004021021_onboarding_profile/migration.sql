-- AlterTable
ALTER TABLE "User" ADD COLUMN     "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "medications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ADD COLUMN     "priorExperienceNote" TEXT,
ADD COLUMN     "tourCompletedAt" TIMESTAMP(3),
ADD COLUMN     "usedPeptidesBefore" BOOLEAN;
