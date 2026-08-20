import { useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { PlusMark } from "../components/icons";
import { WeightChart } from "../components/WeightChart";
import { type Checkin, useCheckinUploadUrl, useCheckins, useCreateCheckin, useDeleteCheckin } from "../lib/queries";
import { colors, font, panel, radii, type } from "../theme";

const LB_PER_KG = 2.20462;
const ANGLES = ["front", "side", "back"] as const;
type Angle = (typeof ANGLES)[number];

export function CheckinScreen() {
  const { data: checkins, isLoading } = useCheckins();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32, gap: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={type.title}>Progress</Text>
          <Pressable
            onPress={() => setAddOpen(true)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.signal,
              borderRadius: radii.md,
              paddingVertical: 9,
              paddingHorizontal: 14,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <PlusMark size={13} color={colors.onSignal} />
            <Text style={{ fontFamily: font.bold, fontSize: 13.5, color: colors.onSignal, letterSpacing: 0.3 }}>
              Check in
            </Text>
          </Pressable>
        </View>

        <WeightChart checkins={checkins ?? []} />

        <View style={{ gap: 10 }}>
          <Text style={type.label}>History</Text>
          {isLoading && <Text style={type.body}>Loading…</Text>}
          {!isLoading && checkins?.length === 0 && (
            <View style={[panel, { padding: 18 }]}>
              <Text style={type.body}>No check-ins yet. Log your first one above.</Text>
            </View>
          )}
          {checkins?.map((c) => <CheckinCard key={c.id} checkin={c} />)}
        </View>
      </ScrollView>

      <AddCheckinModal visible={addOpen} onClose={() => setAddOpen(false)} />
    </View>
  );
}

function CheckinCard({ checkin }: { checkin: Checkin }) {
  const deleteCheckin = useDeleteCheckin();
  const weightLb = checkin.weightKg != null ? Math.round(checkin.weightKg * LB_PER_KG) : null;

  return (
    <View style={[panel, { borderRadius: radii.lg, padding: 16 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View>
          <Text style={[type.heading, { fontSize: 15 }]}>
            {new Date(checkin.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {weightLb != null && <Stat label="weight" value={`${weightLb} lb`} />}
            {checkin.energy != null && <Stat label="energy" value={`${checkin.energy}/10`} />}
            {checkin.mood != null && <Stat label="mood" value={`${checkin.mood}/10`} />}
          </View>
        </View>
        <Pressable onPress={() => deleteCheckin.mutate(checkin.id)} hitSlop={8}>
          <Text style={{ fontFamily: font.medium, color: colors.red, fontSize: 12.5 }}>Delete</Text>
        </Pressable>
      </View>
      {checkin.notes && <Text style={[type.body, { marginTop: 10 }]}>{checkin.notes}</Text>}
      {checkin.photos.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.panelRaised,
        borderRadius: radii.sm,
        paddingVertical: 5,
        paddingHorizontal: 10,
      }}
    >
      <Text style={{ fontFamily: font.numeralMedium, fontSize: 13.5, color: colors.ink }}>
        {value} <Text style={{ fontFamily: font.medium, fontSize: 11.5, color: colors.ink3 }}>{label}</Text>
      </Text>
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
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32, gap: 16 }}>
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
              padding: 13,
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
          <View style={{ flexDirection: "row", gap: 10 }}>
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
            padding: 15,
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
          <Text style={[type.meta, { fontSize: 14 }]}>Cancel</Text>
        </Pressable>
      </ScrollView>
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
        <Text style={{ fontFamily: font.numeralMedium, fontSize: 16, color: colors.ink }}>
          {value}
          <Text style={{ fontSize: 12, color: colors.ink3 }}>/10</Text>
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
