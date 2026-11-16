/*
The orb, and the dust the check-in flow sits on.

  checkin-cloud-a.png   19000 dots on a sphere surface
  checkin-cloud-b.png   11000 more, in a thicker shell
  checkin-word.png      "Check in" as a point cloud
  checkin-dust-tile.png a seamless tile of the same dots, for the flow

THE ORB IS A POINT CLOUD, which is the one thing that took all day to
arrive at. Earlier versions were a solid mass with something applied over
it: a colour field with a noise tile on top, then particle plates on top
of that, then a generated grainy gradient. All of them were wrong in the
same way. The reference has no mass at all -- the background shows
through everywhere and the form exists only in where the dots are.

DENSITY AT THE RIM IS THE WHOLE EFFECT, and it is geometry rather than
styling. Points spread evenly over a sphere SURFACE project to a disc
whose density goes as 1/sqrt(1 - r^2), because near the silhouette the
surface is almost end-on to the viewer and a lot of it lands in very
little screen area. Fading the rim, which is the instinct, destroys the
one cue that makes it read as a sphere. See mkcloud.js for the placement.

THE RULES, each of which cost something to learn:

  One animated value per node. Driving two Animated.Values through a
  single transform array is legal on the native driver and silently
  freezes one of them on react-native-web, which compiles a node's
  transform into one Web Animation: the second animation to start claims
  it. Composition comes from nesting, never from stacking values on one
  node.

  One value, many nodes, is fine and is how this stays cheap. What makes
  two layers independent is the interpolation, not the value.

  Do not animate particles individually. An earlier version gave every
  particle its own pair of Animated.Views: 680 animated nodes, measured at
  1.2fps against 61 with them gone. A multi-point interpolation on a
  transform does not take the native path on react-native-web, so every
  node was restyled from JavaScript on every frame. The particles are
  baked into plates and the plates are what move.

  The burst has to escape. The orb's box is larger than the orb and does
  not clip, so the cloud can scale past where the sphere ended. A clipped
  particle does not scatter, it vanishes at the rim.

  Scope every measurement to the node you changed. Two readings in this
  file's history were wrong rather than the code: one read a parked node
  from a still-mounted tab, the other read react-native-web's own wrapper
  div instead of the animated element inside it.
*/
import { useEffect, useRef } from "react";
import { Animated, Easing, View, useWindowDimensions } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../theme";

export const CHECK_WORD = require("../../assets/checkin-word.png");
export const CLOUD_A = require("../../assets/checkin-cloud-a.png");
export const CLOUD_B = require("../../assets/checkin-cloud-b.png");

export const ORB = 236;

/* How far past the orb a particle may travel. The box is sized from it. */
export const OUT = 70;
export const ORB_BOX = ORB + OUT * 2;


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

const DUST_TILE = require("../../assets/checkin-dust-tile.png");
const TILE = 512;


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
      {/*
        A body behind the dots.

        The cloud on its own is just dots on the page, and a sphere made
        only of its own surface has nothing inside it: the middle read as
        a gap rather than as the near face of something solid. This is the
        volume the dots are the surface OF -- pale at the centre where you
        are looking through the most of it, gone by the rim where the dots
        take over and do the describing themselves.
      */}
      <Svg width={ORB} height={ORB} style={{ position: "absolute" }} pointerEvents="none">
        <Defs>
          <RadialGradient id="orbBody" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.signal} stopOpacity={0.3} />
            <Stop offset="0.62" stopColor={colors.signal} stopOpacity={0.17} />
            <Stop offset="1" stopColor={colors.signal} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={ORB} height={ORB} fill="url(#orbBody)" />
      </Svg>

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

  /*
    A fade and the particles, and nothing else.

    This used to be the orb's own image blown up to nearly twice the
    screen width and hung above the top edge so its bleed washed down the
    page, under a gradient, under a static noise tile. Three layers
    competing to be the background of a form somebody is trying to type
    into. The orb does not belong here: it is the thing you pressed to
    GET here, and repeating it at four times the size behind the
    questions turns a backdrop into a second subject.

    So: white at the top where the question sits, the app teal at the
    bottom, and the same dots drifting over it that the orb is made of.
  */
  return (
    <View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <Svg width={width} height={height} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id="washFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="0.42" stopColor={colors.signalFaint} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.signalDim} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#washFade)" />
      </Svg>

      <DustField />
    </View>
  );
}
