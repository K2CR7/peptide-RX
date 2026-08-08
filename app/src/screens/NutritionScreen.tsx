import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { GOAL_NUTRITION_GUIDANCE, WELLNESS_GOALS } from "../data/wellnessGoals";
import { useStackItems, useUpdateProfile } from "../lib/queries";
import {
  ACTIVITY_LABELS,
  calculateMacros,
  GOAL_LABELS,
  goalsFromStack,
  type ActivityLevel,
  type NutritionGoal,
} from "../lib/nutrition";
import { useAuthStore } from "../store/authStore";
import { colors, radii } from "../theme";

const LB_PER_KG = 2.20462;
const IN_PER_CM = 0.393701;

function hasCompleteProfile(user: ReturnType<typeof useAuthStore.getState>["user"]): boolean {
  return !!(
    user?.weightKg && user?.heightCm && user?.age && user?.sex && user?.activityLevel && user?.nutritionGoal
  );
}

export function NutritionScreen() {
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);

  const showForm = editing || !hasCompleteProfile(user);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink }}>Nutrition</Text>
        {!showForm && (
          <Pressable onPress={() => setEditing(true)}>
            <Text style={{ color: colors.teal, fontWeight: "700" }}>Edit</Text>
          </Pressable>
        )}
      </View>

      {showForm ? (
        <ProfileForm onDone={() => setEditing(false)} />
      ) : (
        <PlanView />
      )}
    </ScrollView>
  );
}

