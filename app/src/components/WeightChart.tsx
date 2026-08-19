import { useState } from "react";
import type { LayoutChangeEvent, GestureResponderEvent } from "react-native";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { colors, radii } from "../theme";

const KG_TO_LB = 2.20462;
const HEIGHT = 160;
const PAD_X = 16;
const PAD_Y = 20;

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
      <View style={{ backgroundColor: colors.white, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: "center" }}>
        <Text style={{ color: colors.ink3, fontSize: 13, textAlign: "center" }}>
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
    <View style={{ backgroundColor: colors.white, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink3, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Weight trend
        </Text>
        <Text style={{ fontSize: 12, color: colors.ink3 }}>
          {new Date(active.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink }}>
          {Math.round(active.weightLb)} <Text style={{ fontSize: 14, color: colors.ink3, fontWeight: "600" }}>lb</Text>
        </Text>
        <Text style={{ fontSize: 13, fontWeight: "700", color: delta <= 0 ? colors.green : colors.amber }}>
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
            <Line x1={PAD_X} y1={HEIGHT - PAD_Y} x2={width - PAD_X} y2={HEIGHT - PAD_Y} stroke={colors.border} strokeWidth={1} />
            {activeIndex != null && (
              <Line x1={xAt(activeIdx)} y1={PAD_Y} x2={xAt(activeIdx)} y2={HEIGHT - PAD_Y} stroke={colors.border2} strokeWidth={1} />
            )}
            <Path d={path} stroke={colors.teal} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <Circle
                key={i}
                cx={xAt(i)}
                cy={yAt(p.weightLb)}
                r={i === activeIdx ? 5 : 3}
                fill={colors.white}
                stroke={colors.teal}
                strokeWidth={2}
              />
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}
