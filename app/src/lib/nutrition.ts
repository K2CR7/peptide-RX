export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
export type NutritionGoal = "CUT" | "MAINTAIN" | "BULK";

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sedentary (little/no exercise)",
  LIGHT: "Light (1-3 days/week)",
  MODERATE: "Moderate (3-5 days/week)",
  ACTIVE: "Active (6-7 days/week)",
  VERY_ACTIVE: "Very active (2x/day or physical job)",
};

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

export const GOAL_LABELS: Record<NutritionGoal, string> = {
  CUT: "Cut (calorie deficit)",
  MAINTAIN: "Maintain",
  BULK: "Bulk (calorie surplus)",
};

const GOAL_CALORIE_ADJUSTMENT: Record<NutritionGoal, number> = {
  CUT: -500,
  MAINTAIN: 0,
  BULK: 300,
};

export interface MacroTargets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface ProfileInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "Male" | "Female";
  activityLevel: ActivityLevel;
  nutritionGoal: NutritionGoal;
}

/**
 * Mifflin-St Jeor for BMR (the most broadly validated equation for this),
 * scaled by activity for TDEE, then adjusted by goal. Protein is set at a
 * flat 2g/kg bodyweight — high enough to preserve muscle in a cut and
 * support growth in a bulk, so it doesn't need to vary by goal. Fat is fixed
 * at 25% of calories; carbs fill the remainder.
 */
export function calculateMacros(profile: ProfileInput): MacroTargets {
  const { weightKg, heightCm, age, sex, activityLevel, nutritionGoal } = profile;
  const bmr = sex === "Male"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel];
  const calories = Math.max(1200, Math.round(tdee + GOAL_CALORIE_ADJUSTMENT[nutritionGoal]));

  const proteinG = Math.round(weightKg * 2);
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, proteinG, fatG, carbsG };
}
