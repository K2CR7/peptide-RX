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

The wheel. In the reference it is a full 360 degrees of mood colour with the
action in the middle, and — this is the part worth being precise about — it
is NOT a gauge. It fills no proportion and scores nothing. It is identity,
the same way a logo is. That distinction is the whole reason this is
allowable here: the ring I removed from the home screen was a filled arc
reporting a number, which is a score, and a score on adherence turns a
medical record into a leaderboard. A closed ring that is always closed can't
do that.

The week strip. Seven days, each either carrying a check-in or not. It tells
you where you are in the week and what the gaps look like without asking for
anything, and it is the one place a reasonable person wants a streak-shaped
read: not "you are on a 9 day run, don't break it", just which days have
something in them.

What does NOT carry over is the reference's streak pill. The app already
counts days on protocol, and a second count, on a second screen, measuring a
second thing, is how an instrument turns into a game.
*/
import { Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Pressable } from "react-native";
import { PlusMark } from "./icons";
import { colors, font, radii, space, type } from "../theme";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/*
  The wheel's colours.

  Not from the UI palette, deliberately. Those colours are load-bearing —
  signalInk means "logged", amber means "needs attention" — and borrowing
  them for decoration would mean a user learning that teal means done and
  then meeting a teal that means nothing. These exist only here, chosen to
  sit in the same family so the screen doesn't look pasted in from another
  app: warm gold through the teals into a deep sea blue, and back.

  Four stops around 360 degrees, with the last wrapping to the first, so the
  sweep closes without a seam.
*/
const WHEEL = ["#D4A03C", "#5BAFAB", "#246F72", "#1D4E63"];

function hex(c: string): [number, number, number] {
  return [
    Number.parseInt(c.slice(1, 3), 16),
    Number.parseInt(c.slice(3, 5), 16),
    Number.parseInt(c.slice(5, 7), 16),
  ];
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const to = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${to(ar, br)}${to(ag, bg)}${to(ab, bb)}`;
}

/*
  A conic gradient, built the only way SVG allows one.

  There is no conic gradient in SVG and react-native-svg has no polyfill, so
  the sweep is drawn as a run of short arc segments, each a flat colour
  interpolated along the wheel. Sixty segments at six degrees apiece is past
  the point where the steps are visible at this diameter.

  Each segment overlaps the next by a fraction of a degree. Without that,
  antialiasing leaves a hairline of background between neighbours and the
  ring renders as a dotted circle on a high-density screen.
*/
function ConicRing({ cx, cy, r, width }: { cx: number; cy: number; r: number; width: number }) {
  const N = 60;
  const step = 360 / N;
  const segments = [];

  for (let i = 0; i < N; i++) {
    const t = i / N;
    const scaled = t * WHEEL.length;
    const idx = Math.floor(scaled);
    const color = mix(WHEEL[idx % WHEEL.length], WHEEL[(idx + 1) % WHEEL.length], scaled - idx);

    // -90 puts the first stop at twelve o'clock rather than at three.
    const a0 = ((i * step - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * step + 0.4 - 90) * Math.PI) / 180;

    segments.push(
      <Path
        key={i}
        d={`M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`}
        stroke={color}
        strokeWidth={width}
        fill="none"
      />,
    );
  }

  return <>{segments}</>;
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

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "How are you feeling this morning?";
  if (h < 18) return "How are you feeling this afternoon?";
  return "How are you feeling this evening?";
}

export function CheckinHero({
  checkinDays,
  onCheckIn,
  now = new Date(),
}: {
  /** Start-of-day timestamps that already have a check-in. */
  checkinDays: Set<number>;
  onCheckIn: () => void;
  now?: Date;
}) {
  const week = weekDates(now);
  const todayKey = new Date(now).setHours(0, 0, 0, 0);

  const RING = 208;
  const STROKE = 26;
  const r = (RING - STROKE) / 2;

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
        {greeting(now)}
      </Text>

      {/* ------------------------------------------------------------ wheel */}
      <View style={{ width: RING, height: RING, alignItems: "center", justifyContent: "center" }}>
        <Svg width={RING} height={RING} style={{ position: "absolute" }}>
          <ConicRing cx={RING / 2} cy={RING / 2} r={r} width={STROKE} />
        </Svg>

        <Pressable
          onPress={onCheckIn}
          accessibilityRole="button"
          accessibilityLabel="Add a check-in"
          style={({ pressed }) => ({
            alignItems: "center",
            gap: space.sm,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <View
            style={{
              width: 66,
              height: 66,
              borderRadius: 999,
              backgroundColor: colors.panel,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <PlusMark size={20} color={colors.ink} />
          </View>
          <Text style={{ fontFamily: font.semibold, fontSize: 15, color: colors.ink }}>Check in</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** The pill under the wheel: a fact, not a score. */
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
