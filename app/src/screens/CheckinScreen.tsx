import { useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WeightChart } from "../components/WeightChart";
import { PhoneModalFrame } from "../components/PhoneModalFrame";
import { type Checkin, useCheckins, useDeleteCheckin } from "../lib/queries";
import { AsyncBlock, ErrorText, SectionLabel } from "../components/primitives";
import { CheckinCount, CheckinHero } from "../components/CheckinHero";
import { CheckinFlow } from "../components/CheckinFlow";
import { TourTarget } from "../components/tour";
import { HIT, colors, font, panel, radii, space, type } from "../theme";

const LB_PER_KG = 2.20462;

export function CheckinScreen() {
  const insets = useSafeAreaInsets();
  const { data: checkins, isLoading, isError, refetch } = useCheckins();
  const [addOpen, setAddOpen] = useState(false);

  const checkinDays = useMemo(() => {
    const out = new Set<number>();
    (checkins ?? []).forEach((c) => out.add(new Date(c.createdAt).setHours(0, 0, 0, 0)));
    return out;
  }, [checkins]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 32, gap: 16 }}>
{/*
          No "Progress" title and no button in the corner.

          The screen asks for one thing, so it asks for it: the question is
          the heading, and the action is the largest object under it. A tab
          title restating the tab you just tapped, plus a 13px button holding
          the entire purpose of the screen, had those two the wrong way round.
        */}
        <TourTarget id="progress-checkin">
          <CheckinHero checkinDays={checkinDays} onCheckIn={() => setAddOpen(true)} />
        </TourTarget>

        {!isLoading && !isError && checkins != null && (
          <CheckinCount total={checkins.length} lastAt={checkins[0]?.createdAt ?? null} />
        )}

        {/*
          Held back until the data lands — the chart's own empty copy ("log a
          couple check-ins") was otherwise shown during loading to someone who
          already had months of them.

          And held back entirely below two points. The invitation above is
          already asking for a check-in; a card underneath it asking again, in
          smaller type, is the same request twice and makes an empty screen
          look like a broken one.
        */}
        {!isLoading && !isError && (checkins?.length ?? 0) >= 2 && (
          <WeightChart checkins={checkins ?? []} />
        )}

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
        {/*
          Once armed, there has to be a way back out. Previously nothing
          cleared `confirming` except a delete that succeeded or failed, so
          a user who thought better of it was left with a card whose only
          visible action was "Tap to confirm" — permanently. The two other
          destructive flows in this app both offer a way out ("Keep it",
          "Keep my data"); this one now matches them.
        */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: -8, marginRight: -6 }}>
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
            style={({ pressed }) => ({
              minWidth: 56,
              minHeight: HIT,
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
      </View>

      <ErrorText style={{ marginTop: space.sm }}>{error}</ErrorText>
      {checkin.notes && <Text style={[type.body, { marginTop: 12 }]}>{checkin.notes}</Text>}
      {checkin.tags.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {checkin.tags.map((t) => (
            <View
              key={t}
              style={{
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.edge,
              }}
            >
              <Text style={{ fontFamily: font.medium, fontSize: 12, color: colors.ink2 }}>{t}</Text>
            </View>
          ))}
        </View>
      )}
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

/*
  A shell, not a form.

  Everything that was in here — the weight field, two sliders, the notes box
  and three photo slots, all on one scrolling page — now lives in CheckinFlow
  as a sequence of single questions. What remains is the modal itself.

  The flow is keyed on `visible` so that closing it genuinely discards it.
  Without the key, React keeps the component mounted behind the modal and a
  cancelled check-in comes back next time with last time's half-finished
  answers still in it.
*/
function AddCheckinModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <PhoneModalFrame backgroundColor={colors.bg}>
        {visible && <CheckinFlow key={String(visible)} onClose={onClose} />}
      </PhoneModalFrame>
    </Modal>
  );
}
