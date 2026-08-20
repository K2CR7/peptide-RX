import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MealBuilderModal } from "../components/MealBuilderModal";
import { GOAL_TO_NUTRIENTS, NUTRIENT_GUIDANCE } from "../data/wellnessGoals";
import { useStackItems, useUpdateProfile } from "../lib/queries";
import {
  ACTIVITY_LABELS,
  calculateMacros,
  GOAL_CONTEXT,
  GOAL_LABELS,
  goalsFromStack,
  type ActivityLevel,
  type NutritionGoal,
} from "../lib/nutrition";
import { useAuthStore } from "../store/authStore";
import { colors, font, panel, radii, type } from "../theme";

const LB_PER_KG = 2.20462;
const IN_PER_CM = 0.393701;

function hasCompleteProfile(user: ReturnType<typeof useAuthStore.getState>["user"]): boolean {
  return !!(
    user?.weightKg && user?.heightCm && user?.age && user?.sex && user?.activityLevel && user?.nutritionGoal
  );
}

export function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);

  const showForm = editing || !hasCompleteProfile(user);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 32, gap: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={type.title}>Fuel</Text>
        {!showForm && (
          <Pressable
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              minHeight: 44,
              minWidth: 44,
              alignItems: "flex-end",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontFamily: font.semibold, color: colors.signal, fontSize: 14 }}>Edit</Text>
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
  const [builderOpen, setBuilderOpen] = useState(false);

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

  // Peptides in the stack highlight relevant nutrients (via each peptide's
  // reference goals → GOAL_TO_NUTRIENTS), but the list below is always the
  // full nutrient set for everyone — not filtered or grouped by goal.
  const stackNutrients = useMemo(() => {
    const goalIds = goalsFromStack((stackItems ?? []).map((i) => i.peptideName));
    const names = new Set<string>();
    goalIds.forEach((id) => GOAL_TO_NUTRIENTS[id]?.forEach((n) => names.add(n)));
    return names;
  }, [stackItems]);

  if (!macros) return null;
  const goal = user!.nutritionGoal as NutritionGoal;

  // Each macro's real share of the day's calories (4/4/9 kcal per gram) — the
  // composition bar is measured, not decorative.
  const kcal = {
    protein: macros.proteinG * 4,
    carbs: macros.carbsG * 4,
    fat: macros.fatG * 9,
  };
  const kcalTotal = kcal.protein + kcal.carbs + kcal.fat || 1;
  const split = [
    { key: "Protein", grams: macros.proteinG, share: kcal.protein / kcalTotal, tone: colors.signal },
    { key: "Carbs", grams: macros.carbsG, share: kcal.carbs / kcalTotal, tone: colors.signalDim },
    { key: "Fat", grams: macros.fatG, share: kcal.fat / kcalTotal, tone: colors.hairline2 },
  ];
  const deficit = macros.tdee - macros.calories;

  return (
    <View style={{ gap: 16 }}>
      <View style={[panel, { padding: 20 }]}>
        <Text style={type.label}>Daily target · {GOAL_LABELS[goal]}</Text>

        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={{ fontFamily: font.numeral, fontSize: 54, color: colors.ink, letterSpacing: -1 }}>
            {macros.calories}
            <Text style={{ fontSize: 18, color: colors.ink3 }}> kcal</Text>
          </Text>
          <View style={{ alignItems: "flex-end", paddingBottom: 8 }}>
            <Text
              style={{
                fontFamily: font.numeralMedium,
                fontSize: 16,
                color: deficit > 0 ? colors.signal : deficit < 0 ? colors.amber : colors.ink2,
              }}
            >
              {deficit > 0 ? "−" : deficit < 0 ? "+" : "±"}
              {Math.abs(deficit)}
            </Text>
            <Text style={[type.meta, { fontSize: 11 }]}>vs TDEE {macros.tdee}</Text>
          </View>
        </View>

        {/* Composition bar: one hue at three values, every segment directly
            labeled, so identity never rests on color alone. */}
        <View style={{ flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", marginTop: 16, gap: 2 }}>
          {split.map((s) => (
            <View key={s.key} style={{ flex: Math.max(s.share, 0.02), backgroundColor: s.tone }} />
          ))}
        </View>

        <View style={{ flexDirection: "row", marginTop: 12, gap: 14 }}>
          {split.map((s) => (
            <View key={s.key} style={{ flex: 1, gap: 4 }}>
              <View style={{ height: 3, borderRadius: 2, backgroundColor: s.tone }} />
              <Text style={{ fontFamily: font.numeralMedium, fontSize: 19, color: colors.ink }}>
                {s.grams}
                <Text style={{ fontSize: 12, color: colors.ink3 }}>g</Text>
              </Text>
              <Text style={[type.meta, { fontSize: 11.5 }]}>
                {s.key} · {Math.round(s.share * 100)}%
              </Text>
            </View>
          ))}
        </View>

        <Text style={[type.body, { fontSize: 12.5, lineHeight: 18, marginTop: 16 }]}>{GOAL_CONTEXT[goal]}</Text>
        <Text style={[type.meta, { fontSize: 11.5, marginTop: 6 }]}>Resting burn {macros.bmr} kcal</Text>
      </View>

      <Pressable
        onPress={() => setBuilderOpen(true)}
        style={({ pressed }) => ({
          backgroundColor: colors.signal,
          borderRadius: radii.md,
          padding: 15,
          alignItems: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.onSignal, letterSpacing: 0.3 }}>
          Build a meal
        </Text>
      </Pressable>

      <MealBuilderModal
        visible={builderOpen}
        onClose={() => setBuilderOpen(false)}
        initialCalories={macros.calories}
        initialProteinG={macros.proteinG}
        initialCarbsG={macros.carbsG}
        initialFatG={macros.fatG}
      />

      <NutrientList stackNutrients={stackNutrients} />
    </View>
  );
}

/**
 * Nutrients your stack's goals point at are sorted to the top under their own
 * heading, rather than every row carrying a badge. Position does the work a
 * badge did badly: when everything is badged, the badge says nothing.
 */
function NutrientList({ stackNutrients }: { stackNutrients: Set<string> }) {
  const [open, setOpen] = useState<string | null>(null);

  const prioritized = NUTRIENT_GUIDANCE.filter((n) => stackNutrients.has(n.nutrient));
  const rest = NUTRIENT_GUIDANCE.filter((n) => !stackNutrients.has(n.nutrient));

  const section = (label: string, note: string, list: typeof NUTRIENT_GUIDANCE) => (
    <View style={{ gap: 9 }}>
      <Text style={type.label}>{label}</Text>
      <Text style={[type.meta, { fontSize: 12, marginTop: -4 }]}>{note}</Text>
      <View style={[panel, { overflow: "hidden" }]}>
        {list.map((n, i) => (
          <NutrientRow
            key={n.nutrient}
            guidance={n}
            first={i === 0}
            expanded={open === n.nutrient}
            onToggle={() => setOpen(open === n.nutrient ? null : n.nutrient)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ gap: 22 }}>
      {prioritized.length > 0 &&
        prioritized.length < NUTRIENT_GUIDANCE.length &&
        section(
          "Worth prioritizing",
          "Tied to what the peptides in your stack are typically used for.",
          prioritized,
        )}
      {section(
        prioritized.length > 0 && prioritized.length < NUTRIENT_GUIDANCE.length
          ? "Everything else"
          : "Eat clean — by nutrient",
        "General adult daily reference amounts.",
        prioritized.length > 0 && prioritized.length < NUTRIENT_GUIDANCE.length ? rest : NUTRIENT_GUIDANCE,
      )}
    </View>
  );
}

function NutrientRow({
  guidance, first, expanded, onToggle,
}: {
  guidance: (typeof NUTRIENT_GUIDANCE)[number];
  first: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: colors.hairline }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          minHeight: 56,
          paddingVertical: 12,
          paddingHorizontal: 16,
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, { fontSize: 15 }]}>{guidance.nutrient}</Text>
          <Text style={{ fontFamily: font.medium, color: colors.ink3, fontSize: 12.5, marginTop: 2 }}>
            {guidance.amount}
          </Text>
        </View>
        <Text style={{ fontFamily: font.numeralMedium, fontSize: 20, color: colors.ink3, lineHeight: 22 }}>
          {expanded ? "–" : "+"}
        </Text>
      </Pressable>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 15, gap: 8 }}>
          <Text style={[type.body, { fontSize: 13, lineHeight: 19 }]}>{guidance.benefits}</Text>
          <Text style={{ fontFamily: font.semibold, color: colors.ink2, fontSize: 13, lineHeight: 19 }}>
            {guidance.foods.join(" · ")}
          </Text>
        </View>
      )}
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
    <View style={[panel, { padding: 18, gap: 14 }]}>
      <Text style={type.body}>
        Used only to calculate your calorie/macro targets — not medical advice.
      </Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Field label="Weight (lb)" value={weightLb} onChangeText={setWeightLb} />
        <Field label="Height (in)" value={heightIn} onChangeText={setHeightIn} />
        <Field label="Age" value={age} onChangeText={setAge} />
      </View>

      <Text style={type.label}>Sex</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["Male", "Female"] as const).map((s) => (
          <Chip key={s} label={s} on={sex === s} onPress={() => setSex(s)} />
        ))}
      </View>

      <Text style={type.label}>Activity level</Text>
      <View style={{ gap: 8 }}>
        {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
          <Chip key={level} label={ACTIVITY_LABELS[level]} on={activityLevel === level} onPress={() => setActivityLevel(level)} fullWidth />
        ))}
      </View>

      <Text style={type.label}>Goal</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(Object.keys(GOAL_LABELS) as NutritionGoal[]).map((g) => (
          <Chip key={g} label={GOAL_LABELS[g]} on={nutritionGoal === g} onPress={() => setNutritionGoal(g)} />
        ))}
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!valid || updateProfile.isPending}
        style={({ pressed }) => ({
          backgroundColor: valid ? colors.signal : colors.panelRaised,
          borderRadius: radii.md,
          padding: 15,
          alignItems: "center",
          marginTop: 10,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: font.bold,
            fontSize: 15,
            letterSpacing: 0.3,
            color: valid ? colors.onSignal : colors.ink3,
          }}
        >
          Save & calculate
        </Text>
      </Pressable>
    </View>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[type.label, { fontSize: 10, marginBottom: 6 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={{
          backgroundColor: colors.panelRaised,
          borderWidth: 1,
          borderColor: colors.hairline2,
          borderRadius: radii.md,
          padding: 12,
          fontFamily: font.numeralMedium,
          fontSize: 16,
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
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: on ? colors.signal : colors.hairline2,
        backgroundColor: on ? colors.signalFaint : "transparent",
        width: fullWidth ? "100%" : undefined,
      }}
    >
      <Text style={{ fontFamily: font.semibold, color: on ? colors.signal : colors.ink2, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
