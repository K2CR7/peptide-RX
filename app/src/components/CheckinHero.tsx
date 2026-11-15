/*
The check-in invitation.

Structure lifted from How We Feel's check-in screen, which is the right
reference for this one screen and the wrong one for the rest of the app. The
difference is what is being recorded. A dose is a fact — it happened at a
time, at a site, in a quantity — and a screen that dresses a fact up is lying
about how certain it is. Mood and energy are neither facts nor measurements;
they are a person's own reading of their own day, on a scale they invent as
they go. That is a different kind of data and it earns a different voice.

Three things carry over:

The question, set in the serif at display size. "How are you feeling this
evening?" is a question, so it is written as one and typeset as one, rather
than being a tab titled "Progress" with a button in the corner.

The disc of colour, with the action in the middle. This is the part worth
being precise about: it is NOT a gauge. It fills no proportion and scores
nothing. It is identity, the same way a logo is. That distinction is the
whole reason it is allowable here — the ring I removed from the home screen
was a filled arc reporting a number, which is a score, and a score on
adherence turns a medical record into a leaderboard. A shape that is always
the same shape can't do that.

It started as a conic gradient ring and is now a grainy colour field; see
GrainOrb below for why the grain is a separate file from the colour.

The week strip. Seven days, each either carrying a check-in or not. It tells
you where you are in the week and what the gaps look like without asking for
anything, and it is the one place a reasonable person wants a streak-shaped
read: not "you are on a 9 day run, don't break it", just which days have
something in them.

What does NOT carry over is the reference's streak pill. The app already
counts days on protocol, and a second count, on a second screen, measuring a
second thing, is how an instrument turns into a game.
*/
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import {
  CADENCE_SHORT,
  DEFAULT_CADENCE,
  type CheckinCadence,
  cadenceState,
  cadenceTail,
} from "../data/checkinCadence";
import { colors, font, radii, space, type } from "../theme";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/*
  The orb.

  What was here was a conic gradient drawn as sixty flat arc segments,
  because SVG has no conic gradient and react-native-svg has no polyfill for
  one. It was a clean piece of geometry, and it looked like a clean piece of
  geometry: four evenly spaced stops, a perfect annulus, and a white disc
  punched through the middle of it.

  This is the same idea with the edges taken off, in three layers.

    the field    a generated colour field, where the colours bleed into one
                 another in a way four stops and an interpolator do not
    the grain    a tile of neutral noise, repeated at display resolution
                 rather than baked into the field: grain baked into a 1024px
                 render is averaged into a smooth blur the moment that image
                 is drawn at 236 points, which is the whole reason the two
                 are separate files
    the feather  a radial wash of page colour from 66% out, which melts the
                 circle into the page instead of cutting it against it

  The field is oversized by more than root-two and turns once a minute, so
  the colour is always moving and the corners of a square rotating inside a
  circle never swing into view.

  What has not changed is that none of it reports anything. It fills no
  proportion and scores nothing; it is identity, the same way a logo is,
  which is the only reason a ring is allowable on this screen at all.
*/
const FIELD = require("../../assets/checkin-field.png");
const GRAIN = require("../../assets/checkin-grain.png");

const ORB = 236;

/* Past root-two (1.414), so a corner can never reach the visible circle. */
const OVERFILL = 1.46;

function GrainOrb() {
  const spin = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /*
      Both drive transforms only, so both ride the native driver and the
      loop costs nothing on the JS thread. A minute per revolution is slow
      enough that you never catch it moving and fast enough that the screen
      is never twice the same.
    */
    const turn = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const swell = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    turn.start();
    swell.start();
    return () => {
      turn.stop();
      swell.stop();
    };
  }, [spin, breathe]);

  return (
    <>
      <Animated.Image
        source={FIELD}
        style={{
          position: "absolute",
          width: ORB,
          height: ORB,
          transform: [
            { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
            {
              scale: breathe.interpolate({
                inputRange: [0, 1],
                outputRange: [OVERFILL, OVERFILL + 0.07],
              }),
            },
          ],
        }}
      />

      {/*
        Static, and deliberately so. Film grain sits on the print, not on
        the thing photographed: grain that rotated with the field would read
        as a texture painted onto a spinning object rather than as grain.
      */}
      <Image
        source={GRAIN}
        resizeMode="repeat"
        style={{ position: "absolute", width: ORB, height: ORB, opacity: 0.6 }}
      />

      <Svg width={ORB} height={ORB} style={{ position: "absolute" }} pointerEvents="none">
        <Defs>
          <RadialGradient id="orbFeather" cx="50%" cy="50%" r="50%">
            <Stop offset="0.66" stopColor={colors.bg} stopOpacity={0} />
            <Stop offset="0.87" stopColor={colors.bg} stopOpacity={0.5} />
            <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        {/*
          A square filled with a radial gradient, not a circle: everything
          past the inscribed circle, the four corners included, takes the
          last stop and so is solid page colour.
        */}
        <Rect width={ORB} height={ORB} fill="url(#orbFeather)" />
      </Svg>
    </>
  );
}

