/*
First run: a short survey, then a beat, then the tour.

One question per screen. The pacing is the point — this is the first thing
someone sees, and a single wall of fields would read as paperwork for a tool
that is asking fairly personal questions.

Nothing here is required. Every step can be skipped, because an onboarding
survey that holds the app hostage is worse than a thin profile.
*/
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GOAL_OPTIONS, deriveNutritionGoal } from "../data/goals";
import { MEDICATION_OPTIONS } from "../data/medications";
import { INTERACTION_DISCLAIMER } from "../data/peptideInteractions";
import { useUpdateProfile } from "../lib/queries";
import { Button, ErrorText } from "../components/primitives";
import { Animated, Rise, useEntrance } from "../components/motion";
import { CheckMark } from "../components/icons";
import { HIT, colors, font, radii, space, type } from "../theme";

const STEPS = ["age", "goals", "history", "medications"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const updateProfile = useUpdateProfile();

  const [stepIndex, setStepIndex] = useState(0);
  const [age, setAge] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [usedBefore, setUsedBefore] = useState<boolean | null>(null);
  const [priorNote, setPriorNote] = useState("");
  const [medications, setMedications] = useState<string[]>([]);
  const [customMed, setCustomMed] = useState("");
  const [error, setError] = useState<string | null>(null);

  const step: Step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function finish() {
    setError(null);
    const meds = customMed.trim() ? [...medications, customMed.trim()] : medications;
    try {
      await updateProfile.mutateAsync({
        ...(age.trim() && Number(age) ? { age: Number(age) } : {}),
        goals,
        medications: meds,
        ...(usedBefore !== null ? { usedPeptidesBefore: usedBefore } : {}),
        ...(priorNote.trim() ? { priorExperienceNote: priorNote.trim() } : {}),
        ...(goals.length > 0 ? { nutritionGoal: deriveNutritionGoal(goals) } : {}),
        onboarded: true,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that — try again.");
    }
  }

  function next() {
    if (isLast) {
      void finish();
      return;
    }
    // History has a conditional follow-up; answering "no" skips straight on.
    setStepIndex((i) => i + 1);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* A real header rather than an absolutely-positioned overlay: floating
          it meant list content scrolled underneath and showed through the
          step label. */}
      <ProgressRail step={stepIndex} total={STEPS.length} topInset={insets.top} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space.xxl,
          paddingTop: space.xl,
          paddingBottom: insets.bottom + space.xxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Keyed so every step remounts and replays its entrance. */}
        <View key={step} style={{ flex: 1 }}>
          {step === "age" && (
            <StepBody
              label="About you"
              question="How old are you?"
              hint="Used to work out your calorie and macro targets. Nothing else."
            >
              <TextInput
                value={age}
                onChangeText={setAge}
                placeholder="Age"
                placeholderTextColor={colors.ink3}
                keyboardType="number-pad"
                autoFocus
                style={{
                  backgroundColor: colors.panel,
                  borderWidth: 1,
                  borderColor: age ? colors.hairline2 : colors.hairline,
                  borderRadius: radii.md,
                  paddingHorizontal: space.lg,
                  minHeight: 56,
                  fontFamily: font.numeralMedium,
                  fontSize: 20,
                  color: colors.ink,
                }}
              />
            </StepBody>
          )}

          {step === "goals" && (
            <StepBody
              label="Goals"
              question="What are you working toward?"
              hint="Pick as many as apply. This shapes which peptides are relevant and what the nutrition screen prioritises."
            >
              <View style={{ gap: space.sm }}>
                {GOAL_OPTIONS.map((g, i) => (
                  <Rise key={g.id} delay={60 + i * 28}>
                    <SelectRow
                      label={g.id}
                      sub={g.blurb}
                      selected={goals.includes(g.id)}
                      onPress={() => toggle(goals, g.id, setGoals)}
                    />
                  </Rise>
                ))}
              </View>
            </StepBody>
          )}

          {step === "history" && (
            <StepBody
              label="Experience"
              question="Have you used peptides or GLP-1s before?"
              hint="So the app can pitch things at the right level."
            >
              <View style={{ gap: space.sm }}>
                <SelectRow
                  label="Yes, I've run something before"
                  selected={usedBefore === true}
                  onPress={() => setUsedBefore(true)}
                />
                <SelectRow
                  label="No, this is my first time"
                  selected={usedBefore === false}
                  onPress={() => setUsedBefore(false)}
                />
              </View>

              {usedBefore === true && (
                <Rise delay={80} style={{ marginTop: space.xl, gap: space.sm }}>
                  <Text style={type.label}>How did it go?</Text>
                  <TextInput
                    value={priorNote}
                    onChangeText={setPriorNote}
                    placeholder="What worked, what didn't, anything you'd avoid"
                    placeholderTextColor={colors.ink3}
                    multiline
                    style={{
                      backgroundColor: colors.panel,
                      borderWidth: 1,
                      borderColor: colors.hairline2,
                      borderRadius: radii.md,
                      padding: space.lg,
                      minHeight: 100,
                      textAlignVertical: "top",
                      fontFamily: font.regular,
                      fontSize: 15,
                      lineHeight: 22,
                      color: colors.ink,
                    }}
                  />
                </Rise>
              )}
            </StepBody>
          )}

          {step === "medications" && (
            <StepBody
              label="Medications"
              question="Are you taking any of these?"
              hint="Some are worth knowing about alongside certain peptides. You can change this any time."
            >
              <View style={{ gap: space.sm }}>
                {MEDICATION_OPTIONS.map((m, i) => (
                  <Rise key={m.id} delay={40 + i * 18}>
                    <SelectRow
                      label={m.label}
                      sub={m.examples}
                      selected={medications.includes(m.id)}
                      onPress={() => toggle(medications, m.id, setMedications)}
                    />
                  </Rise>
                ))}
                <Rise delay={400}>
                  <TextInput
                    value={customMed}
                    onChangeText={setCustomMed}
                    placeholder="Anything else you take"
                    placeholderTextColor={colors.ink3}
                    style={{
                      backgroundColor: colors.panel,
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      borderRadius: radii.md,
                      paddingHorizontal: space.lg,
                      minHeight: HIT,
                      fontFamily: font.regular,
                      fontSize: 15,
                      color: colors.ink,
                    }}
                  />
                </Rise>
                <Rise delay={440}>
                  <Text style={[type.metaSm, { lineHeight: 17, marginTop: space.sm }]}>
                    {INTERACTION_DISCLAIMER}
                  </Text>
                </Rise>
              </View>
            </StepBody>
          )}
        </View>

        <ErrorText style={{ marginTop: space.lg }}>{error}</ErrorText>

        <Rise delay={200} style={{ marginTop: space.xl, gap: space.xs }}>
          <Button
            label={isLast ? "Finish" : "Continue"}
            loadingLabel="Saving…"
            onPress={next}
            loading={updateProfile.isPending}
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Button
              label={stepIndex === 0 ? "" : "Back"}
              variant="quiet"
              size="sm"
              onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
              style={{ opacity: stepIndex === 0 ? 0 : 1 }}
            />
            {/* Nothing here is required — skipping leaves a thinner profile,
                not a broken one. */}
            <Button label="Skip" variant="quiet" size="sm" onPress={finish} />
          </View>
        </Rise>
      </ScrollView>
    </View>
  );
}

