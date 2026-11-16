/*
Shared motion.

One easing curve and one set of durations for the whole first-run flow, so
every transition feels like the same hand. Exponential ease-out: things leave
quickly and settle slowly, which reads as an instrument responding rather
than an animation playing.

Built on React Native's own Animated rather than Reanimated, deliberately.

Reanimated 4 needs react-native-worklets/plugin, and Metro only picks that up
after a cache clear — so any environment where the plugin hadn't been applied
rendered the entire first-run flow at opacity 0. The content was all there in
the DOM and completely invisible. That is the real lesson here and it outlives
the plugin problem: never make whether a thing can be SEEN depend on whether
an animation RAN. Built-in Animated needs no build step, so the failure mode
is gone rather than papered over, and these are fades and short slides, which
it drives perfectly well on the native thread.
*/
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, type ViewStyle } from "react-native";

/** Exponential ease-out. Real objects decelerate; they don't bounce. */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const DUR = {
  /** State flips inside a screen. */
  quick: 180,
  /** The standard step-to-step move. */
  step: 420,
  /** The quote beat, which should feel slower than everything else. */
  slow: 900,
} as const;

/**
 * Enters by fading up from slightly below. `delay` staggers siblings so a
 * screen assembles rather than appearing all at once.
 */
export function Rise({
  children,
  delay = 0,
  distance = 14,
  duration = DUR.step,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start();
    // If this unmounts mid-flight, land on the visible end state rather than
    // leaving a half-faded ghost behind.
    return () => {
      anim.stop();
      progress.setValue(1);
    };
  }, [delay, duration, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** A plain cross-fade, for swapping content in place. */
export function Fade({
  children,
  delay = 0,
  duration = DUR.step,
  style,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
      opacity.setValue(1);
    };
  }, [delay, duration, opacity]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

/**
 * Drives a 0→1 value once on mount, for animating something that isn't a
 * whole subtree — a progress rail, a dimming scrim.
 */
export function useEntrance(duration: number = DUR.step, delay = 0) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: EASE,
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      progress.setValue(1);
    };
  }, [delay, duration, progress]);
  return progress;
}

export { Animated };
