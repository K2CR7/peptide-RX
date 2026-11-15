import { useMemo, useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WeightChart } from "../components/WeightChart";
import { PhoneModalFrame } from "../components/PhoneModalFrame";
import { type Checkin, useCheckins } from "../lib/queries";
import { AsyncBlock } from "../components/primitives";
import { CheckinCount, CheckinHero } from "../components/CheckinHero";
import { CheckinDetail } from "../components/CheckinDetail";
import { CheckinFlow } from "../components/CheckinFlow";
import { TourTarget } from "../components/tour";
import { colors } from "../theme";

export function CheckinScreen() {
  const insets = useSafeAreaInsets();
  const { data: checkins, isLoading, isError, refetch } = useCheckins();
  const [addOpen, setAddOpen] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const checkinDays = useMemo(() => {
    const out = new Set<number>();
    (checkins ?? []).forEach((c) => out.add(new Date(c.createdAt).setHours(0, 0, 0, 0)));
    return out;
  }, [checkins]);

  /*
    The open check-in is held by id, not by object.

    Holding the object means the sheet keeps showing a stale copy after a
    refetch — and, worse, stays open on a record that has just been deleted
    somewhere else. An id resolves against the current list every render, so
    the sheet closes itself when its subject stops existing.
  */
  const opened: Checkin | null = useMemo(
    () => (checkins ?? []).find((c) => c.id === open) ?? null,
    [checkins, open],
  );

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
          The chart is the history now.

          A list of cards underneath it repeated every reading of every day
          down the screen, so the one thing worth scanning — the shape of the
          line — was a small panel on top of an arbitrarily long column you
          had to scroll past. Each point opens the day it stands for instead.

          Held back until the data lands: the chart's own empty copy was
          otherwise shown during loading to someone who already had months of
          check-ins.
        */}
        <AsyncBlock
          loading={isLoading}
          error={isError}
          isEmpty={checkins?.length === 0}
          emptyText="No check-ins yet. Your first one starts the chart."
          onRetry={refetch}
        >
          <WeightChart checkins={checkins ?? []} onOpen={(c) => setOpen(c.id)} />
        </AsyncBlock>
      </ScrollView>

      <AddCheckinModal visible={addOpen} onClose={() => setAddOpen(false)} />
      <CheckinDetail checkin={opened} onClose={() => setOpen(null)} />
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
