import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { BORDER, colors, font, type } from "../theme";

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
 * says almost nothing, and a circle is the one shape that can't obey a 0px
 * radius. Blocks fill on mount.
 */
export function DoseMeter({ total, done, label }: Props) {
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fill.setValue(0);
    Animated.timing(fill, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [fill, total, done]);

  const segmented = total > 0 && total <= MAX_SEGMENTS;
  const segments = segmented ? total : 1;
  const ratio = total > 0 ? done / total : 0;

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Text style={{ fontFamily: font.numeral, fontSize: 52, color: colors.ink, letterSpacing: -1 }}>
          {total > 0 ? `${done}/${total}` : "—"}
        </Text>
        <Text style={[type.label, { fontSize: 10.5, paddingBottom: 10 }]} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 4, marginTop: 14 }}>
        {Array.from({ length: segments }, (_, i) => {
          const filled = segmented ? i < done : ratio > 0;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: 34,
                borderWidth: BORDER,
                borderColor: colors.ink,
                overflow: "hidden",
              }}
            >
              {filled && (
                <Animated.View
                  style={{
                    height: "100%",
                    width: segmented ? "100%" : `${Math.round(ratio * 100)}%`,
                    backgroundColor: colors.signal,
                    opacity: fill,
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
