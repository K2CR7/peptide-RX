import { useState } from "react";
import type { LayoutChangeEvent, GestureResponderEvent } from "react-native";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";
import { colors, font, panel, type } from "../theme";

const KG_TO_LB = 2.20462;
const HEIGHT = 170;
const PAD_X = 16;
const PAD_Y = 22;
const GRID_ROWS = 4;

interface Point {
  date: string;
  weightLb: number;
}

export function WeightChart({ checkins }: { checkins: { createdAt: string; weightKg: number | null }[] }) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const points: Point[] = checkins
    .filter((c): c is { createdAt: string; weightKg: number } => c.weightKg != null)
    .map((c) => ({ date: c.createdAt, weightLb: c.weightKg * KG_TO_LB }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const xAt = (i: number) => PAD_X + (i / (points.length - 1)) * (width - PAD_X * 2);
  const yAt = (w: number) => PAD_Y + (1 - (w - min) / range) * (HEIGHT - PAD_Y * 2);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.weightLb).toFixed(1)}`).join(" ");
  const areaPath = `${path} L ${xAt(points.length - 1).toFixed(1)} ${HEIGHT - PAD_Y} L ${PAD_X} ${HEIGHT - PAD_Y} Z`;

  function handleTouch(e: GestureResponderEvent) {
    if (width === 0) return;
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, (x - PAD_X) / (width - PAD_X * 2)));
    setActiveIndex(Math.round(ratio * (points.length - 1)));
  }

  const activeIdx = activeIndex ?? points.length - 1;
  const active = points[activeIdx];
  const first = points[0];
  const delta = active.weightLb - first.weightLb;

  return (
    <View style={[panel, { padding: 18 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <Text style={type.label}>Weight trend</Text>
        <Text style={type.meta}>
          {new Date(active.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <Text style={{ fontFamily: font.numeral, fontSize: 40, color: colors.ink, letterSpacing: -0.5 }}>
          {Math.round(active.weightLb)}
          <Text style={{ fontSize: 16, color: colors.ink3 }}> lb</Text>
        </Text>
        <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: delta <= 0 ? colors.signal : colors.amber }}>
          {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} lb`}
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
      >
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="traceFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.trace} stopOpacity={0.22} />
                <Stop offset="1" stopColor={colors.trace} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {Array.from({ length: GRID_ROWS + 1 }, (_, r) => {
              const y = PAD_Y + (r / GRID_ROWS) * (HEIGHT - PAD_Y * 2);
              return (
                <Line
                  key={r}
                  x1={PAD_X}
                  y1={y}
                  x2={width - PAD_X}
                  y2={y}
                  stroke={colors.hairline}
                  strokeWidth={1}
                />
              );
            })}

            {activeIndex != null && (
              <Line x1={xAt(activeIdx)} y1={PAD_Y} x2={xAt(activeIdx)} y2={HEIGHT - PAD_Y} stroke={colors.hairline2} strokeWidth={1} />
            )}

            <Path d={areaPath} fill="url(#traceFill)" />
            <Path d={path} stroke={colors.trace} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((p, i) => (
              <Circle
                key={i}
                cx={xAt(i)}
                cy={yAt(p.weightLb)}
                r={i === activeIdx ? 5 : 3}
                fill={colors.bg}
                stroke={colors.trace}
                strokeWidth={2}
              />
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}
