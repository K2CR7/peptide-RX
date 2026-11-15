/*
A real dissolve.

The app's `Fade` only animates a thing in. That is a fade, not a dissolve:
the previous content is already gone by the time the new content starts
appearing, so between the two there is a frame of empty background and the
sequence reads as blink, blink, blink rather than as one thing becoming
another.

A dissolve needs both frames on screen at once. The outgoing one is kept
mounted and absolutely positioned — out of layout, so it cannot push the
incoming one around — and faded down while the incoming one fades up. It is
also made untouchable for the duration, because a half-faded step that still
answers taps is a step that can take input the user cannot see they are
giving.

The step is addressed by index with a render function rather than by passing
children. Children are a new element on every parent render, so an effect
watching them fires continuously and a dissolve keyed on them never settles.
An integer is stable, and it is the thing actually changing.
*/
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { EASE, dur, useReduceMotion } from "./motion";

export function Dissolve({
  step,
  render,
  duration = 280,
}: {
  step: number;
  render: (step: number) => ReactNode;
  duration?: number;
}) {
  const reduced = useReduceMotion();
  const previous = useRef(step);
  const [leaving, setLeaving] = useState<number | null>(null);
  // Starts settled: the first step is simply present, not dissolved into.
  const p = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (previous.current === step) return;
    const from = previous.current;
    previous.current = step;

    setLeaving(from);
    p.setValue(0);

    const anim = Animated.timing(p, {
      toValue: 1,
      duration: dur(duration, reduced),
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      // Unmount the old frame only once it is actually invisible. Dropping it
      // early is the blink this component exists to remove.
      if (finished) setLeaving(null);
    });

    return () => {
      anim.stop();
      // Whatever happens, end on the incoming step fully visible.
      p.setValue(1);
      setLeaving(null);
    };
  }, [duration, p, reduced, step]);

  return (
    <View style={{ flex: 1 }}>
      {leaving !== null && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: "clamp" }),
              transform: [
                {
                  scale: p.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, reduced ? 1 : 1.015],
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
        >
          {render(leaving)}
        </Animated.View>
      )}

      <Animated.View
        style={{
          flex: 1,
          opacity: p,
          transform: [
            {
              scale: p.interpolate({
                inputRange: [0, 1],
                outputRange: [reduced ? 1 : 0.985, 1],
                extrapolate: "clamp",
              }),
            },
          ],
        }}
      >
        {render(step)}
      </Animated.View>
    </View>
  );
}
