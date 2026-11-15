/*
One check-in, in full.

This is where the history list went. A list of cards repeated every reading
of every day down the screen, which meant the thing you actually scan for —
the shape of the weight line — was a small panel at the top of an arbitrarily
long column of text you had to scroll past.

The chart is the index now, and this is what a point on it opens. Nothing is
lost: everything the old card showed is here, plus the photos at a size you
can actually see, and the delete lives with the record it deletes rather than
sitting on a card in a list where the wrong tap hits the wrong day.
*/
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhoneModalFrame } from "./PhoneModalFrame";
import { ErrorText } from "./primitives";
import { type Checkin, useDeleteCheckin } from "../lib/queries";
import { HIT, colors, font, radii, space, type } from "../theme";

const LB_PER_KG = 2.20462;

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CheckinDetail({ checkin, onClose }: { checkin: Checkin | null; onClose: () => void }) {
  return (
    <Modal visible={checkin != null} animationType="slide" transparent={false} onRequestClose={onClose}>
      <PhoneModalFrame backgroundColor={colors.bg}>
        {checkin != null && <Body key={checkin.id} checkin={checkin} onClose={onClose} />}
      </PhoneModalFrame>
    </Modal>
  );
}

function Body({ checkin, onClose }: { checkin: Checkin; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const deleteCheckin = useDeleteCheckin();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weightLb = checkin.weightKg != null ? checkin.weightKg * LB_PER_KG : null;

  /*
    Two taps, as before. A check-in takes four screens to make and its
    photos cannot be recovered, so a single unconfirmed tap was never the
    right price. "Keep it" is the way back out — without it, arming the
    delete left the only visible action reading "Tap to confirm" forever.
  */
  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    deleteCheckin.mutate(checkin.id, {
      onSuccess: onClose,
      onError: () => {
        setError("Couldn't delete that check-in — try again.");
        setConfirming(false);
      },
    });
  }

  const nothingRecorded =
    weightLb == null &&
    checkin.energy == null &&
    checkin.mood == null &&
    checkin.tags.length === 0 &&
    !checkin.notes &&
    checkin.photos.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space.xl,
          paddingTop: space.md,
        }}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          style={({ pressed }) => ({ minHeight: HIT, justifyContent: "center", opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ fontFamily: font.semibold, fontSize: 14, color: colors.ink2 }}>Close</Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {confirming && !deleteCheckin.isPending && (
            <Pressable
              onPress={() => setConfirming(false)}
              accessibilityRole="button"
              accessibilityLabel="Keep this check-in"
              style={({ pressed }) => ({
                minHeight: HIT,
                justifyContent: "center",
                paddingHorizontal: space.sm,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={type.meta}>Keep it</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleDelete}
            disabled={deleteCheckin.isPending}
            accessibilityRole="button"
            accessibilityLabel={confirming ? "Confirm delete this check-in" : "Delete this check-in"}
            hitSlop={12}
            style={({ pressed }) => ({
              minHeight: HIT,
              justifyContent: "center",
              paddingLeft: space.sm,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={[type.meta, { color: colors.red, fontFamily: confirming ? font.bold : font.medium }]}>
              {deleteCheckin.isPending ? "Deleting…" : confirming ? "Tap to confirm" : "Delete"}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.xl,
          paddingTop: space.xl,
          paddingBottom: Math.max(insets.bottom, space.xl) + space.xl,
          gap: space.xl,
        }}
      >
        <View>
          <Text style={{ fontFamily: font.display, fontSize: 30, lineHeight: 34, color: colors.ink }}>
            {longDate(checkin.createdAt)}
          </Text>
          <Text style={[type.metaSm, { marginTop: 4 }]}>
            Logged at{" "}
            {new Date(checkin.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </Text>
        </View>

        <ErrorText>{error}</ErrorText>

        {/*
          A column, not a row of chips. These are three different units and
          cramming them onto one line made the eye compare 8 with 6 with 186
          as if they were the same kind of number. Readings that were never
          taken are left out rather than shown as a dash: the flow lets you
          skip a step precisely so that it records nothing.
        */}
        <View>
          {weightLb != null && <Reading label="Weight" value={weightLb.toFixed(1)} unit="lb" first />}
          {checkin.energy != null && (
            <Reading label="Energy" value={String(checkin.energy)} unit="/ 10" first={weightLb == null} />
          )}
          {checkin.mood != null && (
            <Reading
              label="Mood"
              value={String(checkin.mood)}
              unit="/ 10"
              first={weightLb == null && checkin.energy == null}
            />
          )}
        </View>

        {checkin.tags.length > 0 && (
          <View style={{ gap: space.sm }}>
            <Text style={type.label}>How it felt</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {checkin.tags.map((t) => (
                <View
                  key={t}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.edge,
                  }}
                >
                  <Text style={{ fontFamily: font.medium, fontSize: 13, color: colors.ink2 }}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {checkin.notes != null && checkin.notes !== "" && (
          <View style={{ gap: space.sm }}>
            <Text style={type.label}>Notes</Text>
            <Text style={[type.body, { lineHeight: 22 }]}>{checkin.notes}</Text>
          </View>
        )}

        {/*
          Full width, stacked. In the list these were 56px squares, which is
          large enough to prove a photo exists and far too small to compare
          one week against another — the only reason to take them.
        */}
        {checkin.photos.length > 0 && (
          <View style={{ gap: space.sm }}>
            <Text style={type.label}>Photos</Text>
            <View style={{ gap: space.md }}>
              {checkin.photos.map((p) => (
                <Image
                  key={p.id}
                  source={{ uri: p.url }}
                  accessibilityLabel={`${p.angle} photo`}
                  resizeMode="cover"
                  style={{
                    width: "100%",
                    aspectRatio: 3 / 4,
                    borderRadius: radii.lg,
                    backgroundColor: colors.panelRaised,
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {nothingRecorded && (
          <Text style={[type.body, { color: colors.ink2 }]}>
            You checked in on this day but skipped every question.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function Reading({
  label,
  value,
  unit,
  first,
}: {
  label: string;
  value: string;
  unit: string;
  first: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        paddingVertical: space.md,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.hairline,
      }}
    >
      <Text style={type.label}>{label}</Text>
      <Text style={{ fontFamily: font.numeral, fontSize: 28, color: colors.ink }}>
        {value}
        <Text style={{ fontFamily: font.medium, fontSize: 14, color: colors.ink3 }}> {unit}</Text>
      </Text>
    </View>
  );
}
