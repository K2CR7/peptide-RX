/*
Check-in, as a sequence rather than a form.

It was one scrolling page: a weight field, two sliders, a notes box and three
photo slots, all visible at once. That shape asks for everything
simultaneously and so gets answered carelessly — the sliders stay at their
default 5 because moving two of them is two decisions you did not ask to
make, and a 5 that means "I did not think about it" is indistinguishable in
the database from a 5 that means "average day".

One question at a time fixes that by making each answer the only thing on
screen. It costs taps, which is the right trade for data whose entire value
is whether it is honest.

The frame is the one from the intro carousel, for the same reason: a stage
that changes over a base that does not. The step content dissolves; the
progress rule, the heading position and the action button do not move.

Nothing is required except that the check-in says something. Every step is
skippable, and `canSubmit` only asks that one field somewhere was filled —
an empty check-in is not a record of a day, it is a row.
*/
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraStep, MAX_PHOTOS, type Shot } from "./CameraStep";
import { ScalePicker, TagChips } from "./CheckinInputs";
import { Dissolve } from "./Dissolve";
import { ErrorText } from "./primitives";
import { useCheckinUploadUrl, useCreateCheckin } from "../lib/queries";
import { colors, font, radii, space, type } from "../theme";

const LB_PER_KG = 2.20462;
const ANGLES = ["front", "side", "back"] as const;

const STEP_TITLES = [
  "What do you weigh?",
  "How's your energy?",
  "And your mood?",
  "Want a photo?",
] as const;

const STEP_SUBS = [
  "Skip it if you haven't weighed yourself today.",
  "Your own read on it. There's no right answer.",
  "Add anything that fits — or nothing.",
  "Optional, and only ever stored against this check-in.",
] as const;

