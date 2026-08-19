import { useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { WeightChart } from "../components/WeightChart";
import { type Checkin, useCheckinUploadUrl, useCheckins, useCreateCheckin, useDeleteCheckin } from "../lib/queries";
import { colors, radii } from "../theme";

const LB_PER_KG = 2.20462;
const ANGLES = ["front", "side", "back"] as const;
type Angle = (typeof ANGLES)[number];

export function CheckinScreen() {
  const { data: checkins, isLoading } = useCheckins();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink }}>Progress</Text>
          <Pressable
            onPress={() => setAddOpen(true)}
            style={{ backgroundColor: colors.teal, borderRadius: radii.md, paddingVertical: 10, paddingHorizontal: 16 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>+ Check in</Text>
          </Pressable>
        </View>

        <WeightChart checkins={checkins ?? []} />

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink3, textTransform: "uppercase", letterSpacing: 0.6 }}>
            History
          </Text>
          {isLoading && <Text style={{ color: colors.ink3 }}>Loading…</Text>}
          {!isLoading && checkins?.length === 0 && (
            <Text style={{ color: colors.ink3 }}>No check-ins yet. Log your first one above.</Text>
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
    <View style={{ backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View>
          <Text style={{ fontWeight: "800", color: colors.ink, fontSize: 15 }}>
            {new Date(checkin.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            {weightLb != null && <Stat label="weight" value={`${weightLb} lb`} />}
            {checkin.energy != null && <Stat label="energy" value={`${checkin.energy}/10`} />}
            {checkin.mood != null && <Stat label="mood" value={`${checkin.mood}/10`} />}
          </View>
        </View>
        <Pressable onPress={() => deleteCheckin.mutate(checkin.id)} hitSlop={8}>
          <Text style={{ color: colors.ink3, fontSize: 12 }}>Delete</Text>
        </Pressable>
      </View>
      {checkin.notes && <Text style={{ color: colors.ink2, fontSize: 13, marginTop: 10, lineHeight: 18 }}>{checkin.notes}</Text>}
      {checkin.photos.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {checkin.photos.map((p) => (
            <Image key={p.id} source={{ uri: p.url }} style={{ width: 56, height: 56, borderRadius: radii.sm, backgroundColor: colors.bg }} />
          ))}
        </View>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ backgroundColor: colors.bg, borderRadius: radii.sm, paddingVertical: 4, paddingHorizontal: 9 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.ink }}>
        {value} <Text style={{ color: colors.ink3, fontWeight: "600" }}>{label}</Text>
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
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Check in</Text>

        <Field label="Weight (lb)" value={weightLb} onChangeText={setWeightLb} />

        <SliderField label="Energy" value={energy} onChange={setEnergy} />
        <SliderField label="Mood" value={mood} onChange={setMood} />

        <View>
          <Text style={{ fontSize: 13, color: colors.ink3, marginBottom: 6 }}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="How's it going?"
            style={{
              backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border2,
              borderRadius: radii.md, padding: 13, fontSize: 15, color: colors.ink, minHeight: 70, textAlignVertical: "top",
            }}
          />
        </View>

        <View>
          <Text style={{ fontSize: 13, color: colors.ink3, marginBottom: 6 }}>Progress photos (optional)</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {ANGLES.map((angle) => (
              <Pressable
                key={angle}
                onPress={() => pickPhoto(angle)}
                style={{
                  width: 76, height: 76, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border2,
                  backgroundColor: colors.white, alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}
              >
                {uploadingAngle === angle ? (
                  <ActivityIndicator color={colors.teal} />
                ) : photos[angle] ? (
                  <Image source={{ uri: photos[angle]!.localUri }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <Text style={{ color: colors.ink3, fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>{angle}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {error && <Text style={{ color: colors.red, fontSize: 13 }}>{error}</Text>}

        <Pressable
          onPress={handleSubmit}
          disabled={createCheckin.isPending}
          style={{ backgroundColor: colors.teal, borderRadius: radii.md, padding: 15, alignItems: "center", marginTop: 8, opacity: createCheckin.isPending ? 0.6 : 1 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>{createCheckin.isPending ? "Saving…" : "Save check-in"}</Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ alignItems: "center", padding: 12 }}>
          <Text style={{ color: colors.ink3 }}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View>
      <Text style={{ fontSize: 11, color: colors.ink3, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={{
          backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border2,
          borderRadius: radii.md, padding: 12, fontSize: 15, color: colors.ink,
        }}
      />
    </View>
  );
}

function SliderField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 13, color: colors.ink3 }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink }}>{value}/10</Text>
      </View>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.teal}
        maximumTrackTintColor={colors.border2}
        thumbTintColor={colors.teal}
      />
    </View>
  );
}