/** Sunday-first, matching the strip above, because JS getDay() is too. */
function weekDates(now: Date): Date[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/*
  Flat, not time-aware. It used to read "this morning" / "this afternoon" /
  "this evening", which personalised the sentence without changing what was
  being asked: a check-in logged at 11pm records the same day either way.
*/
const QUESTION = "How are you feeling?";

export function CheckinHero({
  checkinDays,
  onCheckIn,
  cadence = DEFAULT_CADENCE,
  lastAt = null,
  now = new Date(),
}: {
  /** Start-of-day timestamps that already have a check-in. */
  checkinDays: Set<number>;
  onCheckIn: () => void;
  /** What the user said in onboarding, or changed in settings. */
  cadence?: CheckinCadence;
  /** The most recent check-in, which is what the cadence is measured from. */
  lastAt?: string | null;
  now?: Date;
}) {
  const week = weekDates(now);
  const todayKey = new Date(now).setHours(0, 0, 0, 0);

  return (
    <View style={{ gap: space.xl, alignItems: "center" }}>
      {/* ------------------------------------------------------ week strip */}
      <View style={{ flexDirection: "row", gap: 6, alignSelf: "stretch" }}>
        {week.map((d, i) => {
          const key = d.getTime();
          const has = checkinDays.has(key);
          const isToday = key === todayKey;
          const future = key > todayKey;

          return (
            <View key={key} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <Text
                style={{
                  fontFamily: isToday ? font.bold : font.medium,
                  fontSize: 11,
                  letterSpacing: 0.5,
                  color: isToday ? colors.ink : colors.ink3,
                }}
              >
                {DAY_LETTERS[i]}
              </Text>
              {/*
                A day with a check-in is filled, a day without is an outline,
                and a day that hasn't happened yet is fainter still. Same
                filled-versus-outlined vocabulary as the dose matrix on the
                home screen — learning it once should be enough.
              */}
              <View
                accessibilityLabel={`${d.toLocaleDateString(undefined, { weekday: "long" })}${has ? ", checked in" : ""}`}
                style={{
                  width: "100%",
                  aspectRatio: 1,
                  maxWidth: 38,
                  borderRadius: 999,
                  backgroundColor: has ? colors.signalInk : "transparent",
                  borderWidth: has ? 0 : 1,
                  borderColor: future ? colors.hairline : colors.edge,
                  opacity: future ? 0.5 : 1,
                }}
              />
            </View>
          );
        })}
      </View>

      {/* -------------------------------------------------------- question */}
      <Text
        style={{
          fontFamily: font.display,
          fontSize: 34,
          lineHeight: 39,
          color: colors.ink,
          textAlign: "center",
          paddingHorizontal: space.md,
        }}
      >
        {QUESTION}
      </Text>

      {/*
        The cadence they chose, and where they are in it.

        Stated rather than enforced. Nothing on this screen refuses an early
        check-in or marks a late one — a number somebody picked for
        themselves in their first five minutes is not a standard to hold them
        to. It is here so "due today" means something they agreed to, instead
        of the app deciding on their behalf that every day is a check-in day.
      */}
      <Text style={[type.metaSm, { marginTop: -space.md }]}>
        {CADENCE_SHORT[cadence]} · {cadenceTail(cadenceState(lastAt, cadence))}
      </Text>

      {/* -------------------------------------------------------------- orb */}
      {/*
        The whole orb is the control, not a button sitting inside one. The
        hit area is the full 236 points rather than the 66pt disc the old
        layout gave it, which is three times the target for the one thing
        this screen exists to do.
      */}
      <Pressable
        onPress={onCheckIn}
        accessibilityRole="button"
        accessibilityLabel="Add a check-in"
        style={({ pressed }) => ({
          width: ORB,
          height: ORB,
          alignItems: "center",
          justifyContent: "center",
          /*
            The field is oversized and rotating, so without this it spills
            past the orb as a turning diamond. Clipping to the square is
            enough: everything outside the inscribed circle is solid page
            colour by the time the feather is drawn over it.
          */
          overflow: "hidden",
          transform: [{ scale: pressed ? 0.985 : 1 }],
        })}
      >
        <GrainOrb />

        {/*
          Sat on the orb rather than punched through it. The old button was
          a white disc with a hairline, which read as a control dropped on
          top of a picture. This one is the colour of what is behind it,
          only darker, so it belongs to the thing it sits on.
        */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 13,
            borderRadius: 999,
            backgroundColor: "rgba(10,38,41,0.34)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.28)",
          }}
        >
          <Text style={{ fontFamily: font.semibold, fontSize: 16, color: "#FFFFFF", letterSpacing: 0.2 }}>
            Check in
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

/** The pill under the orb: a fact, not a score. */
export function CheckinCount({ total, lastAt }: { total: number; lastAt: string | null }) {
  if (total === 0) return null;

  const days =
    lastAt === null
      ? null
      : Math.round((Date.now() - new Date(lastAt).getTime()) / 86400000);

  return (
    <View
      style={{
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
        borderRadius: 999,
        backgroundColor: colors.signalFaint,
        borderWidth: 1,
        borderColor: colors.signalDim,
      }}
    >
      <Text style={{ fontFamily: font.bold, fontSize: 12, color: colors.ink, letterSpacing: 0.4 }}>
        {total}
      </Text>
      <Text style={{ fontFamily: font.medium, fontSize: 12, color: colors.ink2, letterSpacing: 0.4 }}>
        {total === 1 ? "CHECK-IN" : "CHECK-INS"}
        {days !== null && (days === 0 ? " · TODAY" : days === 1 ? " · 1 DAY AGO" : ` · ${days} DAYS AGO`)}
      </Text>
    </View>
  );
}
