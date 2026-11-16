/*
The grain, and the particles made of it.

Two files and a particle system, shared by the orb on the Progress screen
and by the check-in flow that orb opens.

  checkin-field.png   a generated colour field, box-downsampled to 256px
  checkin-grain.png   a 128px tile of neutral noise

They are separate on purpose. Grain baked into a 1024px render is averaged
into a smooth blur the moment that image is drawn at 236 points, so the
colour comes from the file and the texture is laid on top at display
resolution, where a speck stays a speck at any size.

The static tile is the floor, not the effect. On its own it is a texture
printed on a still image, and a printed texture does not read as animation
no matter how slowly the colour behind it turns. The movement comes from
the particles: a hundred-odd dots drifting on their own small closed paths
over the colour, and flung outward when the orb is pressed.

THE RULES, each of which cost something to learn:

  One animated value per node. Driving two Animated.Values through a single
  transform array is legal on the native driver and silently freezes one of
  them on react-native-web, which compiles a node's transform into one Web
  Animation: the second loop to start claims it. A particle needs both a
  drift and a burst, so it is two nested nodes with one value each, never
  one node with two.

  One value, many nodes, is fine and is how this stays cheap. Every
  particle reads the same drift clock and the same burst value; what makes
  them independent is the interpolation, not the value. A hundred
  Animated.Values would be a hundred animations to keep in step.

  A drift path has to close. The clock runs 0 to 1 and repeats, so a path
  whose last point is not its first jumps on every lap. These are circles
  sampled at eight points, which start and end at the same phase.

  The burst has to escape its container. The orb clips to a circle, so the
  particle layer is a sibling of that circle inside a larger unclipped box,
  not a child of it. Clipped particles do not scatter; they vanish at the
  rim.
*/
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Image, View, useWindowDimensions } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../theme";

export const FIELD = require("../../assets/checkin-field.png");
export const GRAIN = require("../../assets/checkin-grain.png");
export const CLOUD_A = require("../../assets/checkin-cloud-a.png");
export const CLOUD_B = require("../../assets/checkin-cloud-b.png");
/* The noise tile is 128px square; the drift covers exactly one per lap. */
const GRAIN_TILE = 128;

export const ORB = 236;

/* How far past the orb a particle may travel. The box is sized from it. */
export const OUT = 70;
export const ORB_BOX = ORB + OUT * 2;

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

/* ------------------------------------------------------------- particles */

const DUST = [
  require("../../assets/checkin-dust-a.png"),
  require("../../assets/checkin-dust-b.png"),
  require("../../assets/checkin-dust-c.png"),
];
const DUST_TILE = require("../../assets/checkin-dust-tile.png");
const TILE = 512;

/*
  Turn rates in ms per revolution, alternating sign, none of them a
  multiple of another so the layers never line back up.

  Three plates of the same material at falling opacity, rather than three
  equal ones: stacked at full strength they sum to a haze. The one in
  front carries the dust you read, the two behind it carry the movement.
*/
const DRIFT = [
  { ms: 23000, dir: 1, burst: 1.95, op: 0.78 },
  { ms: 31000, dir: -1, burst: 2.35, op: 0.6 },
  { ms: 41000, dir: 1, burst: 1.65, op: 0.42 },
];

/*
  A swarm, in three layers.

  Every particle used to be its own pair of Animated.Views: 230 on the orb
  and 110 on the flow, 680 animated nodes between them. react-native-web
  could not drive it. Measured on the running app: 1.2fps, against 61 with
  the particle layer removed. A multi-point interpolation on a transform
  does not take the native path there, so every node was being restyled
  from JavaScript on every frame.

  These are the same particles baked into transparent sheets. Rotation does
  the drifting, because a dot sitting r from the middle of a turning sheet
  travels a circle of radius r, and three sheets turning at rates that do
  not divide into one another read as independent movement rather than as
  one picture spinning. The burst scales them outward, which carries each
  dot along its own radius, away from the centre, by an amount proportional
  to how far out it already was.

  Six animated nodes instead of six hundred and eighty.
*/
export function Dust({
  size,
  burst,
}: {
  size: number;
  /** 0 at rest, 1 fully scattered. Omit for a field that only drifts. */
  burst?: Animated.Value;
}) {
  return (
    /*
      Centred on its parent rather than pinned to its corner, because the
      burst scales from the middle and the middle has to be the orb's. The
      sheet is the size of the thing at rest; the box around it is bigger,
      and unclipped, which is what lets the scatter leave.
    */
    <View
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      pointerEvents="none"
    >
      {DRIFT.map((layer, i) => (
        <DustLayer
          key={i}
          source={DUST[i]}
          size={size}
          ms={layer.ms}
          dir={layer.dir}
          to={layer.burst}
          op={layer.op}
          burst={burst}
        />
      ))}
    </View>
  );
}