function PlanView() {
  const user = useAuthStore((s) => s.user);
  const { data: stackItems } = useStackItems();

  const macros = useMemo(() => {
    if (!hasCompleteProfile(user)) return null;
    return calculateMacros({
      weightKg: user!.weightKg!,
      heightCm: user!.heightCm!,
      age: user!.age!,
      sex: user!.sex as "Male" | "Female",
      activityLevel: user!.activityLevel as ActivityLevel,
      nutritionGoal: user!.nutritionGoal as NutritionGoal,
    });
  }, [user]);

  // No goal picker — every category is shown for everyone (general "eat
  // clean, cover your bases" guidance). Peptides in the stack still get
  // highlighted since that's a genuinely relevant signal, just not a filter.
  const stackGoals = useMemo(
    () => goalsFromStack((stackItems ?? []).map((i) => i.peptideName)),
    [stackItems],
  );

  if (!macros) return null;

  return (
    <View style={{ gap: 16 }}>
      <View style={{ backgroundColor: colors.white, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.ink3, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Daily target · {GOAL_LABELS[user!.nutritionGoal as NutritionGoal]}
        </Text>
        <Text style={{ fontSize: 36, fontWeight: "800", color: colors.ink, marginTop: 4 }}>{macros.calories} kcal</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <MacroChip label="Protein" grams={macros.proteinG} color={colors.teal} />
          <MacroChip label="Carbs" grams={macros.carbsG} color={colors.amber} />
          <MacroChip label="Fat" grams={macros.fatG} color={colors.red} />
        </View>
        <Text style={{ color: colors.ink3, fontSize: 11, marginTop: 12 }}>
          BMR {macros.bmr} kcal · TDEE {macros.tdee} kcal
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink3, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Eat clean — full nutrient coverage
        </Text>
        {WELLNESS_GOALS.map((goal) => {
          const guidance = GOAL_NUTRITION_GUIDANCE[goal.id];
          if (!guidance) return null;
          const fromStack = stackGoals.includes(goal.id);
          return (
            <View key={goal.id} style={{ backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ fontWeight: "800", color: colors.ink, fontSize: 15 }}>
                  {goal.icon} {goal.label}
                </Text>
                {fromStack && (
                  <View style={{ backgroundColor: colors.tealLight, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 9 }}>
                    <Text style={{ color: colors.tealDark, fontSize: 10, fontWeight: "700" }}>From your stack</Text>
                  </View>
                )}
              </View>
              {guidance.map((g) => (
                <View key={g.nutrient} style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: "700", color: colors.tealDark, fontSize: 13 }}>{g.nutrient}</Text>
                  <Text style={{ color: colors.ink3, fontSize: 11, marginBottom: 4 }}>{g.why}</Text>
                  <Text style={{ color: colors.ink2, fontSize: 13 }}>{g.foods.join(" · ")}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MacroChip({ label, grams, color }: { label: string; grams: number; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, borderRadius: radii.md, padding: 12, alignItems: "center" }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginBottom: 6 }} />
      <Text style={{ fontWeight: "800", color: colors.ink, fontSize: 16 }}>{grams}g</Text>
      <Text style={{ color: colors.ink3, fontSize: 11, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

function ProfileForm({ onDone }: { onDone: () => void }) {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const [weightLb, setWeightLb] = useState(user?.weightKg ? String(Math.round(user.weightKg * LB_PER_KG)) : "");
  const [heightIn, setHeightIn] = useState(user?.heightCm ? String(Math.round(user.heightCm * IN_PER_CM)) : "");
  const [age, setAge] = useState(user?.age ? String(user.age) : "");
  const [sex, setSex] = useState<"Male" | "Female" | "">(user?.sex ?? "");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">(user?.activityLevel ?? "");
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | "">(user?.nutritionGoal ?? "");

  const valid = weightLb && heightIn && age && sex && activityLevel && nutritionGoal;

  async function handleSave() {
    if (!valid) return;
    await updateProfile.mutateAsync({
      weightKg: Number(weightLb) / LB_PER_KG,
      heightCm: Number(heightIn) / IN_PER_CM,
      age: Number(age),
      sex: sex as "Male" | "Female",
      activityLevel: activityLevel as ActivityLevel,
      nutritionGoal: nutritionGoal as NutritionGoal,
    });
    onDone();
  }

  return (
    <View style={{ backgroundColor: colors.white, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12 }}>
      <Text style={{ color: colors.ink3, fontSize: 13 }}>
        Used only to calculate your calorie/macro targets — not medical advice.
      </Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Field label="Weight (lb)" value={weightLb} onChangeText={setWeightLb} />
        <Field label="Height (in)" value={heightIn} onChangeText={setHeightIn} />
        <Field label="Age" value={age} onChangeText={setAge} />
      </View>

      <Text style={{ fontSize: 13, color: colors.ink3 }}>Sex</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["Male", "Female"] as const).map((s) => (
          <Chip key={s} label={s} on={sex === s} onPress={() => setSex(s)} />
        ))}
      </View>

      <Text style={{ fontSize: 13, color: colors.ink3 }}>Activity level</Text>
      <View style={{ gap: 8 }}>
        {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
          <Chip key={level} label={ACTIVITY_LABELS[level]} on={activityLevel === level} onPress={() => setActivityLevel(level)} fullWidth />
        ))}
      </View>

      <Text style={{ fontSize: 13, color: colors.ink3 }}>Goal</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(Object.keys(GOAL_LABELS) as NutritionGoal[]).map((g) => (
          <Chip key={g} label={GOAL_LABELS[g]} on={nutritionGoal === g} onPress={() => setNutritionGoal(g)} />
        ))}
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!valid || updateProfile.isPending}
        style={{
          backgroundColor: valid ? colors.teal : colors.border2,
          borderRadius: radii.md,
          padding: 15,
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Save & calculate</Text>
      </Pressable>
    </View>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: colors.ink3, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={{
          backgroundColor: colors.bg,
          borderWidth: 1.5,
          borderColor: colors.border2,
          borderRadius: radii.md,
          padding: 12,
          fontSize: 15,
          color: colors.ink,
        }}
      />
    </View>
  );
}

function Chip({ label, on, onPress, fullWidth }: { label: string; on: boolean; onPress: () => void; fullWidth?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: on ? colors.teal : colors.border2,
        backgroundColor: on ? colors.tealLight : colors.white,
        width: fullWidth ? "100%" : undefined,
      }}
    >
      <Text style={{ color: on ? colors.tealDark : colors.ink2, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
