import Slider from "@react-native-community/slider";
import { type ReactNode, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { NUTRIENT_GUIDANCE } from "../data/wellnessGoals";
import { type BuiltMeal, type MacroConstraint, useBuildMeal } from "../lib/queries";
import { colors, font, panel, radii, type } from "../theme";

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
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32, gap: 16 }}>
        <Text style={type.title}>Build a meal</Text>

        {!meal && (
          <>
            <Text style={[type.body, { fontSize: 13, marginTop: -6 }]}>
              Tap a label to switch it between a max and a min limit.
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

            <Text style={type.label}>Prioritize any nutrients (optional)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {NUTRIENT_GUIDANCE.map((n) => {
                const on = priority.includes(n.nutrient);
                return (
                  <Pressable
                    key={n.nutrient}
                    onPress={() => togglePriority(n.nutrient)}
                    style={{
                      paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
                      borderWidth: 1, borderColor: on ? colors.signal : colors.hairline2,
                      backgroundColor: on ? colors.signalFaint : "transparent",
                    }}
                  >
                    <Text style={{ fontFamily: font.semibold, color: on ? colors.signal : colors.ink2, fontSize: 13 }}>
                      {n.nutrient}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {error && <Text style={{ fontFamily: font.medium, color: colors.red, fontSize: 13 }}>{error}</Text>}

            <Pressable
              onPress={handleBuild}
              disabled={buildMeal.isPending}
              style={({ pressed }) => ({
                backgroundColor: colors.signal, borderRadius: radii.md, padding: 15,
                alignItems: "center", marginTop: 4, opacity: buildMeal.isPending || pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.onSignal, letterSpacing: 0.3 }}>
                {buildMeal.isPending ? "Building…" : "Build meal"}
              </Text>
            </Pressable>
          </>
        )}

        {meal && (
          <>
            <View style={[panel, { padding: 18 }]}>
              <Text style={[type.heading, { fontSize: 18, marginBottom: 12 }]}>{meal.title}</Text>
              {meal.ingredients.map((ing, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 5 }}>
                  <Text style={{ fontFamily: font.numeralMedium, fontSize: 14, color: colors.signal, minWidth: 62 }}>
                    {ing.amount}
                  </Text>
                  <Text style={[type.body, { flex: 1, fontSize: 14 }]}>{ing.item}</Text>
                </View>
              ))}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                <MacroPill label="kcal" value={meal.estimatedMacros.calories} />
                <MacroPill label="protein" value={meal.estimatedMacros.protein} />
                <MacroPill label="carbs" value={meal.estimatedMacros.carbs} />
                <MacroPill label="fat" value={meal.estimatedMacros.fat} />
              </View>
              {meal.notes && (
                <Text style={[type.body, { fontSize: 12.5, lineHeight: 18, marginTop: 12 }]}>{meal.notes}</Text>
              )}
            </View>

            <Text style={type.label}>Something not work? Tell it what to change.</Text>
            <TextInput
              placeholder="e.g. I don't have eggs"
              placeholderTextColor={colors.ink3}
              value={feedback}
              onChangeText={setFeedback}
              style={{
                backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.hairline2,
                borderRadius: radii.md, padding: 13, fontFamily: font.regular, fontSize: 15, color: colors.ink,
              }}
            />

            {error && <Text style={{ fontFamily: font.medium, color: colors.red, fontSize: 13 }}>{error}</Text>}

            <Pressable
              onPress={handleRefine}
              disabled={buildMeal.isPending || !feedback.trim()}
              style={({ pressed }) => ({
                backgroundColor: feedback.trim() ? colors.signal : colors.panelRaised,
                borderRadius: radii.md, padding: 15, alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: font.bold, fontSize: 15, letterSpacing: 0.3,
                  color: feedback.trim() ? colors.onSignal : colors.ink3,
                }}
              >
                {buildMeal.isPending ? "Updating…" : "Update meal"}
              </Text>
            </Pressable>

            <Pressable onPress={reset} style={{ alignItems: "center", padding: 8 }}>
              <Text style={[type.meta, { fontSize: 14 }]}>Start over with new targets</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={handleClose} style={{ alignItems: "center", padding: 12 }}>
          <Text style={[type.meta, { fontSize: 14 }]}>Close</Text>
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
        <Text style={{ fontFamily: font.numeralMedium, fontSize: 17, color: colors.ink }}>
          {Math.round(value)}
          <Text style={{ fontSize: 12, color: colors.ink3 }}> {unit}</Text>
        </Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.signal}
        maximumTrackTintColor={colors.panelRaised}
        thumbTintColor={colors.ink}
      />
    </View>
  );
}

function ModeToggle({ name, mode, onPress }: { name: string; mode: MacroConstraint; onPress: () => void }) {
  const isMax = mode === "max";
  const tint = isMax ? colors.amber : colors.signal;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: tint,
        backgroundColor: isMax ? colors.amberFaint : colors.signalFaint,
        paddingVertical: 5,
        paddingHorizontal: 12,
      }}
    >
      <Text style={{ fontFamily: font.bold, fontSize: 12.5, color: tint, letterSpacing: 0.3 }}>
        {isMax ? "Max" : "Min"} {name}
      </Text>
      <Text style={{ fontFamily: font.regular, fontSize: 11, color: tint }}>⇅</Text>
    </Pressable>
  );
}

function MacroPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ backgroundColor: colors.panelRaised, borderRadius: radii.sm, paddingVertical: 6, paddingHorizontal: 11 }}>
      <Text style={{ fontFamily: font.numeralMedium, fontSize: 14, color: colors.ink }}>
        {Math.round(value)} <Text style={{ fontFamily: font.medium, fontSize: 11.5, color: colors.ink3 }}>{label}</Text>
      </Text>
    </View>
  );
}
