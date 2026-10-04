import { useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlusMark } from "../components/icons";
import { WeightChart } from "../components/WeightChart";
import { PhoneModalFrame } from "../components/PhoneModalFrame";
import { type Checkin, useCheckinUploadUrl, useCheckins, useCreateCheckin, useDeleteCheckin } from "../lib/queries";
import { AsyncBlock, ErrorText, SectionLabel } from "../components/primitives";
import { HIT, colors, font, panel, radii, space, type } from "../theme";

const LB_PER_KG = 2.20462;
const ANGLES = ["front", "side", "back"] as const;
type Angle = (typeof ANGLES)[number];

export function CheckinScreen() {
  const insets = useSafeAreaInsets();
  const { data: checkins, isLoading, isError, refetch } = useCheckins();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 32, gap: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={type.title}>Progress</Text>
          <Pressable
            onPress={() => setAddOpen(true)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 44,
              backgroundColor: colors.signal,
              borderRadius: radii.md,
              paddingHorizontal: 16,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <PlusMark size={13} color={colors.onSignal} />
            <Text style={{ fontFamily: font.bold, fontSize: 13, color: colors.onSignal, letterSpacing: 0.3 }}>
              Check in
            </Text>
          </Pressable>
        </View>

        {/* Held back until the data lands — the chart's own empty copy
            ("log a couple check-ins") was otherwise shown during loading to
            someone who already had months of them. */}
        {!isLoading && !isError && <WeightChart checkins={checkins ?? []} />}

        <View style={{ gap: space.md }}>
          <SectionLabel>History</SectionLabel>
          <AsyncBlock
            loading={isLoading}
            error={isError}
            isEmpty={checkins?.length === 0}
            emptyText="No check-ins yet. Log your first one above."
            onRetry={refetch}
          >
            <View style={{ gap: space.md }}>
              {checkins?.map((c) => <CheckinCard key={c.id} checkin={c} />)}
            </View>
          </AsyncBlock>
        </View>
      </ScrollView>

      <AddCheckinModal visible={addOpen} onClose={() => setAddOpen(false)} />
    </View>
  );
}

