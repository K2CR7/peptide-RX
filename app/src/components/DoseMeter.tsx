import { useEffect, useMemo } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { colors, font, radii, type } from "../theme";

interface Props {
  /** How many doses were due today. */
  total: number;
  /** How many are logged. */
  done: number;
  label: string;
}

/** Above this, individual blocks get too thin to read and it becomes one bar. */
const MAX_SEGMENTS = 12;

/**
 * A segmented block meter rather than a ring. One block per dose due, so the
 * reading is countable instead of approximate — at one or two doses a ring
 * communicates almost nothing, while blocks you can count do.
 *
 * Carries the signature motion the ring used to: filled blocks light up in
 * sequence on mount, exponential ease-out, one authored moment rather than
 * scattered effects.
 */
export function DoseMeter({ total, done, label }: Props) {
  const segmented = total > 0 && total <= MAX_SEGMENTS;
  const segments = segmented ? total : 1;
  const ratio = total > 0 ? done / total : 0;

  const fills = useMemo(
    () => Array.from({ length: segments }, () => new Animated.Value(0)),
    [segments],
  );

  useEffect(() => {
    Animated.stagger(
      90,
      fills.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [fills, done, total]);

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Text style={{ fontFamily: font.numeral, fontSize: 54, color: colors.ink, letterSpacing: -1 }}>
          {total > 0 ? `${done}/${total}` : "—"}
        </Text>
        <Text style={[type.label, { fontSize: 10.5, paddingBottom: 11 }]} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 6, marginTop: 16 }}>
        {Array.from({ length: segments }, (_, i) => {
          const filled = segmented ? i < done : ratio > 0;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: 36,
                borderRadius: radii.sm,
                borderWidth: 1,
                borderColor: filled ? colors.signalDim : colors.hairline2,
                backgroundColor: colors.panelRaised,
                overflow: "hidden",
              }}
            >
              {filled && (
                <Animated.View
                  style={{
                    height: "100%",
                    width: segmented ? "100%" : `${Math.round(ratio * 100)}%`,
                    backgroundColor: colors.signal,
                    opacity: fills[i],
                  }}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
