/*
Days on protocol.

A ticker, not a chart. The earlier version drew a fortnight of marks under
the number, which turned it back into the schedule readout it was meant to
replace — the point of a streak is that it is ONE number you don't want to
reset. So: the count, what kept it, and nothing else.

The reward is the moment it goes up. Finish the day — log the last dose due,
or simply open the app on a rest day — and the number rolls over while a
short pulse goes out behind it. That beat is the only ornament in the card
and it is gone in under a second. At rest this is a readout; the character is
entirely in how the number arrives.

It fires once per increment, not once per render. The run the user last saw
is persisted, so returning to the Home tab nine times in an evening does not
replay the moment nine times, which is how a reward stops meaning anything.
*/
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
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

/** Milestones get a longer, wider pulse. Rare enough to feel earned. */
const MILESTONES = [7, 30, 100, 365];

interface Celebration {
  from: number;
  to: number;
  by: KeptBy;
  /** Distinguishes consecutive celebrations so the burst remounts. */
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
        padding: space.xl,
        gap: space.md,
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
        Centred, which is not how the rest of this screen is laid out. Two
        reasons. A pulse radiating from a figure sitting 20px off the panel
        edge clips against it on one side, and a clipped flourish reads as a
        bug. And the screen directly above this is a big centred ring, so a
        centred figure is already the language here rather than an exception.
      */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "center",
          gap: space.md,
          paddingVertical: space.sm,
        }}
      >
        <View style={{ justifyContent: "center" }}>
          {/* The pulse sits behind the numeral and radiates from it. */}
          {celebration && (
            <Burst key={celebration.id} big={MILESTONES.includes(celebration.to)} />
          )}
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
          {current === 1 ? "day" : "days"} in a row
        </Text>
      </View>

      <Text style={[type.metaSm, { lineHeight: 17, textAlign: "center" }]}>
        {celebration
          ? celebration.by === "rest"
            ? "Rest day kept. Nothing was due — showing up is the whole job."
            : "Dose logged. Day kept."
          : todayPending
            ? "Today's dose is still open — log it to move the count."
            : "Rest days count: the protocol asks for nothing, so showing up keeps it."}
      </Text>
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

const SPOKES = 10;

/*
  The card clips its own overflow, so the pulse has to finish inside it or it
  gets cut off against the panel edge mid-flight — which reads as a bug, not
  a flourish. These reaches are sized so the widest frame still sits within
  the padding, measured rather than guessed.
*/
const RING = 64;

/**
 * One pulse out from behind the number: a soft disc that blooms and clears,
 * a ring that expands and thins, and a crown of short ticks pushed outward.
 *
 * Deliberately not confetti. Every element is a straight line or a circle in
 * the one brand teal, the whole thing is monochrome, and it is over in
 * three-quarters of a second — which is the difference between an instrument
 * acknowledging something and a game congratulating you for it.
 */
function Burst({ big }: { big: boolean }) {
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(p, {
      toValue: 1,
      duration: big ? 1150 : 780,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
    };
  }, [p, big]);

  const reach = big ? 2.5 : 2.1;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 0,
        height: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Gives the pulse some body, so it isn't only thin outlines. */}
      <Animated.View
        style={{
          position: "absolute",
          width: RING,
          height: RING,
          marginLeft: -RING / 2,
          marginTop: -RING / 2,
          borderRadius: RING / 2,
          backgroundColor: colors.signalFaint,
          opacity: p.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.95, 0.5, 0] }),
          transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.7] }) }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          width: RING,
          height: RING,
          marginLeft: -RING / 2,
          marginTop: -RING / 2,
          borderRadius: RING / 2,
          borderWidth: 2,
          borderColor: colors.signal,
          opacity: p.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.75, 0.45, 0] }),
          transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [0.5, reach] }) }],
        }}
      />
      {Array.from({ length: SPOKES }).map((_, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: 2,
            height: big ? 13 : 10,
            marginLeft: -1,
            backgroundColor: colors.signal,
            opacity: p.interpolate({ inputRange: [0, 0.2, 0.85], outputRange: [0, 0.9, 0] }),
            transform: [
              { rotate: `${(360 / SPOKES) * i}deg` },
              {
                translateY: p.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-24, big ? -72 : -60],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
