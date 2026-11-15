/*
Days on protocol.

A ticker, not a chart. The earlier version drew a fortnight of marks under
the number, which turned it back into the schedule readout it was meant to
replace — the point of a streak is that it is ONE number you don't want to
reset. So: the count, what kept it, and nothing else.

The moment it goes up is the only event here. Finish the day — log the last
dose due, or simply open the app on a rest day — and the figure turns over
like a mechanical counter: the old number leaves upward, the new one arrives
from below. That is the whole of it. At rest this is a readout; the character
is entirely in how the number arrives.

What used to sit here was a radiating pulse keyed to milestone tiers at 7,
30, 100 and 365. Tiers plus a reward animation is a game mechanic whatever
the palette, and this is a medical record, so both are gone. The turn-over
stays, because the event is real: a day was kept.

It fires once per increment, not once per render. The run the user last saw
is persisted, so returning to the Home tab nine times in an evening does not
replay the moment nine times, which is how a reward stops meaning anything.
*/
import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import type { KeptBy, StreakSummary } from "../lib/streak";
import { secureStorage } from "../lib/secureStorage";
import { EASE } from "./motion";
import { colors, radii, space, type } from "../theme";

/*
  Not a secret — but it is the one key/value store in this app that already
  works on both web and native, and inventing a second one for a single
  integer would be worse than borrowing this.
*/
const SEEN_KEY = "streak.acknowledged";

interface Celebration {
  from: number;
  to: number;
  by: KeptBy;
  /** Distinguishes consecutive celebrations so the roll remounts. */
  id: number;
}

export function StreakCard({
  streak,
  settled,
}: {
  streak: StreakSummary;
  /** False while the queries behind the number are still arriving. */
  settled: boolean;
}) {
  const { current, longest, todayKind, todayPending } = streak;
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const nextId = useRef(0);

  /*
    Decide whether this number is news.

    The guard on `settled` matters more than it looks: app-opens and dose logs
    arrive in separate requests, and until both land a rest-day run reads low.
    Firing on that would mean a fake celebration on every single app launch,
    which is exactly how a reward stops meaning anything.
  */
  useEffect(() => {
    if (!settled) return;
    let cancelled = false;

    void (async () => {
      const raw = await secureStorage.getItem(SEEN_KEY);
      if (cancelled) return;

      const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10);
      const known = Number.isNaN(parsed) ? null : parsed;

      if (known !== current) await secureStorage.setItem(SEEN_KEY, String(current));
      if (cancelled) return;

      // No stored value means this is the first time the card has been shown
      // on this device. Whatever the number is, it isn't an increment.
      if (known === null || current <= known || todayKind === null) return;

      nextId.current += 1;
      setCelebration({ from: known, to: current, by: todayKind, id: nextId.current });
    })();

    return () => {
      cancelled = true;
    };
  }, [current, settled, todayKind]);

  return (
    <View
      style={{
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.hairline,
        borderRadius: radii.xl,
        padding: space.lg,
        gap: space.sm,
        overflow: "hidden",
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}
      >
        <Text style={type.label}>Days on protocol</Text>
        {longest > current && (
          <Text style={type.metaSm}>
            Best {longest} day{longest === 1 ? "" : "s"}
          </Text>
        )}
      </View>

      {/*
        Centred, which is not how the rest of this screen is laid out. The
        figure travels vertically as it turns over, so it needs even room
        above and below rather than a left edge to sit against, and the
        numeral is the one thing in the card worth looking at directly.
      */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "center",
          gap: space.sm,
          paddingVertical: 2,
        }}
      >
        <View style={{ justifyContent: "center" }}>
          {celebration ? (
            <Roll
              key={celebration.id}
              from={celebration.from}
              to={celebration.to}
              onDone={() => setCelebration(null)}
            />
          ) : (
            <CountUp value={current} />
          )}
        </View>
        <Text style={[type.body, { color: colors.ink2, paddingBottom: 6 }]}>
          {current === 1 ? "day" : "days"}
        </Text>
      </View>

    </View>
  );
}

const NUMERAL = [type.display, { color: colors.signalInk }];

/**
 * Counts up from zero on arrival. This is the ordinary case — the card being
 * looked at, with no news — so it is quick and capped: a 200-day run must not
 * spend ten seconds counting.
 */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const counter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = counter.addListener(({ value: v }) => setShown(Math.round(v)));
    counter.setValue(0);
    const run = Animated.timing(counter, {
      toValue: value,
      duration: Math.min(220 + value * 45, 1100),
      easing: EASE,
      // Driving a listener means this one has to run on the JS thread.
      useNativeDriver: false,
    });
    run.start();
    return () => {
      run.stop();
      counter.removeListener(id);
      // Never leave the number stuck mid-count because this unmounted.
      setShown(value);
    };
  }, [value, counter]);

  return (
    <Text style={NUMERAL} accessibilityLabel={`${value} consecutive days on protocol`}>
      {shown}
    </Text>
  );
}

/**
 * The increment. The old number leaves upward and the new one arrives from
 * below, like a mechanical counter turning over. The old figure is absolutely
 * positioned so the row doesn't reflow while the two cross.
 */
function Roll({ from, to, onDone }: { from: number; to: number; onDone: () => void }) {
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(p, {
      toValue: 1,
      duration: 620,
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start();
    // Hold the finished state a moment before handing back to CountUp, so the
    // line of copy under the number has time to be read.
    const timer = setTimeout(onDone, 3400);
    return () => {
      anim.stop();
      clearTimeout(timer);
      // The destination is the number that must survive an interruption.
      p.setValue(1);
    };
  }, [p, onDone]);

  const leaving = {
    opacity: p.interpolate({
      inputRange: [0, 0.55],
      outputRange: [1, 0],
      extrapolate: "clamp" as const,
    }),
    transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, -34] }) }],
  };
  const arriving = {
    opacity: p.interpolate({
      inputRange: [0.25, 0.8],
      outputRange: [0, 1],
      extrapolate: "clamp" as const,
    }),
    transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
  };

  return (
    <View accessibilityLabel={`${to} consecutive days on protocol`}>
      <Animated.Text style={[NUMERAL, { position: "absolute" }, leaving]}>{from}</Animated.Text>
      <Animated.Text style={[NUMERAL, arriving]}>{to}</Animated.Text>
    </View>
  );
}
