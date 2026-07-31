import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme";

interface Props {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-1
  label: string;
  sublabel: string;
}

export function CircularProgress({ size = 168, strokeWidth = 14, progress, label, sublabel }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.tealLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.teal}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontSize: 30, fontWeight: "800", color: colors.ink }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink3, marginTop: 2 }}>{sublabel}</Text>
    </View>
  );
}