function StepBody({
  label, question, hint, children,
}: { label: string; question: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.lg }}>
      <Rise delay={0}>
        <Text style={type.label}>{label}</Text>
      </Rise>
      <Rise delay={50}>
        <Text style={[type.title, { fontSize: 24, lineHeight: 30 }]}>{question}</Text>
      </Rise>
      {hint && (
        <Rise delay={90}>
          <Text style={type.bodySm}>{hint}</Text>
        </Rise>
      )}
      <Rise delay={130} style={{ marginTop: space.sm }}>
        <View>{children}</View>
      </Rise>
    </View>
  );
}

function SelectRow({
  label, sub, selected, onPress,
}: { label: string; sub?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        minHeight: 56,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: selected ? colors.signal : colors.hairline2,
        backgroundColor: selected ? colors.signalFaint : colors.panel,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={[type.headingSm, { color: selected ? colors.signal : colors.ink }]}>
          {label}
        </Text>
        {sub && <Text style={[type.metaSm, { marginTop: 2 }]}>{sub}</Text>}
      </View>
      {selected && <CheckMark size={15} color={colors.signal} />}
    </Pressable>
  );
}

/** A hairline that fills as you move through the survey. */
function ProgressRail({ step, total, topInset }: { step: number; total: number; topInset: number }) {
  // Width can't ride the native driver, so this one interpolates on the JS
  // thread — it's a 2px rule, not something anyone will see drop a frame.
  const progress = useEntrance(400);
  const pct = ((step + 1) / total) * 100;

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingTop: topInset + space.xxl,
        paddingHorizontal: space.xxl,
        paddingBottom: space.sm,
      }}
    >
      <View style={{ height: 2, borderRadius: 1, backgroundColor: colors.hairline2, overflow: "hidden" }}>
        <Animated.View
          style={{
            height: 2,
            borderRadius: 1,
            backgroundColor: colors.signal,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${pct}%`] }),
          }}
        />
      </View>
      <Text style={[type.metaSm, { marginTop: space.sm }]}>
        Step {step + 1} of {total}
      </Text>
    </View>
  );
}
