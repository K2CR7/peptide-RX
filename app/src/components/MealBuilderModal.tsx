import Slider from "@react-native-community/slider";
import { type ReactNode, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { NUTRIENT_GUIDANCE } from "../data/wellnessGoals";
import { type BuiltMeal, type MacroConstraint, useBuildMeal } from "../lib/queries";
import { PhoneModalFrame } from "./PhoneModalFrame";
import { Button, Chip, ErrorText } from "./primitives";
import { SwapMark } from "./icons";
import { HIT, colors, font, panel, radii, space, type } from "../theme";

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
      <PhoneModalFrame backgroundColor={colors.bg}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32, gap: 16 }}>
        <Text style={type.title}>Build a meal</Text>

        {!meal && (
          <>
            <Text style={[type.bodySm, { marginTop: -6 }]}>
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
              {NUTRIENT_GUIDANCE.map((n) => (
                <Chip
                  key={n.nutrient}
                  label={n.nutrient}
                  selected={priority.includes(n.nutrient)}
                  onPress={() => togglePriority(n.nutrient)}
                />
              ))}
            </View>

            <ErrorText>{error}</ErrorText>

            <Pressable
              onPress={handleBuild}
              disabled={buildMeal.isPending}
              style={({ pressed }) => ({
                backgroundColor: colors.signal, borderRadius: radii.md, padding: 16,
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
            <View style={[panel, { padding: 20 }]}>
              <Text style={[type.heading, { marginBottom: 12 }]}>{meal.title}</Text>
              {meal.ingredients.map((ing, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontFamily: font.numeralMedium, fontSize: 15, color: colors.signal, minWidth: 62 }}>
                    {ing.amount}
                  </Text>
                  <Text style={[type.body, { flex: 1, fontSize: 15 }]}>{ing.item}</Text>
                </View>
              ))}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <MacroPill label="kcal" value={meal.estimatedMacros.calories} />
                <MacroPill label="protein" value={meal.estimatedMacros.protein} />
                <MacroPill label="carbs" value={meal.estimatedMacros.carbs} />
                <MacroPill label="fat" value={meal.estimatedMacros.fat} />
              </View>
              {meal.notes && (
                <Text style={[type.bodySm, { marginTop: 12 }]}>{meal.notes}</Text>
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
                borderRadius: radii.md, padding: 12, fontFamily: font.regular, fontSize: 15, color: colors.ink,
              }}
            />

            <ErrorText>{error}</ErrorText>

            <Pressable
              onPress={handleRefine}
              disabled={buildMeal.isPending || !feedback.trim()}
              style={({ pressed }) => ({
                backgroundColor: feedback.trim() ? colors.signal : colors.panelRaised,
                borderRadius: radii.md, padding: 16, alignItems: "center",
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
              <Text style={[type.meta, { fontSize: 15 }]}>Start over with new targets</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={handleClose} style={{ alignItems: "center", padding: 12 }}>
          <Text style={[type.meta, { fontSize: 15 }]}>Close</Text>
        </Pressable>
      </ScrollView>
      </PhoneModalFrame>
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
          <Text style={{ fontSize: 13, color: colors.ink3 }}> {unit}</Text>
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
      accessibilityRole="button"
      accessibilityLabel={`${name} is a ${isMax ? "maximum" : "minimum"} — tap to switch`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        minHeight: HIT,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: tint,
        backgroundColor: isMax ? colors.amberFaint : colors.signalFaint,
        paddingHorizontal: space.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={[type.buttonSm, { color: tint }]}>
        {isMax ? "Max" : "Min"} {name}
      </Text>
      {/* Was the character "⇅" set in a Text node — a Unicode arrow doing an
          icon's job, at a weight the drawn set never matches. */}
      <SwapMark size={13} color={tint} />
    </Pressable>
  );
}

/** Flattened out of its filled box — a chip inside the result panel was a card in a card. */
function MacroPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.xs }}>
      <Text style={[type.statSm, { fontSize: 15 }]}>{Math.round(value)}</Text>
      <Text style={type.metaSm}>{label}</Text>
    </View>
  );
}
