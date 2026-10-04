/*
The beat between the survey and the tour.

Its whole job is to mark a boundary: the questions are over, the app starts
now. So it is the one screen in the product that is allowed to be slow —
everything arrives over about two seconds, in order, and nothing else is on
screen competing for attention.

The faded ground is a single radial wash of the signal green at very low
alpha, drawn rather than imported, so it belongs to the same world as the
icons instead of looking like stock art dropped in.
*/
import { useWindowDimensions, View, Text } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/primitives";
import { Rise, DUR } from "../components/motion";
import { colors, font, space, type } from "../theme";

export function QuoteScreen({ onContinue }: { onContinue: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const washSize = Math.max(width, height) * 1.1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* The wash sits behind everything and is never interactive. */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: -washSize * 0.25, left: (width - washSize) / 2 }}
      >
        <Svg width={washSize} height={washSize}>
          <Defs>
            <RadialGradient id="wash" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.signal} stopOpacity={0.14} />
              <Stop offset="55%" stopColor={colors.signal} stopOpacity={0.04} />
              <Stop offset="100%" stopColor={colors.bg} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={washSize / 2} cy={washSize / 2} r={washSize / 2} fill="url(#wash)" />
        </Svg>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: space.xxl,
          paddingBottom: insets.bottom + space.section,
          gap: space.xxl,
        }}
      >
        <Rise delay={250} duration={DUR.slow} distance={18}>
          <Text
            style={{
              fontFamily: font.numeral,
              fontSize: 32,
              lineHeight: 42,
              color: colors.ink,
              letterSpacing: -0.3,
            }}
          >
            "A journey of a thousand miles begins with a single step."
          </Text>
        </Rise>

        <Rise delay={1100} duration={DUR.slow}>
          <Text style={[type.label, { color: colors.signal }]}>Lao Tzu</Text>
        </Rise>

        <Rise delay={1750} duration={DUR.step} style={{ marginTop: space.lg }}>
          <Button label="I'm ready" onPress={onContinue} />
        </Rise>
      </View>
    </View>
  );
}
