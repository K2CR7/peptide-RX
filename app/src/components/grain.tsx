/*
The grain.

Two files and three rules, shared by the orb on the Progress screen and by
the check-in flow that orb opens.

  checkin-field.png   a generated colour field, box-downsampled to 256px
  checkin-grain.png   a 128px tile of neutral noise

They are separate on purpose. Grain baked into a 1024px render is averaged
into a smooth blur the moment that image is drawn at 236 points, so the
colour comes from the file and the grain is laid on top at display
resolution, where a speck stays a speck at any size.

The rules:

  One animated value per node. Driving rotation and scale from two values
  in a single transform array is legal on the native driver and does not
  survive react-native-web, which compiles a node's transform into one Web
  Animation: the second loop to start claims it and the first silently
  freezes. Composition comes from nesting instead.

  Rotation only, never translation. The field is oversized past root-two so
  a rotating square can never swing a corner into view; a translating one
  would, and would need a much larger texture to hide it.

  Grain does not move with the colour. Film grain sits on the print, not on
  the thing photographed. Grain that rotated with the field would read as a
  texture painted onto a spinning object.
*/
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, View, useWindowDimensions } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../theme";

export const FIELD = require("../../assets/checkin-field.png");
export const GRAIN = require("../../assets/checkin-grain.png");

export const ORB = 236;

/* Past root-two (1.414), so a corner can never reach the visible circle. */
const OVERFILL = 1.46;

/** A value that runs 0 to 1 forever. One of these per animated node. */
export function useLoop(duration: number, easing: (t: number) => number = Easing.linear) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [v, duration, easing]);

  return v;
}

export const spinTo = (v: Animated.Value, deg: number) =>
  v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${deg}deg`] });

/*
  The orb.

  Two copies of the same field turning against each other at different
  rates. One turning blur is close to invisible, because a soft radial smear
  looks much the same at every angle; two of them drifting apart churn the
  colour where they overlap, which is the part you can actually see.

  It fills no proportion and scores nothing. It is identity, the same way a
  logo is, which is the only reason a disc of colour is allowable on a
  screen in a medical record at all.
*/
export function GrainOrb() {
  const spinA = useLoop(26000);
  const spinB = useLoop(37000);
  const breathe = useLoop(11000, Easing.inOut(Easing.sin));

  return (
    <>
      <Animated.View
        style={{
          position: "absolute",
          width: ORB,
          height: ORB,
          transform: [
            {
              /*
                0 -> 1 -> 0 across the loop, so the swell comes back on
                itself without the jump a sawtooth would give at the seam.
              */
              scale: breathe.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [OVERFILL, OVERFILL + 0.15, OVERFILL],
              }),
            },
          ],
        }}
      >
        <Animated.Image
          source={FIELD}
          style={{
            position: "absolute",
            width: ORB,
            height: ORB,
            transform: [{ rotate: spinTo(spinA, 360) }],
          }}
        />
        <Animated.Image
          source={FIELD}
          style={{
            position: "absolute",
            width: ORB,
            height: ORB,
            opacity: 0.55,
            transform: [{ rotate: spinTo(spinB, -360) }],
          }}
        />
      </Animated.View>

      <Image
        source={GRAIN}
        resizeMode="repeat"
        style={{ position: "absolute", width: ORB, height: ORB, opacity: 0.6 }}
      />

      <Svg width={ORB} height={ORB} style={{ position: "absolute" }} pointerEvents="none">
        <Defs>
          <RadialGradient id="orbFeather" cx="50%" cy="50%" r="50%">
            <Stop offset="0.66" stopColor={colors.bg} stopOpacity={0} />
            <Stop offset="0.87" stopColor={colors.bg} stopOpacity={0.5} />
            <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        {/*
          A square filled with a radial gradient, not a circle: everything
          past the inscribed circle, the four corners included, takes the
          last stop and so is solid page colour.
        */}
        <Rect width={ORB} height={ORB} fill="url(#orbFeather)" />
      </Svg>
    </>
  );
}

/*
  The backdrop the check-in flow sits on.

  The flow is what the orb opens, so it should look like the inside of the
  orb rather than a plain sheet that happened to appear. The same colour
  field turns above the top edge, far enough off screen that only its lower
  bleed is visible, and the same noise tile covers the whole page.

  Both are kept quiet on purpose, and the reason is contrast rather than
  taste: the title is 32pt of near-black over this, the chips and sliders
  below it carry real state, and none of that may end up sitting on a patch
  of gold. The colour is held to a tint and the grain is neutral, as much
  light speck as dark, so it textures the page without darkening it.
*/
export function GrainWash() {
  const { width, height } = useWindowDimensions();
  const spin = useLoop(44000);

  /* Oversized and hung above the screen: only the bleed reaches the page. */
  const size = width * 1.9;

  return (
    <View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <Animated.Image
        source={FIELD}
        style={{
          position: "absolute",
          width: size,
          height: size,
          left: (width - size) / 2,
          top: -size * 0.54,
          transform: [{ rotate: spinTo(spin, 360) }],
        }}
      />

      <Svg width={width} height={height} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id="washFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.bg} stopOpacity={0.5} />
            <Stop offset="0.3" stopColor={colors.bg} stopOpacity={0.84} />
            <Stop offset="0.58" stopColor={colors.bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#washFade)" />
      </Svg>

      <Image
        source={GRAIN}
        resizeMode="repeat"
        style={{ position: "absolute", width, height, opacity: 0.5 }}
      />
    </View>
  );
}
