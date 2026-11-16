/*
Shared motion.

One easing curve and one set of durations for the whole app, so every
transition feels like the same hand. Exponential ease-out: things leave
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

Two rules this module exists to enforce.

Every effect sets its value to the START explicitly before animating. The
value lives in a ref, so it survives the cleanup that parks it at the end
state — and without the reset, the second run of an effect animates from 1 to
1 and nothing moves. That happens on any prop change and on every mount under
StrictMode, which runs effect, cleanup, effect by design. The failure looks
like "finished instantly" rather than like "broken", so it would never get
reported.

Every cleanup parks the value at the VISIBLE end state. Between those two
rules there is no ordering of mounts, unmounts and prop changes that can
leave content invisible.
*/
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, type ViewStyle } from "react-native";

/** Exponential ease-out. Real objects decelerate; they don't bounce. */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/*
  Four durations, and a fifth that is used twice.

  The old scale had a 420ms "standard step", which is a presentation duration:
  fine for a one-time onboarding slide, far too slow for anything touched
  repeatedly. 420ms of fade between tabs is a tenth of a second of input lag,
  and that reads as the app being slow, not as the app being smooth.
*/
export const DUR = {
  /** No animation. For a value being read rather than played. */
  none: 0,
  /** Press feedback and state flips — at the edge of feeling instant. */
  tap: 120,
  /** Moving between things: tab switches, cross-fades. */
  move: 180,
  /** Something arriving on screen for the first time. */
  enter: 240,
  /** The quote beat and the one signature sweep. Nothing else. */
  slow: 900,
} as const;

/**
 * True when the platform asks for reduced motion.
 *
 * Three platforms, two mechanisms. On web this reads the prefers-reduced-motion
 * media query directly rather than going through react-native-web's
 * AccessibilityInfo shim, because the query is the source of truth and the
 * shim's coverage of the change event has moved between versions. On iOS and
 * Android it is the system setting plus its native event.
 */
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
      // Safari below 14 has only the deprecated form.
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
      }
      mq.addListener(onChange);
      return () => mq.removeListener(onChange);
    }

    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduced(v);
      })
      .catch(() => {
        // An unreadable setting is not a reason to refuse to render.
      });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => setReduced(v));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

/**
 * Scales a duration by the reduce-motion preference.
 *
 * Reduced motion collapses the duration to zero rather than skipping the
 * animation: a zero-duration timing still runs and still lands on its end
 * value, so the gate cannot leave anything invisible. Skipping the start
 * would.
 */
export function dur(ms: number, reduced: boolean): number {
  return reduced ? 0 : ms;
}

/**
 * Enters by fading up from slightly below. `delay` staggers siblings so a
 * screen assembles rather than appearing all at once.
 *
 * Under reduced motion the slide is dropped and only the fade remains. The
 * translate is the part that causes trouble, and a cross-fade still says
 * "this is new" without moving anything across the screen.
 */
export function Rise({
  children,
  delay = 0,
  distance = 14,
  duration = DUR.enter,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReduceMotion();
  const travel = reduced ? 0 : distance;

  useEffect(() => {
    // Animate from the start, not from wherever the last run parked us.
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: dur(duration, reduced),
      delay: dur(delay, reduced),
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
  }, [delay, duration, progress, reduced]);

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
                outputRange: [travel, 0],
                extrapolate: "clamp",
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
  duration = DUR.enter,
  style,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const reduced = useReduceMotion();

  useEffect(() => {
    opacity.setValue(0);
    const anim = Animated.timing(opacity, {
      toValue: 1,
      duration: dur(duration, reduced),
      delay: dur(delay, reduced),
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
      opacity.setValue(1);
    };
  }, [delay, duration, opacity, reduced]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

/**
 * Drives a 0 to 1 value once on mount, for animating something that is not a
 * whole subtree — a dimming scrim, a rail.
 *
 * Native by default: opacity, transform, colour and borderRadius are all on
 * the native driver's allowlist, a scrim is opacity, and a rail should be
 * scaleX. Pass `native: false` only when the value is interpolated into a
 * layout prop (`width`, `height`) or into any SVG attribute, since
 * react-native-svg has no native-driver integration at all. On device the
 * wrong choice throws at dev time naming the offending prop, which is the
 * good failure mode.
 */
export function useEntrance(duration: number = DUR.enter, delay = 0, native = true) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReduceMotion();

  useEffect(() => {
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: dur(duration, reduced),
      delay: dur(delay, reduced),
      easing: EASE,
      useNativeDriver: native,
    });
    anim.start();
    return () => {
      anim.stop();
      progress.setValue(1);
    };
  }, [delay, duration, native, progress, reduced]);

  return progress;
}

export { Animated };