function CheckinCard({ checkin }: { checkin: Checkin }) {
  const deleteCheckin = useDeleteCheckin();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weightLb = checkin.weightKg != null ? Math.round(checkin.weightKg * LB_PER_KG) : null;

  // Was a single unconfirmed tap that discarded a check-in and its photos
  // with no undo, no pending state and no error path. Two taps now, and a
  // failure says so instead of looking like nothing happened.
  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    deleteCheckin.mutate(checkin.id, {
      onError: () => {
        setError("Couldn't delete that check-in — try again.");
        setConfirming(false);
      },
    });
  }

  return (
    <View style={[panel, { borderRadius: radii.lg, padding: 16 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View>
          <Text style={type.headingSm}>
            {new Date(checkin.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </Text>
          <View style={{ flexDirection: "row", gap: space.lg, marginTop: space.sm, flexWrap: "wrap" }}>
            {weightLb != null && <Stat label="weight" value={`${weightLb} lb`} />}
            {checkin.energy != null && <Stat label="energy" value={`${checkin.energy}/10`} />}
            {checkin.mood != null && <Stat label="mood" value={`${checkin.mood}/10`} />}
          </View>
        </View>
        <Pressable
          onPress={handleDelete}
          disabled={deleteCheckin.isPending}
          accessibilityRole="button"
          accessibilityLabel={confirming ? "Confirm delete this check-in" : "Delete this check-in"}
          style={({ pressed }) => ({
            minWidth: 56,
            minHeight: HIT,
            marginTop: -8,
            marginRight: -6,
            alignItems: "flex-end",
            justifyContent: "center",
            paddingHorizontal: space.sm,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={[
              type.meta,
              { color: colors.red, fontFamily: confirming ? font.bold : font.medium },
            ]}
          >
            {deleteCheckin.isPending ? "Deleting…" : confirming ? "Tap to confirm" : "Delete"}
          </Text>
        </Pressable>
      </View>

      <ErrorText style={{ marginTop: space.sm }}>{error}</ErrorText>
      {checkin.notes && <Text style={[type.body, { marginTop: 12 }]}>{checkin.notes}</Text>}
      {checkin.photos.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {checkin.photos.map((p) => (
            <Image
              key={p.id}
              source={{ uri: p.url }}
              style={{ width: 56, height: 56, borderRadius: radii.sm, backgroundColor: colors.panelRaised }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Was a filled, rounded chip sitting inside the card — a box in a box, where
 * the inner boundary carried no information the spacing didn't already give.
 * A hairline divider separates the readings instead.
 */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.xs }}>
      <Text style={[type.statSm, { fontSize: 15 }]}>{value}</Text>
      <Text style={type.metaSm}>{label}</Text>
    </View>
  );
}

function AddCheckinModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const createCheckin = useCreateCheckin();
  const getUploadUrl = useCheckinUploadUrl();

  const [weightLb, setWeightLb] = useState("");
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<Record<Angle, { url: string; localUri: string } | undefined>>({
    front: undefined, side: undefined, back: undefined,
  });
  const [uploadingAngle, setUploadingAngle] = useState<Angle | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setWeightLb(""); setEnergy(5); setMood(5); setNotes("");
    setPhotos({ front: undefined, side: undefined, back: undefined });
    setError(null);
  }

  async function pickPhoto(angle: Angle) {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setError("Photo library access is needed to add a progress photo.");

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;

    setUploadingAngle(angle);
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 900 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      const { uploadUrl, publicUrl } = await getUploadUrl.mutateAsync({ angle, contentType: "image/jpeg" });
      const blob = await (await fetch(compressed.uri)).blob();
      const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": "image/jpeg" }, body: blob });
      if (!putRes.ok) throw new Error("Upload failed");
      setPhotos((p) => ({ ...p, [angle]: { url: publicUrl, localUri: compressed.uri } }));
    } catch {
      setError("Couldn't upload that photo — photo storage may not be set up yet.");
    } finally {
      setUploadingAngle(null);
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!weightLb && !notes.trim()) {
      return setError("Enter at least a weight or note.");
    }
    try {
      await createCheckin.mutateAsync({
        weightKg: weightLb ? Number(weightLb) / LB_PER_KG : undefined,
        energy,
        mood,
        notes: notes.trim() || undefined,
        photos: ANGLES.filter((a) => photos[a]).map((a) => ({ angle: a, url: photos[a]!.url })),
      });
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save check-in — try again.");
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <PhoneModalFrame backgroundColor={colors.bg}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32, gap: 16 }}>
        <Text style={type.title}>Check in</Text>

        <Field label="Weight (lb)" value={weightLb} onChangeText={setWeightLb} />

        <SliderField label="Energy" value={energy} onChange={setEnergy} />
        <SliderField label="Mood" value={mood} onChange={setMood} />

        <View>
          <Text style={[type.label, { marginBottom: 8 }]}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="How's it going?"
            placeholderTextColor={colors.ink3}
            style={{
              backgroundColor: colors.panel,
              borderWidth: 1,
              borderColor: colors.hairline2,
              borderRadius: radii.md,
              padding: 12,
              fontFamily: font.regular,
              fontSize: 15,
              color: colors.ink,
              minHeight: 70,
              textAlignVertical: "top",
            }}
          />
        </View>

        <View>
          <Text style={[type.label, { marginBottom: 8 }]}>Progress photos (optional)</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {ANGLES.map((angle) => (
              <Pressable
                key={angle}
                onPress={() => pickPhoto(angle)}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.hairline2,
                  backgroundColor: colors.panel,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {uploadingAngle === angle ? (
                  <ActivityIndicator color={colors.signal} />
                ) : photos[angle] ? (
                  <Image source={{ uri: photos[angle]!.localUri }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <Text style={{ fontFamily: font.semibold, color: colors.ink3, fontSize: 11, textTransform: "capitalize" }}>
                    {angle}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {error && <Text style={{ fontFamily: font.medium, color: colors.red, fontSize: 13 }}>{error}</Text>}

        <Pressable
          onPress={handleSubmit}
          disabled={createCheckin.isPending}
          style={({ pressed }) => ({
            backgroundColor: colors.signal,
            borderRadius: radii.md,
            padding: 16,
            alignItems: "center",
            marginTop: 8,
            opacity: createCheckin.isPending || pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.onSignal, letterSpacing: 0.3 }}>
            {createCheckin.isPending ? "Saving…" : "Save check-in"}
          </Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ alignItems: "center", padding: 12 }}>
          <Text style={[type.meta, { fontSize: 15 }]}>Cancel</Text>
        </Pressable>
      </ScrollView>
      </PhoneModalFrame>
    </Modal>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View>
      <Text style={[type.label, { marginBottom: 8 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholderTextColor={colors.ink3}
        style={{
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.hairline2,
          borderRadius: radii.md,
          padding: 12,
          fontFamily: font.numeralMedium,
          fontSize: 17,
          color: colors.ink,
        }}
      />
    </View>
  );
}

function SliderField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={type.label}>{label}</Text>
        <Text style={{ fontFamily: font.numeralMedium, fontSize: 17, color: colors.ink }}>
          {value}
          <Text style={{ fontSize: 13, color: colors.ink3 }}>/10</Text>
        </Text>
      </View>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.signal}
        maximumTrackTintColor={colors.panelRaised}
        thumbTintColor={colors.ink}
      />
    </View>
  );
}
