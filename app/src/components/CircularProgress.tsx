import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { colors, font } from "../theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-1
  label: string;
  sublabel: string;
}

/**
 * Signature motion: the instrument powers on. The ring sweeps from empty to
 * its reading once on mount and on every change, exponential ease-out, and
 * the readout fades up under it. Native driver is off because
 * strokeDashoffset is an SVG prop, not a transform.
 */
export function CircularProgress({ size = 190, strokeWidth = 11, progress, label, sublabel }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));

  const sweep = useRef(new Animated.Value(0)).current;
  const readout = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(sweep, {
      toValue: clamped,
      duration: 950,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [clamped, sweep]);

  useEffect(() => {
    Animated.timing(readout, {
      toValue: 1,
      duration: 600,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [readout]);

  const dashoffset = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.signal} />
            <Stop offset="1" stopColor="#1FBF7E" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.panelRaised}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {clamped > 0 && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#ringGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
          />
        )}
      </Svg>
      <Animated.View
        style={{
          alignItems: "center",
          opacity: readout,
          transform: [{ translateY: readout.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        }}
      >
        <Text style={{ fontFamily: font.numeral, fontSize: 52, color: colors.ink, letterSpacing: -1 }}>{label}</Text>
        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 11,
            color: colors.ink2,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            marginTop: 2,
          }}
        >
          {sublabel}
        </Text>
      </Animated.View>
    </View>
  );
}
