/*
Weight over time.

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
*/
import { useState } from "react";
import type { LayoutChangeEvent, GestureResponderEvent } from "react-native";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { colors, font, panel, type } from "../theme";

const KG_TO_LB = 2.20462;
const HEIGHT = 178;
/** Room for the y labels. Measured for a four-character figure at 10px. */
const PAD_L = 34;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 18;

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

export function WeightChart({ checkins }: { checkins: { createdAt: string; weightKg: number | null }[] }) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const points: Point[] = checkins
    .filter((c): c is { createdAt: string; weightKg: number } => c.weightKg != null)
    .map((c) => ({ t: new Date(c.createdAt).getTime(), weightLb: c.weightKg * KG_TO_LB }))
    .sort((a, b) => a.t - b.t);

  if (points.length < 2) {
    return (
      <View style={[panel, { padding: 20, alignItems: "center" }]}>
        <Text style={[type.body, { textAlign: "center" }]}>
          Log a couple check-ins to see your weight trend.
        </Text>
      </View>
    );
  }

  const weights = points.map((p) => p.weightLb);
  const lo = Math.min(...weights);
  const hi = Math.max(...weights);

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

  const plotW = Math.max(1, width - PAD_L - PAD_R);
  const plotH = HEIGHT - PAD_T - PAD_B;

  const t0 = points[0].t;
  const tSpan = points[points.length - 1].t - t0 || 1;

  const xAt = (t: number) => PAD_L + ((t - t0) / tSpan) * plotW;
  const yAt = (w: number) => PAD_T + (1 - (w - yLo) / (yHi - yLo)) * plotH;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(p.t).toFixed(1)} ${yAt(p.weightLb).toFixed(1)}`)
    .join(" ");

  /** Nearest point by position, not by index — the spacing is uneven now. */
  function handleTouch(e: GestureResponderEvent) {
    if (width === 0) return;
    const x = e.nativeEvent.locationX;
    let best = 0;
    let bestD = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(xAt(p.t) - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setActiveIndex(best);
  }

  const activeIdx = activeIndex ?? points.length - 1;
  const active = points[activeIdx];
  const first = points[0];
  const delta = active.weightLb - first.weightLb;

  return (
    <View style={[panel, { padding: 20 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <Text style={type.label}>Weight trend</Text>
        <Text style={type.meta}>{shortDate(active.t)}</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12, marginBottom: 2 }}>
        <Text
          style={{ fontFamily: font.numeral, fontSize: 38, color: colors.ink, letterSpacing: -0.5 }}
          accessibilityLabel={`${Math.round(active.weightLb)} pounds on ${shortDate(active.t)}`}
        >
          {Math.round(active.weightLb)}
          <Text style={{ fontSize: 17, color: colors.ink3 }}> lb</Text>
        </Text>
        {/*
          Ink, not a verdict colour. "Since the first check-in" is also said
          out loud, because a bare delta against an unstated baseline is the
          kind of number people quote back at themselves wrongly.
        */}
        <Text style={{ fontFamily: font.semibold, fontSize: 13, color: colors.ink2 }}>
          {delta === 0 ? "no change" : `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} lb`}
          <Text style={{ fontFamily: font.medium, color: colors.ink3 }}> since {shortDate(first.t)}</Text>
        </Text>
      </View>

      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        onResponderRelease={() => setActiveIndex(null)}
        style={{ height: HEIGHT }}
        accessible
        accessibilityLabel={`Weight from ${shortDate(first.t)} to ${shortDate(points[points.length - 1].t)}, ${Math.round(first.weightLb)} to ${Math.round(points[points.length - 1].weightLb)} pounds`}
      >
        {width > 0 && (
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

            {activeIndex != null && (
              <Line
                x1={xAt(active.t)}
                y1={PAD_T}
                x2={xAt(active.t)}
                y2={HEIGHT - PAD_B}
                stroke={colors.ink3}
                strokeWidth={1}
              />
            )}

            <Path
              d={path}
              stroke={colors.signalInk}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((p, i) => (
              <Circle
                key={p.t}
                cx={xAt(p.t)}
                cy={yAt(p.weightLb)}
                r={i === activeIdx ? 4.5 : 2.5}
                fill={colors.panel}
                stroke={colors.signalInk}
                strokeWidth={2}
              />
            ))}
          </Svg>
        )}
      </View>

      {/*
        The window, stated. A trend line without its dates is a shape, and
        the same shape means something different over ten days than over ten
        months.
      */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
        <Text style={type.metaSm}>{shortDate(first.t)}</Text>
        <Text style={type.metaSm}>{shortDate(points[points.length - 1].t)}</Text>
      </View>
    </View>
  );
}
