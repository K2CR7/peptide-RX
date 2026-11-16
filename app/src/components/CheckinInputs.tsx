/*
The two controls the check-in flow is built from.

Both replace a @react-native-community/slider. A slider is the wrong
instrument for a 1-to-10 self-report: it implies a continuum the data does
not have, its thumb is the only target on a 300px-wide control, and you
cannot tell 6 from 7 without reading the number off separately. Ten things
you can hit directly are ten targets, and the value is legible without a
label because you can count the filled ones.
*/
import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { EASE, dur, useReduceMotion } from "./motion";
import { colors, font, radii, space, type } from "../theme";

/* ------------------------------------------------------------------ scale */

const STEPS = 10;

export function ScalePicker({
  value,
  onChange,
  lowLabel,
  highLabel,
  accessibilityLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
  accessibilityLabel: string;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", gap: 5 }} accessibilityLabel={accessibilityLabel}>
        {Array.from({ length: STEPS }, (_, i) => {
          const n = i + 1;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              accessibilityRole="radio"
              aria-checked={n === value}
              accessibilityLabel={`${n} out of ${STEPS}`}
              // The bar is 10px wide; the target around it is not.
              hitSlop={{ top: 16, bottom: 16, left: 3, right: 3 }}
              style={{ flex: 1 }}
            >
              <Bar filled={n <= value} isHead={n === value} index={i} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={type.metaSm}>{lowLabel}</Text>
        <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.ink }}>
          {value}
          <Text style={{ fontFamily: font.medium, fontSize: 13, color: colors.ink3 }}> / {STEPS}</Text>
        </Text>
        <Text style={type.metaSm}>{highLabel}</Text>
      </View>
    </View>
  );
}

/*
  One bar.

  It grows as well as fills. Height alone would be a colour change, and a
  colour change is exactly the state signal that disappears in greyscale or
  under any form of colour blindness — the bars have to differ in shape too.
  The selected bar is the tallest, so the value has a readable silhouette
  even with the numeral covered.
*/
function Bar({ filled, isHead, index }: { filled: boolean; isHead: boolean; index: number }) {
  const reduced = useReduceMotion();
  const p = useRef(new Animated.Value(filled ? 1 : 0)).current;

  useEffect(() => {
    const anim = Animated.timing(p, {
      toValue: filled ? 1 : 0,
      // A short stagger outward from the start, so a jump from 2 to 9 reads
      // as a sweep filling rather than seven bars flipping at once.
      delay: dur(filled ? index * 14 : 0, reduced),
      duration: dur(180, reduced),
      easing: EASE,
      // Height is a layout prop, so this cannot ride the native driver.
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      p.setValue(filled ? 1 : 0);
    };
  }, [filled, index, p, reduced]);

  const height = p.interpolate({
    inputRange: [0, 1],
    outputRange: [18, isHead ? 40 : 32],
    extrapolate: "clamp",
  });

  return (
    <View style={{ height: 40, justifyContent: "flex-end" }}>
      <Animated.View
        style={{
          height,
          borderRadius: radii.sm,
          backgroundColor: filled ? colors.signalInk : colors.track,
          borderWidth: filled ? 0 : 1,
          borderColor: colors.hairline2,
        }}
      />
    </View>
  );
}

/* ------------------------------------------------------------------- tags */

/*
  The vocabulary.

  Deliberately an even split of pleasant and unpleasant words, in alternating
  order rather than grouped. A list that opens with four good days running
  nudges toward picking one, and a check-in that flatters the user is worth
  nothing to them three months later when they are trying to work out whether
  a compound did anything.
*/
export const FEELING_TAGS = [
  "Energetic",
  "Tired",
  "Focused",
  "Foggy",
  "Calm",
  "Agitated",
  "Strong",
  "Sore",
  "Rested",
  "Restless",
  "Motivated",
  "Irritable",
  "Hungry",
  "Nauseous",
  "Clear-headed",
  "Anxious",
] as const;

export function TagChips({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
      {FEELING_TAGS.map((tag) => {
        const on = selected.includes(tag);
        return (
          <Pressable
            key={tag}
            onPress={() => onToggle(tag)}
            accessibilityRole="checkbox"
            aria-checked={on}
            accessibilityLabel={tag}
            style={({ pressed }) => ({
              paddingHorizontal: space.md,
              paddingVertical: 9,
              borderRadius: 999,
              backgroundColor: on ? colors.signalInk : colors.panel,
              borderWidth: 1,
              borderColor: on ? colors.signalInk : colors.edge,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: on ? font.semibold : font.medium,
                fontSize: 13,
                color: on ? colors.panel : colors.ink2,
              }}
            >
              {tag}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
