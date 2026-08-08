-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "NutritionGoal" AS ENUM ('CUT', 'MAINTAIN', 'BULK');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activityLevel" "ActivityLevel",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "nutritionGoal" "NutritionGoal",
ADD COLUMN     "weightKg" DOUBLE PRECISION,
ADD COLUMN     "wellnessGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];
