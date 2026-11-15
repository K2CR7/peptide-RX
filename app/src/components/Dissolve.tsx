/*
A real dissolve, with travel.

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

It travels now, and that is not decoration. A cross-fade between two steps
of a four-step form is almost unreadable as motion: the two frames occupy
the same place, the change is in opacity alone, and on a step whose body is
a text field and a unit label there is barely anything to cross-fade. The
answer most forms reach for is to move the content in the direction of
travel, so Continue pushes the page left and Back pushes it right, which
tells you which way through the form you just went without a word of copy.
The old frame scaled up 1.5% instead, which is a direction-free gesture
nobody reads as progress.

`dir` is +1 going forward and -1 going back. It is passed rather than
inferred from the step index because the caller already knows: it is the
difference between Continue and Back, not something to work out afterwards.

The step is addressed by index with a render function rather than by passing
children. Children are a new element on every parent render, so an effect
watching them fires continuously and a dissolve keyed on them never settles.
An integer is stable, and it is the thing actually changing.
*/
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { EASE, dur, useReduceMotion } from "./motion";

/* How far the content travels, in points. Far enough to read as a push. */
const TRAVEL = 38;

export function Dissolve({
  step,
  render,
  dir = 1,
  fill = true,
  duration = 340,
}: {
  step: number;
  render: (step: number) => ReactNode;
  /** +1 forward through the form, -1 back. */
  dir?: number;
  /** False for a block of fixed height, such as a title, rather than a stage. */
  fill?: boolean;
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

  /*
    Both frames read their opacity and their travel off the same `p`. One
    animated value per node is the rule: two values sharing a node's
    transform array is legal on the native driver and silently freezes one
    of them on react-native-web, which compiles a node's transform into a
    single Web Animation.
  */
  const travel = reduced ? 0 : TRAVEL * dir;

  return (
    <View style={fill ? { flex: 1 } : undefined}>
      {leaving !== null && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: "clamp" }),
              transform: [
                {
                  translateX: p.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -travel],
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
          flex: fill ? 1 : undefined,
          opacity: p,
          transform: [
            {
              translateX: p.interpolate({
                inputRange: [0, 1],
                outputRange: [travel, 0],
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
