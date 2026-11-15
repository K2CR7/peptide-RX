/*
Weight over time — and, now, the index of every check-in.

The previous version of this chart had four problems, and three of them made
it say things that weren't true.

It spaced points evenly by index. A check-in three days after the last one
and a check-in three weeks after it landed the same distance apart, so the
line's slope — the only thing a trend line is for — had no fixed meaning. The
x axis is real time now.

It drew five gridlines and labelled none of them, and scaled the y axis to
exactly the data's own min and max. Between those two, a 0.3 lb wobble over a
fortnight filled the full height of the panel and looked like a crash. There
are labelled ticks on a rounded domain now, and a floor on how small the
domain can get, so a flat stretch looks flat.

It filled the area under the line with a gradient. Area encodes magnitude
measured from a zero baseline, and this axis starts near 180 — so the shading
was quantity-from-nothing drawn against a scale that doesn't start at
nothing. A line has no such claim to make, so it is only a line.

And it coloured any gain amber. The app does not know which direction is good
here: the goal set during onboarding can be to gain. A number the user has to
interpret should not arrive pre-judged, so the delta is ink, and the sign
does the telling.

What's new is that each point is a door. Scrubbing a finger along the line to
move a readout has been replaced by pressing a point to open that day's
check-in in full, because every scrub could only ever show the weight — the
energy, the mood, the words and the photos had nowhere to appear. The points
are drawn as objects rather than as tick marks, and the chart says out loud
that they can be pressed, since a thing that is tappable and does not look it
is the same as a thing that isn't.

Check-ins with no weight still have to be reachable, or skipping the weight
step would quietly make a day's notes and photos unopenable. They sit on
their own row under the axis, on the same dates, where they are honest about
having no value on this scale instead of being plotted at a number nobody
entered.
*/
import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import type { Checkin } from "../lib/queries";
import { colors, font, panel, space, type } from "../theme";

const KG_TO_LB = 2.20462;
const HEIGHT = 178;
/** Room for the y labels. Measured for a four-character figure at 10px. */
const PAD_L = 34;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 18;

/** The press target around a point. 36 is the smallest that survives a thumb. */
const HIT = 36;

/**
 * The narrowest y span the chart will draw, in pounds.
 *
 * Without a floor, the axis zooms to whatever noise is present: scales
 * disagree with themselves by a pound, and the chart would render that as a
 * full-height move. Four pounds is roughly the width of a day's normal
 * fluctuation, so anything inside it reads as flat, which is what it is.
 */
const MIN_SPAN_LB = 4;

interface Point {
  t: number;
  weightLb: number;
  checkin: Checkin;
}

/**
 * 1, 2, 2.5, 5, 10, 25, 50… — the steps people read without doing arithmetic.
 *
 * The 2.5 tier is there because without it the jump from 2 to 5 is a factor
 * of 2.5, and a span landing just above the 2 tier gets rounded out to more
 * than twice the axis it needs. In practice that was a 54 lb change drawn on
 * a 100 lb axis, using half the panel height to say very little.
 */
function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return s * mag;
}

