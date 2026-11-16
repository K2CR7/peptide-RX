/*
Days on protocol.

A ticker, not a chart, and now the first thing on the Today screen rather
than a panel two thirds of the way down it. It sat below the dose list on the
reasoning that the doses are what the screen is for. True, but it left the
top-left corner — the first place a reader looks, and the only position on a
page that needs no label to be found — holding the word "Today" above the
date: the tab you just tapped, above something the phone already tells you.

So the corner carries the number, the date drops to the quiet line under it,
and the panel is gone. The figure sits on the page ground with nothing drawn
around it, because a border around the top-left corner of a screen is an
edge the screen already has.

The earlier version drew a fortnight of marks under the number, which turned
it back into the schedule readout it was meant to replace — the point of a
streak is that it is ONE number you don't want to reset. So: the count, what
kept it, and nothing else.

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
import { colors, space, type } from "../theme";

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

export function StreakHeader({
  streak,
  settled,
}: {
  streak: StreakSummary;
  /** False while the queries behind the number are still arriving. */
  settled: boolean;
}) {
  const { current, longest, todayKind } = streak;
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
    <View>
      <Text style={type.label}>Days on protocol</Text>

      {/*
        Left-aligned, which the centred panel version was not. The figure
        travels vertically as it turns over, so what it needs is room above
        and below; in the corner the page margin is the edge it sits against,
        and centring it there would leave it floating off the title column
        every other element on the screen lines up with.
      */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: space.sm,
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

        {/* Only when the run on screen is not the best one. A personal best
            that equals the current number is the same number printed twice. */}
        {longest > current && (
          <Text style={[type.metaSm, { paddingBottom: 8 }]}>
            Best {longest}
          </Text>
        )}
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
