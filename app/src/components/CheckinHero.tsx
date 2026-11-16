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
grain.tsx for why the grain is a separate file from the colour.

The week strip. Seven days, each either carrying a check-in or not. It tells
you where you are in the week and what the gaps look like without asking for
anything, and it is the one place a reasonable person wants a streak-shaped
read: not "you are on a 9 day run, don't break it", just which days have
something in them.

What does NOT carry over is the reference's streak pill. The app already
counts days on protocol, and a second count, on a second screen, measuring a
second thing, is how an instrument turns into a game.
*/
import { useCallback, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { Dust, GrainOrb, ORB, ORB_BOX } from "./grain";
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
  The orb lives in grain.tsx now, next to the backdrop the check-in flow
  uses, because the two have to agree about what the texture is: one pair
  of files, one set of rotation rules, one reason the grain is a separate
  image from the colour. All three are written up there.
*/

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

  /*
    The scatter.

    One value for every particle, read through a different interpolation
    each. The flow is opened part-way through rather than after: waiting
    for the particles to land would make the press feel like it did
    nothing for half a second, and opening on touch would throw the
    scatter away behind the sheet before any of it was visible. 170ms in,
    the particles are well clear of the rim and the modal fades up over
    what is left.

    It is reset once the sheet is covering the screen, so coming back finds
    the orb whole. Resetting on close instead would snap the particles home
    in full view.
  */
  const burst = useRef(new Animated.Value(0)).current;

  const press = useCallback(() => {
    burst.setValue(0);
    Animated.timing(burst, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const open = setTimeout(onCheckIn, 170);
    const reset = setTimeout(() => burst.setValue(0), 900);
    return () => {
      clearTimeout(open);
      clearTimeout(reset);
    };
  }, [burst, onCheckIn]);

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
        A box wider than the orb, and this one does not clip.

        The orb itself has to clip, because the colour field inside it is
        oversized and rotating and would otherwise spill out as a turning
        diamond. But particles that clip cannot scatter: they reach the rim
        and vanish. So the clip stops at the circle, and the particle layer
        is a sibling of it inside this larger box, free to travel OUT points
        past the edge before it fades.
      */}
      <View
        style={{
          width: ORB_BOX,
          height: ORB_BOX,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={press}
          accessibilityRole="button"
          accessibilityLabel="Add a check-in"
          style={({ pressed }) => ({
            width: ORB,
            height: ORB,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            transform: [{ scale: pressed ? 0.985 : 1 }],
          })}
        >
          <GrainOrb />

          {/*
            Sat on the orb rather than punched through it. The old button
            was a white disc with a hairline, which read as a control
            dropped on top of a picture. This one is the colour of what is
            behind it, only darker, so it belongs to the thing it sits on.
          */}
          <Animated.View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 13,
              borderRadius: 999,
              backgroundColor: "rgba(10,38,41,0.46)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.22)",
              /* Goes with the particles rather than sitting there as they leave. */
              opacity: burst.interpolate({ inputRange: [0, 0.45], outputRange: [1, 0], extrapolate: "clamp" }),
            }}
          >
            <Text style={{ fontFamily: font.semibold, fontSize: 16, color: "#FFFFFF", letterSpacing: 0.2 }}>
              Check in
            </Text>
          </Animated.View>
        </Pressable>

        {/*
          On top of the orb and outside its clip. Pointer events are off, so
          the 236pt target underneath is unaffected by the layer covering
          it.
        */}
        <Dust size={ORB} burst={burst} />
      </View>
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
