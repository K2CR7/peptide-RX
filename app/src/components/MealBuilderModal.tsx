import Slider from "@react-native-community/slider";
import { type ReactNode, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { NUTRIENT_GUIDANCE } from "../data/wellnessGoals";
import { type BuiltMeal, type MacroConstraint, useBuildMeal } from "../lib/queries";
import { colors, radii } from "../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  initialCalories: number;
  initialProteinG: number;
  initialCarbsG: number;
  initialFatG: number;
}

export function MealBuilderModal({
  visible,
  onClose,
  initialCalories,
  initialProteinG,
  initialCarbsG,
  initialFatG,
}: Props) {
  const [calories, setCalories] = useState(initialCalories);
  const [proteinG, setProteinG] = useState(initialProteinG);
  const [carbsG, setCarbsG] = useState(initialCarbsG);
  const [fatG, setFatG] = useState(initialFatG);
  const [caloriesMode, setCaloriesMode] = useState<MacroConstraint>("max");
  const [proteinMode, setProteinMode] = useState<MacroConstraint>("max");
  const [carbsMode, setCarbsMode] = useState<MacroConstraint>("max");
  const [fatMode, setFatMode] = useState<MacroConstraint>("max");
  const [priority, setPriority] = useState<string[]>([]);
  const [meal, setMeal] = useState<BuiltMeal | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const buildMeal = useBuildMeal();

  function togglePriority(nutrient: string) {
    setPriority((p) => (p.includes(nutrient) ? p.filter((n) => n !== nutrient) : [...p, nutrient]));
  }

  function flip(mode: MacroConstraint): MacroConstraint {
    return mode === "max" ? "min" : "max";
  }

  function reset() {
    setMeal(null);
    setFeedback("");
    setError(null);
  }

  async function handleBuild() {
    setError(null);
    try {
      const result = await buildMeal.mutateAsync({
        calories: Math.round(calories),
        proteinG: Math.round(proteinG),
        carbsG: Math.round(carbsG),
        fatG: Math.round(fatG),
        caloriesConstraint: caloriesMode,
        proteinConstraint: proteinMode,
        carbsConstraint: carbsMode,
        fatConstraint: fatMode,
        priorityNutrients: priority,
      });
      setMeal(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't build a meal — try again.");
    }
  }

  async function handleRefine() {
    if (!meal || !feedback.trim()) return;
    setError(null);
    try {
      const result = await buildMeal.mutateAsync({
        calories: Math.round(calories),
        proteinG: Math.round(proteinG),
        carbsG: Math.round(carbsG),
        fatG: Math.round(fatG),
        caloriesConstraint: caloriesMode,
        proteinConstraint: proteinMode,
        carbsConstraint: carbsMode,
        fatConstraint: fatMode,
        priorityNutrients: priority,
        previousMeal: { title: meal.title, ingredients: meal.ingredients },
        feedback: feedback.trim(),
      });
      setMeal(result);
      setFeedback("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update the meal — try again.");
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Build a meal</Text>

        {!meal && (
          <>
            <Text style={{ fontSize: 12, color: colors.ink3, marginTop: -6 }}>
              Tap a label below to switch it between a max (red) and a min (green) limit.
            </Text>

            <SliderField
              label={<ModeToggle name="Calories" mode={caloriesMode} onPress={() => setCaloriesMode(flip)} />}
              value={calories} onChange={setCalories} min={200} max={1500} step={25} unit="kcal"
            />
            <SliderField
              label={<ModeToggle name="Protein" mode={proteinMode} onPress={() => setProteinMode(flip)} />}
              value={proteinG} onChange={setProteinG} min={0} max={100} step={5} unit="g"
            />
            <SliderField
              label={<ModeToggle name="Carbs" mode={carbsMode} onPress={() => setCarbsMode(flip)} />}
              value={carbsG} onChange={setCarbsG} min={0} max={150} step={5} unit="g"
            />
            <SliderField
              label={<ModeToggle name="Fat" mode={fatMode} onPress={() => setFatMode(flip)} />}
              value={fatG} onChange={setFatG} min={0} max={80} step={5} unit="g"
            />

            <Text style={{ fontSize: 13, color: colors.ink3, marginTop: 4 }}>Prioritize any nutrients (optional)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {NUTRIENT_GUIDANCE.map((n) => {
                const on = priority.includes(n.nutrient);
                return (
                  <Pressable
                    key={n.nutrient}
                    onPress={() => togglePriority(n.nutrient)}
                    style={{
                      paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
                      borderWidth: 1.5, borderColor: on ? colors.teal : colors.border2,
                      backgroundColor: on ? colors.tealLight : colors.white,
                    }}
                  >
                    <Text style={{ color: on ? colors.tealDark : colors.ink2, fontWeight: "600", fontSize: 13 }}>
                      {n.nutrient}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {error && <Text style={{ color: colors.red, fontSize: 13 }}>{error}</Text>}

            <Pressable
              onPress={handleBuild}
              disabled={buildMeal.isPending}
              style={{ backgroundColor: colors.teal, borderRadius: radii.md, padding: 15, alignItems: "center", marginTop: 8, opacity: buildMeal.isPending ? 0.6 : 1 }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>{buildMeal.isPending ? "Building…" : "Build meal"}</Text>
            </Pressable>
          </>
        )}

        {meal && (
          <>
            <View style={{ backgroundColor: colors.white, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 10 }}>{meal.title}</Text>
              {meal.ingredients.map((ing, i) => (
                <Text key={i} style={{ color: colors.ink2, fontSize: 14, marginBottom: 3 }}>
                  • {ing.amount} {ing.item}
                </Text>
              ))}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <MacroPill label="kcal" value={meal.estimatedMacros.calories} />
                <MacroPill label="protein" value={meal.estimatedMacros.protein} />
                <MacroPill label="carbs" value={meal.estimatedMacros.carbs} />
                <MacroPill label="fat" value={meal.estimatedMacros.fat} />
              </View>
              {meal.notes && <Text style={{ color: colors.ink3, fontSize: 12, marginTop: 10, lineHeight: 17 }}>{meal.notes}</Text>}
            </View>

            <Text style={{ fontSize: 13, color: colors.ink3, marginTop: 4 }}>
              Something not work? Tell it what to change.
            </Text>
            <TextInput
              placeholder="e.g. I don't have eggs"
              value={feedback}
              onChangeText={setFeedback}
              style={{
                backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border2,
                borderRadius: radii.md, padding: 13, fontSize: 15, color: colors.ink,
              }}
            />

            {error && <Text style={{ color: colors.red, fontSize: 13 }}>{error}</Text>}

            <Pressable
              onPress={handleRefine}
              disabled={buildMeal.isPending || !feedback.trim()}
              style={{
                backgroundColor: feedback.trim() ? colors.teal : colors.border2,
                borderRadius: radii.md, padding: 15, alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>{buildMeal.isPending ? "Updating…" : "Update meal"}</Text>
            </Pressable>

            <Pressable onPress={reset} style={{ alignItems: "center", padding: 8 }}>
              <Text style={{ color: colors.ink3 }}>Start over with new targets</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={handleClose} style={{ alignItems: "center", padding: 12 }}>
          <Text style={{ color: colors.ink3 }}>Close</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

function SliderField({
  label, value, onChange, min, max, step, unit,
}: { label: ReactNode; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string }) {
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        {label}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink }}>{Math.round(value)} {unit}</Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.teal}
        maximumTrackTintColor={colors.border2}
        thumbTintColor={colors.teal}
      />
    </View>
  );
}

function ModeToggle({ name, mode, onPress }: { name: string; mode: MacroConstraint; onPress: () => void }) {
  const isMax = mode === "max";
  const tint = isMax ? colors.red : colors.green;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: `${tint}55`,
        backgroundColor: `${tint}1A`,
        paddingVertical: 5,
        paddingHorizontal: 12,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: tint }}>
        {isMax ? "Max" : "Min"} {name}
      </Text>
      <Text style={{ fontSize: 11, color: tint, opacity: 0.7 }}>⇅</Text>
    </Pressable>
  );
}

function MacroPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ backgroundColor: colors.bg, borderRadius: radii.sm, paddingVertical: 6, paddingHorizontal: 10 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.ink }}>{Math.round(value)} <Text style={{ color: colors.ink3, fontWeight: "600" }}>{label}</Text></Text>
    </View>
  );
}
