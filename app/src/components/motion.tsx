/*
Shared motion.

One easing curve and one set of durations for the whole first-run flow, so
every transition feels like the same hand. Exponential ease-out: things leave
quickly and settle slowly, which reads as an instrument responding rather
than an animation playing.

Deliberately restrained. The surface is a medical readout, so motion exists
to show continuity between steps — not to perform.
*/
import type { ReactNode } from "react";
import { useEffect } from "react";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import type { ViewStyle } from "react-native";

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
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: EASE }));
  }, [delay, duration, progress]);

  // Explicit deps: without the Babel plugin (which Metro only picks up after a
  // cache clear) Reanimated refuses to infer them on web.
  const animated = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ translateY: (1 - progress.value) * distance }],
    }),
    [distance],
  );

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
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
  return (
    <Animated.View style={style} entering={FadeIn.delay(delay).duration(duration).easing(EASE)}>
      {children}
    </Animated.View>
  );
}

/**
 * Drives a 0→1 value once on mount. For animating something that isn't a
 * whole subtree — a progress rail, a dimming scrim.
 */
export function useEntrance(duration: number = DUR.step, delay = 0) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: EASE }));
  }, [delay, duration, progress]);
  return progress;
}

export { Animated, withTiming, useSharedValue, useAnimatedStyle };