function shortDate(t: number): string {
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function WeightChart({
  checkins,
  onOpen,
}: {
  checkins: Checkin[];
  onOpen: (checkin: Checkin) => void;
}) {
  const [width, setWidth] = useState(0);
  const [pressed, setPressed] = useState<string | null>(null);

  const points: Point[] = checkins
    .filter((c) => c.weightKg != null)
    .map((c) => ({ t: new Date(c.createdAt).getTime(), weightLb: (c.weightKg as number) * KG_TO_LB, checkin: c }))
    .sort((a, b) => a.t - b.t);

  const unweighed = checkins
    .filter((c) => c.weightKg == null)
    .map((c) => ({ t: new Date(c.createdAt).getTime(), checkin: c }))
    .sort((a, b) => a.t - b.t);

  /*
    The time axis spans every check-in, not only the weighed ones. If it
    stopped at the last weighed day, a check-in logged since then with no
    weight would be pinned to the right edge on a date it did not happen.
  */
  const allT = [...points.map((p) => p.t), ...unweighed.map((u) => u.t)];
  const t0 = allT.length > 0 ? Math.min(...allT) : 0;
  const tEnd = allT.length > 0 ? Math.max(...allT) : 0;
  const tSpan = tEnd - t0;

  const plotW = Math.max(1, width - PAD_L - PAD_R);
  const plotH = HEIGHT - PAD_T - PAD_B;

  /* A single date has no span, so it sits in the middle rather than on the edge. */
  const xAt = (t: number) => (tSpan === 0 ? PAD_L + plotW / 2 : PAD_L + ((t - t0) / tSpan) * plotW);

  if (points.length === 0 && unweighed.length === 0) {
    return (
      <View style={[panel, { padding: 20, alignItems: "center" }]}>
        <Text style={[type.body, { textAlign: "center" }]}>
          Your check-ins will chart here as you log them.
        </Text>
      </View>
    );
  }

  const weights = points.map((p) => p.weightLb);
  const lo = weights.length > 0 ? Math.min(...weights) : 0;
  const hi = weights.length > 0 ? Math.max(...weights) : 0;

  /*
    A rounded domain wide enough to breathe. The padding is whichever is
    larger: the amount needed to reach the minimum span, or a tenth of the
    actual span — so a genuinely large move isn't crushed against the frame.
  */
  const span = hi - lo;
  const pad = Math.max((MIN_SPAN_LB - span) / 2, span * 0.12, 0.5);
  const step = niceStep((hi + pad - (lo - pad)) / 3);
  const yLo = Math.floor((lo - pad) / step) * step;
  const yHi = Math.ceil((hi + pad) / step) * step;

  const ticks: number[] = [];
  for (let v = yLo; v <= yHi + step / 2; v += step) ticks.push(Number(v.toFixed(4)));

  const yAt = (w: number) => PAD_T + (1 - (w - yLo) / (yHi - yLo || 1)) * plotH;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(p.t).toFixed(1)} ${yAt(p.weightLb).toFixed(1)}`)
    .join(" ");

  const latest = points[points.length - 1];
  const first = points[0];
  const delta = points.length >= 2 ? latest.weightLb - first.weightLb : null;

  return (
    <View style={[panel, { padding: 20 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <Text style={type.label}>{points.length >= 2 ? "Weight trend" : "Weight"}</Text>
        {latest != null && <Text style={type.meta}>{shortDate(latest.t)}</Text>}
      </View>

      {latest != null && (
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12, marginBottom: 2 }}>
          <Text
            style={{ fontFamily: font.numeral, fontSize: 38, color: colors.ink, letterSpacing: -0.5 }}
            accessibilityLabel={`${Math.round(latest.weightLb)} pounds on ${shortDate(latest.t)}`}
          >
            {Math.round(latest.weightLb)}
            <Text style={{ fontSize: 17, color: colors.ink3 }}> lb</Text>
          </Text>
          {/*
            Ink, not a verdict colour. "Since the first check-in" is also said
            out loud, because a bare delta against an unstated baseline is the
            kind of number people quote back at themselves wrongly.
          */}
          {delta != null && (
            <Text style={{ fontFamily: font.semibold, fontSize: 13, color: colors.ink2 }}>
              {delta === 0 ? "no change" : `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} lb`}
              <Text style={{ fontFamily: font.medium, color: colors.ink3 }}> since {shortDate(first.t)}</Text>
            </Text>
          )}
        </View>
      )}

      {points.length > 0 && (
        <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
          {width > 0 && (
            <>
              <Svg width={width} height={HEIGHT}>
                {/* Gridlines, each with the number it stands for. */}
                {ticks.map((v) => (
                  <Line
                    key={`g${v}`}
                    x1={PAD_L}
                    y1={yAt(v)}
                    x2={width - PAD_R}
                    y2={yAt(v)}
                    stroke={colors.hairline}
                    strokeWidth={1}
                  />
                ))}
                {ticks.map((v) => (
                  <SvgText
                    key={`t${v}`}
                    x={PAD_L - 6}
                    y={yAt(v) + 3.5}
                    fill={colors.ink3}
                    fontSize={10}
                    fontFamily={font.medium}
                    textAnchor="end"
                  >
                    {step < 1 ? v.toFixed(1) : String(Math.round(v))}
                  </SvgText>
                ))}

                {points.length >= 2 && (
                  <Path
                    d={path}
                    stroke={colors.signalInk}
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/*
                  Each point twice: a soft disc the size of its own press
                  target, then the mark itself. The disc is what makes a
                  point look like something you can hit — a 2px ring on a 2px
                  line reads as a data tick, and nobody presses a tick.
                */}
                {points.map((p) => {
                  const on = pressed === p.checkin.id;
                  return (
                    <Circle
                      key={`h${p.checkin.id}`}
                      cx={xAt(p.t)}
                      cy={yAt(p.weightLb)}
                      r={on ? 13 : 9}
                      fill={colors.signalInk}
                      opacity={on ? 0.22 : 0.1}
                    />
                  );
                })}
                {points.map((p) => (
                  <Circle
                    key={`p${p.checkin.id}`}
                    cx={xAt(p.t)}
                    cy={yAt(p.weightLb)}
                    r={pressed === p.checkin.id ? 6 : 4.5}
                    fill={colors.signalInk}
                    stroke={colors.panel}
                    strokeWidth={2}
                  />
                ))}
              </Svg>

              {/*
                Real Pressables over the drawing rather than touch handlers on
                the SVG: they give each point a role, a label and a 36px target
                on both platforms, which a <Circle r="4.5"> cannot.
              */}
              {points.map((p) => (
                <Pressable
                  key={`b${p.checkin.id}`}
                  onPress={() => onOpen(p.checkin)}
                  onPressIn={() => setPressed(p.checkin.id)}
                  onPressOut={() => setPressed(null)}
                  accessibilityRole="button"
                  accessibilityLabel={`${Math.round(p.weightLb)} pounds on ${shortDate(p.t)}. Open this check-in.`}
                  style={{
                    position: "absolute",
                    left: xAt(p.t) - HIT / 2,
                    top: yAt(p.weightLb) - HIT / 2,
                    width: HIT,
                    height: HIT,
                    borderRadius: HIT,
                  }}
                />
              ))}
            </>
          )}
        </View>
      )}

      {/*
        The window, stated. A trend line without its dates is a shape, and
        the same shape means something different over ten days than over ten
        months.
      */}
      {points.length > 0 && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
          <Text style={type.metaSm}>{shortDate(t0)}</Text>
          <Text style={type.metaSm}>{shortDate(tEnd)}</Text>
        </View>
      )}

      {unweighed.length > 0 && (
        <UnweighedRow
          items={unweighed}
          xAt={xAt}
          width={width}
          pressed={pressed}
          setPressed={setPressed}
          onOpen={onOpen}
          onLayout={points.length === 0 ? (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width) : undefined}
        />
      )}

      {/*
        Said in words, because an affordance you have to discover is one most
        people never do. It sits under the chart rather than over it so it
        isn't competing with the figure for the first look.
      */}
      <Text style={[type.metaSm, { marginTop: space.md }]}>
        Tap a point to open that day's check-in.
      </Text>
    </View>
  );
}

/*
  Days you checked in without weighing yourself.

  On the same time axis, under it, drawn hollow — the chart's filled dots mean
  "a weight was recorded here", and these are exactly the days where one
  wasn't. Plotting them on the line at the last known weight, or at the axis
  floor, would both be inventing a reading.
*/
function UnweighedRow({
  items,
  xAt,
  width,
  pressed,
  setPressed,
  onOpen,
  onLayout,
}: {
  items: { t: number; checkin: Checkin }[];
  xAt: (t: number) => number;
  width: number;
  pressed: string | null;
  setPressed: (id: string | null) => void;
  onOpen: (c: Checkin) => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const ROW = 30;
  return (
    <View style={{ marginTop: space.md }}>
      <Text style={[type.metaSm, { marginBottom: 2 }]}>No weight logged</Text>
      <View onLayout={onLayout} style={{ height: ROW }}>
        {width > 0 && (
          <>
            <Svg width={width} height={ROW}>
              <Line x1={PAD_L} y1={ROW / 2} x2={width - PAD_R} y2={ROW / 2} stroke={colors.hairline} strokeWidth={1} />
              {items.map((u) => (
                <Circle
                  key={u.checkin.id}
                  cx={xAt(u.t)}
                  cy={ROW / 2}
                  r={pressed === u.checkin.id ? 6 : 4.5}
                  fill={colors.panel}
                  stroke={colors.ink3}
                  strokeWidth={2}
                />
              ))}
            </Svg>
            {items.map((u) => (
              <Pressable
                key={`b${u.checkin.id}`}
                onPress={() => onOpen(u.checkin)}
                onPressIn={() => setPressed(u.checkin.id)}
                onPressOut={() => setPressed(null)}
                accessibilityRole="button"
                accessibilityLabel={`Check-in on ${shortDate(u.t)}, no weight logged. Open it.`}
                style={{
                  position: "absolute",
                  left: xAt(u.t) - HIT / 2,
                  top: ROW / 2 - HIT / 2,
                  width: HIT,
                  height: HIT,
                  borderRadius: HIT,
                }}
              />
            ))}
          </>
        )}
      </View>
    </View>
  );
}
