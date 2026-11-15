/*
First run: a short survey, then a beat, then the tour.

One question per screen. The pacing is the point — this is the first thing
someone sees, and a single wall of fields would read as paperwork for a tool
that is asking fairly personal questions.

Nothing here is required. Every step can be skipped, because an onboarding
survey that holds the app hostage is worse than a thin profile.
*/
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GOAL_OPTIONS, deriveNutritionGoal } from "../data/goals";
import { MEDICATION_OPTIONS } from "../data/medications";
import { INTERACTION_DISCLAIMER } from "../data/peptideInteractions";
import { type BirthDateParts, parseBirthDate } from "../lib/birthDate";
import { useUpdateProfile } from "../lib/queries";
import { Button, ErrorText } from "../components/primitives";
import { Animated, DUR, EASE, Rise, dur, useReduceMotion } from "../components/motion";
import { CheckMark } from "../components/icons";
import { HIT, colors, font, radii, space, type } from "../theme";

const STEPS = ["birth", "goals", "history", "medications"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const updateProfile = useUpdateProfile();

  const [stepIndex, setStepIndex] = useState(0);
  const [dob, setDob] = useState<BirthDateParts>({ month: "", day: "", year: "" });
  const [goals, setGoals] = useState<string[]>([]);
  const [usedBefore, setUsedBefore] = useState<boolean | null>(null);
  const [priorNote, setPriorNote] = useState("");
  const [medications, setMedications] = useState<string[]>([]);
  const [customMed, setCustomMed] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parsedDob = parseBirthDate(dob);
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
        ...(parsedDob.date ? { dateOfBirth: parsedDob.date.toISOString() } : {}),
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
          {step === "birth" && (
            <StepBody
              label="About you"
              question="When were you born?"
              hint="Used to work out your calorie and macro targets. Nothing else."
            >
              <View style={{ gap: space.md }}>
                <View style={{ flexDirection: "row", gap: space.md }}>
                  <DobField label="Month" value={dob.month} onChange={(v) => setDob({ ...dob, month: v })} max={2} flex={1} autoFocus />
                  <DobField label="Day" value={dob.day} onChange={(v) => setDob({ ...dob, day: v })} max={2} flex={1} />
                  <DobField label="Year" value={dob.year} onChange={(v) => setDob({ ...dob, year: v })} max={4} flex={1.4} />
                </View>
                {parsedDob.error && <ErrorText>{parsedDob.error}</ErrorText>}
                {parsedDob.date && parsedDob.age !== null && (
                  <Text style={type.metaSm}>That makes you {parsedDob.age}.</Text>
                )}
              </View>
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
                      borderColor: colors.edge,
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
            {/*
              Rendered conditionally rather than hidden with opacity. At
              opacity 0 it was still a live 44px target with an empty
              accessible name — a sighted user could tap nothing, and a
              screen reader announced an unlabelled button. The empty View
              keeps "Skip" pinned right.
            */}
            {stepIndex > 0 ? (
              <Button
                label="Back"
                variant="quiet"
                size="sm"
                onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
              />
            ) : (
              <View />
            )}
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
        borderColor: selected ? colors.signalInk : colors.hairline2,
        backgroundColor: selected ? colors.signalFaint : colors.panel,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={[type.headingSm, { color: selected ? colors.signalInk : colors.ink }]}>
          {label}
        </Text>
        {sub && <Text style={[type.metaSm, { marginTop: 2 }]}>{sub}</Text>}
      </View>
      {selected && <CheckMark size={15} color={colors.signalInk} />}
    </Pressable>
  );
}

/** A hairline that fills as you move through the survey. */
function ProgressRail({ step, total, topInset }: { step: number; total: number; topInset: number }) {
  const pct = ((step + 1) / total) * 100;
  const reduced = useReduceMotion();

  /*
    This animates to the current fill, not from zero to it. The rail used to
    run a one-shot 0-to-1 entrance on mount, which meant it filled once and
    then every subsequent step JUMPED: the interpolation output changed under
    a value already parked at 1. A rail that fills is only worth drawing if
    the filling is the thing you see.

    Width can't ride the native driver, so this interpolates on the JS thread.
    It's a 2px rule, not something anyone will notice dropping a frame.
  */
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Deliberately NOT reset to zero first: the start value is wherever the
    // previous step left it, which is the whole point.
    const anim = Animated.timing(fill, {
      toValue: pct,
      duration: dur(DUR.move, reduced),
      easing: EASE,
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      // The rail must show the step the user is actually on.
      fill.setValue(pct);
    };
  }, [fill, pct, reduced]);

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingTop: topInset + space.xxl,
        paddingHorizontal: space.xxl,
        paddingBottom: space.sm,
      }}
    >
      {/*
        The fill was `signal` on a `hairline2` track — 1.47:1, which is not
        visible on a phone in daylight at any height, let alone two pixels.
        The "Step 1 of 4" line below was carrying the whole job. signalInk on
        `track` is 3.65:1, so the bar now actually reads as a bar.
      */}
      <View style={{ height: 2, borderRadius: radii.hair, backgroundColor: colors.track, overflow: "hidden" }}>
        <Animated.View
          style={{
            height: 2,
            borderRadius: radii.hair,
            backgroundColor: colors.signalInk,
            width: fill.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
              extrapolate: "clamp",
            }),
          }}
        />
      </View>
      <Text style={[type.metaSm, { marginTop: space.sm }]}>
        Step {step + 1} of {total}
      </Text>
    </View>
  );
}

/**
 * One part of a birth date. Three short numeric fields rather than a free-text
 * date or a picker dependency: nothing to mis-parse, and the keyboard is
 * already numeric on a phone.
 */
function DobField({
  label, value, onChange, max, flex, autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  flex: number;
  autoFocus?: boolean;
}) {
  return (
    <View style={{ flex, gap: space.sm }}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        value={value}
        // Digits only, capped at the field's width, so the value can never
        // become something parseBirthDate has to defend against.
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, "").slice(0, max))}
        placeholder={"0".repeat(max)}
        placeholderTextColor={colors.ink3}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        maxLength={max}
        style={{
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: value ? colors.hairline2 : colors.hairline,
          borderRadius: radii.md,
          paddingHorizontal: space.lg,
          minHeight: 56,
          fontFamily: font.numeralMedium,
          fontSize: 20,
          color: colors.ink,
          textAlign: "center",
        }}
      />
    </View>
  );
}
