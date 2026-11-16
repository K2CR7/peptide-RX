/*
The dose gauge.

Back at hero size, 128px with the ratio printed inside it, which is what the
Today screen asks for and what the tour already calls it. What it is NOT is
the thing described below, and the difference is worth keeping written down:
no colour ramp on the arc, no one-word verdict under the figure, and the
number in the middle is a count of doses rather than a score out of a
hundred. The arc is how far round the day has got; the reading is the pair
of integers, and it is legible without the arc.

The two bugs noted below were found while this was demoted to 56px beside
the adherence ratio. They are fixed here, which is why the component
survived the demotion instead of being redrawn when the ring came back.

This used to be a 190px ring with a 52px numeral inside it and a one-word
verdict underneath — which is, structurally, a wearable's "recovery score":
a filled ring, a big unitless figure, a colour that reads as a grade. That
form converts a measurement into a quota to fill, and its numbers can't be
interrogated. The protective difference here is that adherence is a ratio of
two countable things, so the screen now prints the ratio and uses this only
as a small figure beside it.

Two bugs fixed in the demotion:

The ring was drawn with a gradient from signalInk to trace. Those two
colours measure 2.9 ΔE apart — far under the ~15 needed for two colours to
read as different — so the gradient rendered as a flat fill and the <Defs>
and <LinearGradient> nodes were paying for nothing. Flat colour now.

The animated circle was mounted conditionally on `clamped > 0`. Going from
zero to any value therefore remounted it fresh, with its dash props flipping
from absent to set — the documented trigger for strokeDashoffset breaking on
iOS. It is always mounted now, and "empty" is expressed by a dash offset
equal to the full circumference. One node, one class of platform bug gone.

The sweep was 700ms on Easing.out(Easing.exp), which spends roughly the last
85% of its duration visually still — the arc snaps to almost its final length
and then creeps. That curve suits a hero ring filling as the one event on a
screen. At 56px beside a ratio it reads as a stutter, so it now uses the
app's standard arrival: one curve, one duration, same as everything else.
*/
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { DUR, EASE, dur, useReduceMotion } from "./motion";
import { colors } from "../theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  stroke?: number;
  /** 0–1. */
  progress: number;
}

export function CircularProgress({ size = 56, stroke = 5, progress }: Props) {
  const radius = (size - stroke) / 2;
  // Computed, never measured. getTotalLength() on react-native-svg returns 0
  // during init on iOS and the library's own source calls it likely broken.
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));

  const reduced = useReduceMotion();
  // Starts where the reading starts. The first value to arrive sweeps up from
  // empty; a later change moves from the old reading, not from zero.
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(sweep, {
      toValue: clamped,
      duration: dur(DUR.enter, reduced),
      easing: EASE,
      // strokeDashoffset is an SVG prop, so this drives setNativeProps on the
      // JS thread. react-native-svg has no native-driver integration at all.
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      // The reading must survive an interrupted animation.
      sweep.setValue(clamped);
    };
  }, [clamped, reduced, sweep]);

  const dashoffset = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.track}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.signalInk}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          // A round cap on a ring at 1-2% draws a dot that overstates the
          // value. Butt below a threshold where the cap would be most of it.
          strokeLinecap={clamped > 0.04 ? "round" : "butt"}
        />
      </Svg>
    </View>
  );
}