export function CheckinFlow({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const createCheckin = useCreateCheckin();
  const getUploadUrl = useCheckinUploadUrl();

  const [step, setStep] = useState(0);
  const [weightLb, setWeightLb] = useState("");
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const last = step === STEP_TITLES.length - 1;

  /*
    Answered, not merely reached.

    energy and mood start at 5 and someone who means 5 should not have to
    nudge the control to prove it — so pressing Continue on a scale step
    counts as answering it, as does moving the bar. Skipping it clears it,
    and a scale that was never answered is sent as undefined rather than as
    a 5 nobody chose.
  */
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const mark = useCallback((i: number, on: boolean) => {
    setAnswered((s) => {
      const next = new Set(s);
      if (on) next.add(i);
      else next.delete(i);
      return next;
    });
  }, []);
  const canSubmit =
    weightLb.trim() !== "" || notes.trim() !== "" || tags.length > 0 || answered.has(1) || answered.has(2);

  const toggleTag = useCallback((tag: string) => {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }, []);

  const go = useCallback((next: number) => {
    setError(null);
    setStep(next);
  }, []);

  async function submit() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      /*
        Photos are uploaded first and failures are survivable.

        R2 may not be configured, and a storage outage must not cost the user
        the weight, scores and notes they already typed. Anything that fails
        to upload is dropped, the check-in saves without it, and the message
        says what happened rather than pretending it all went fine.
      */
      const uploaded: { angle: string; url: string }[] = [];
      let failed = 0;

      for (let i = 0; i < shots.length && i < MAX_PHOTOS; i++) {
        const angle = ANGLES[i];
        try {
          const { uploadUrl, publicUrl } = await getUploadUrl.mutateAsync({ angle });
          const blob = await (await fetch(shots[i].uri)).blob();
          const put = await fetch(uploadUrl, {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": "image/jpeg" },
          });
          if (!put.ok) throw new Error(String(put.status));
          uploaded.push({ angle, url: publicUrl });
        } catch {
          failed += 1;
        }
      }

      const weight = weightLb.trim() === "" ? undefined : Number(weightLb) / LB_PER_KG;
      if (weight !== undefined && (!Number.isFinite(weight) || weight <= 0)) {
        setSaving(false);
        setError("That weight doesn't look right.");
        setStep(0);
        return;
      }

      await createCheckin.mutateAsync({
        weightKg: weight,
        energy: answered.has(1) ? energy : undefined,
        mood: answered.has(2) ? mood : undefined,
        notes: notes.trim() || undefined,
        tags,
        photos: uploaded,
      });

      if (failed > 0) {
        setSaving(false);
        setError(
          `Saved, but ${failed === 1 ? "one photo" : `${failed} photos`} couldn't be uploaded.`,
        );
        return;
      }
      onClose();
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : "Couldn't save that — try again.");
    }
  }

  const renderStep = useCallback(
    (i: number) => {
      if (i === 0) {
        return (
          <View style={{ alignItems: "center", paddingTop: space.xxl }}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <TextInput
                value={weightLb}
                onChangeText={setWeightLb}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.ink3}
                accessibilityLabel="Weight in pounds"
                style={{
                  fontFamily: font.numeral,
                  fontSize: 64,
                  color: colors.ink,
                  minWidth: 120,
                  textAlign: "center",
                  padding: 0,
                }}
              />
              <Text style={{ fontFamily: font.medium, fontSize: 20, color: colors.ink3 }}>lb</Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.edge, width: 160, marginTop: space.sm }} />
          </View>
        );
      }

      if (i === 1) {
        return (
          <View style={{ gap: space.xxl, paddingTop: space.lg }}>
            <ScalePicker
              value={energy}
              onChange={(v) => {
                setEnergy(v);
                mark(1, true);
              }}
              lowLabel="Drained"
              highLabel="Wired"
              accessibilityLabel="Energy, 1 to 10"
            />
            <View style={{ gap: space.sm }}>
              <Text style={type.label}>Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Anything worth remembering about today."
                placeholderTextColor={colors.ink3}
                style={{
                  backgroundColor: colors.panel,
                  borderWidth: 1,
                  borderColor: colors.edge,
                  borderRadius: radii.lg,
                  padding: space.md,
                  fontFamily: font.regular,
                  fontSize: 15,
                  lineHeight: 21,
                  color: colors.ink,
                  minHeight: 96,
                  textAlignVertical: "top",
                }}
              />
            </View>
          </View>
        );
      }

      if (i === 2) {
        return (
          <View style={{ gap: space.xxl, paddingTop: space.lg }}>
            <ScalePicker
              value={mood}
              onChange={(v) => {
                setMood(v);
                mark(2, true);
              }}
              lowLabel="Low"
              highLabel="Good"
              accessibilityLabel="Mood, 1 to 10"
            />
            <View style={{ gap: space.md }}>
              <Text style={type.label}>Anything fit?</Text>
              <TagChips selected={tags} onToggle={toggleTag} />
            </View>
          </View>
        );
      }

      return (
        <View style={{ paddingTop: space.lg }}>
          <CameraStep
            shots={shots}
            onCapture={(s) => setShots((p) => [...p, s].slice(0, MAX_PHOTOS))}
            onRemove={(idx) => setShots((p) => p.filter((_, n) => n !== idx))}
          />
        </View>
      );
    },
    [energy, mark, mood, notes, shots, tags, toggleTag, weightLb],
  );

  const progress = useMemo(() => (step + 1) / STEP_TITLES.length, [step]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* ------------------------------------------------------- top chrome */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.md, gap: space.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => (step === 0 ? onClose() : go(step - 1))}
            accessibilityRole="button"
            accessibilityLabel={step === 0 ? "Cancel" : "Back"}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, minHeight: 44, justifyContent: "center" })}
          >
            <Text style={{ fontFamily: font.semibold, fontSize: 14, color: colors.ink2 }}>
              {step === 0 ? "Cancel" : "Back"}
            </Text>
          </Pressable>

          <Text style={type.metaSm}>
            {step + 1} of {STEP_TITLES.length}
          </Text>
        </View>

        {/* A rule that fills. It is the only thing that moves between steps
            other than the content itself. */}
        <View style={{ height: 2, backgroundColor: colors.track, borderRadius: radii.hair, overflow: "hidden" }}>
          <View
            style={{
              height: 2,
              width: `${progress * 100}%`,
              backgroundColor: colors.signalInk,
              borderRadius: radii.hair,
            }}
          />
        </View>
      </View>

      {/* ------------------------------------------------------------ title */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.xl, minHeight: 104 }}>
        <Text style={{ fontFamily: font.display, fontSize: 32, lineHeight: 36, color: colors.ink }}>
          {STEP_TITLES[step]}
        </Text>
        <Text style={[type.body, { color: colors.ink2, marginTop: 6 }]}>{STEP_SUBS[step]}</Text>
      </View>

      {/* ------------------------------------------------------------ stage */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingVertical: space.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Dissolve step={step} render={renderStep} />
      </ScrollView>

      {/* ----------------------------------------------------------- action */}
      <View style={{ paddingHorizontal: space.xl, paddingBottom: Math.max(insets.bottom, space.lg), gap: space.sm }}>
        <ErrorText>{error}</ErrorText>

        <Pressable
          onPress={() => {
            if (last) {
              submit();
              return;
            }
            mark(step, true);
            go(step + 1);
          }}
          disabled={saving || (last && !canSubmit)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 52,
            borderRadius: 999,
            backgroundColor: last && !canSubmit ? colors.track : colors.signalInk,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : saving ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: font.bold,
              fontSize: 16,
              color: last && !canSubmit ? colors.ink3 : colors.panel,
            }}
          >
            {saving ? "Saving…" : last ? "Save check-in" : "Continue"}
          </Text>
        </Pressable>

        {/*
          Skip is a different act from Continue and is worded as one. On the
          last step it is the way out for someone who opened the flow and
          decided they had nothing to say, which has to stay cheap.
        */}
        <Pressable
          onPress={() => {
            if (last) {
              onClose();
              return;
            }
            mark(step, false);
            go(step + 1);
          }}
          accessibilityRole="button"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, minHeight: 40, justifyContent: "center" })}
        >
          <Text style={{ fontFamily: font.medium, fontSize: 13, color: colors.ink3, textAlign: "center" }}>
            {last ? "Discard" : "Skip this"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