/*
  The same dust across a whole page, which is a different problem.

  The orb's sheets are sprites: a disc of specks, rotated. A page cannot
  use one. The first attempt blew the sprite up to one and a half times the
  long edge of the screen, so every 2px speck landed as a 7px blur and the
  flow had four soft blobs on it instead of dust.

  So this is a tile, drawn with its dots wrapped around the edges, repeated
  across an oversized layer and translated by exactly one tile on X and two
  on Y per lap. Integer multiples of the tile, so the wrap is invisible.
  Rotation is not available to a tiled plane: the pattern only meets its
  neighbours at right angles.
*/
export function DustField() {
  const { width, height } = useWindowDimensions();
  const drift = useLoop(30000);

  return (
    <Animated.Image
      source={DUST_TILE}
      resizeMode="repeat"
      style={{
        position: "absolute",
        left: -TILE,
        top: -TILE * 2,
        width: width + TILE * 2,
        height: height + TILE * 4,
        opacity: 0.62,
        transform: [
          { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, TILE] }) },
          { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -TILE * 2] }) },
        ],
      }}
    />
  );
}

function DustLayer({
  source,
  size,
  ms,
  dir,
  to,
  op,
  burst,
}: {
  source: number;
  size: number;
  ms: number;
  dir: number;
  to: number;
  op: number;
  burst?: Animated.Value;
}) {
  const spin = useLoop(ms);

  /*
    Outer node carries the burst, inner node the drift. One animated value
    per node: two values sharing a node's transform array is legal on the
    native driver and silently freezes one of them on react-native-web,
    which compiles a node's transform into a single Web Animation.
  */
  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        opacity: burst
          ? burst.interpolate({ inputRange: [0, 0.25, 1], outputRange: [1, 0.8, 0] })
          : 1,
        transform: burst
          ? [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [1, to] }) }]
          : [],
      }}
    >
      <Animated.Image
        source={source}
        style={{
          position: "absolute",
          width: size,
          height: size,
          opacity: op,
          transform: [{ rotate: spinTo(spin, 360 * dir) }],
        }}
      />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------- orb */

/*
  Two copies of the same field turning against each other at different
  rates. One turning blur is close to invisible, because a soft radial smear
  looks much the same at every angle; two of them drifting apart churn the
  colour where they overlap.

  This is only the body. The particles that make it move are a sibling of
  this component, outside the clip, so that they can leave it.

  It fills no proportion and scores nothing. It is identity, the same way a
  logo is, which is the only reason a disc of colour is allowable on a
  screen in a medical record at all.
*/
export function GrainOrb({ burst }: { burst?: Animated.Value }) {
  const spinA = useLoop(54000);
  const spinB = useLoop(79000);
  const breathe = useLoop(11000, Easing.inOut(Easing.sin));

  /*
    The orb is a POINT CLOUD, which is what the reference actually is: a
    form drawn as thousands of discrete dots with the background showing
    through between them, not a mass with a texture over it. The dots
    crowd at the silhouette because points spread evenly over a sphere
    SURFACE project to a disc whose density goes as 1/sqrt(1 - r^2) --
    near the edge the surface is almost end-on to the viewer, so a lot of
    it lands in very little screen area. See mkcloud.js.

    Two plates at different rates and directions, because one turning on
    its own reads as a rigid object spinning; two sliding against each
    other read as dots moving over a form, which is what the reference
    does.

    No feather here any more. The feather existed to fade a soft mass into
    the page, and fading the rim of this would erase the exact thing that
    makes it a sphere.
  */
  const scatter = (to: number) =>
    burst
      ? { transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [1, to] }) }] }
      : null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: ORB,
        height: ORB,
        transform: [
          {
            /* 0 -> 1 -> 0, so the swell returns without a seam. */
            scale: breathe.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.035, 1],
            }),
          },
        ],
      }}
    >
      {[
        { src: CLOUD_A, spin: spinA, dir: 1, to: 1.9, op: 1 },
        { src: CLOUD_B, spin: spinB, dir: -1, to: 2.4, op: 0.85 },
      ].map((layer, i) => (
        /*
          Nested, one Animated.Value per node. Two values in one
          transform array is legal on the native driver, but
          react-native-web compiles a node transform into a SINGLE web
          animation and the second one to start claims it, silently
          freezing the first. Composition has to come from nesting.
        */
        <Animated.View
          key={i}
          style={[
            { position: "absolute", width: ORB, height: ORB },
            scatter(layer.to),
            burst
              ? {
                  opacity: burst.interpolate({
                    inputRange: [0, 0.75],
                    outputRange: [layer.op, 0],
                    extrapolate: "clamp",
                  }),
                }
              : { opacity: layer.op },
          ]}
        >
          <Animated.Image
            source={layer.src}
            style={{
              position: "absolute",
              width: ORB,
              height: ORB,
              transform: [{ rotate: spinTo(layer.spin, 360 * layer.dir) }],
            }}
          />
        </Animated.View>
      ))}
    </Animated.View>
  );
}

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

      {/*
        The flow's only texture, and it moves.

        There was a static noise tile over the whole screen at 0.42 here.
        That was what anyone actually saw: a still photograph of grain,
        with a few particles drifting somewhere behind it. No amount of
        work on the moving layer shows through a still one laid on top at
        that strength, so the still one is gone and the dust is denser to
        take its place.
      */}
      <DustField />
    </View>
  );
}
