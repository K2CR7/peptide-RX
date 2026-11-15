/*
The camera step.

An in-app camera rather than the system picker. expo-image-picker's
launchCameraAsync hands control to a full-screen OS activity, which is the
opposite of fluid: the app disappears, something else appears, and three
photos means three round trips out of the flow and back. expo-camera renders
a preview inside the step, so taking three shots never leaves the screen.

The way in is one object, not two screens. Pressing the camera button does
not swap a tile for a viewfinder — the tile *is* the viewfinder, and it opens
into one: the frame grows, the panel darkens under it, the copy lifts away,
and the button itself travels down the frame and turns into the shutter it
was always going to be. Nothing enters and nothing leaves, so there is no
moment where the user has to work out what happened to the thing they
pressed.

The growth is also doing work. A camera takes a few hundred milliseconds to
warm up and the first frame is the ugliest part of any camera UI; opening the
frame to black first and letting the picture settle into it hides exactly
that gap, which is why the preview fades in over the back half of the
transition rather than the front.

Permission is asked for at the moment the step is reached, not at launch. A
camera prompt on first open, before the user has seen what the app does, is
the single most reliable way to get a permanent denial. It is also asked
*while* the frame is opening rather than before: a press that produces a
system dialog and nothing else reads as the app having done nothing.

The step is optional and says so. Progress photos are the most personal thing
this app stores, and the flow has to be completable — comfortably — by
someone who never wants to take one.
*/
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Svg, { Circle as SvgCircle, Path } from "react-native-svg";
import { EASE, dur, useReduceMotion } from "./motion";
import { colors, font, radii, space, type } from "../theme";

export const MAX_PHOTOS = 3;

export interface Shot {
  uri: string;
  width: number;
  height: number;
}

/* ---------------------------------------------------------------- geometry */

const REST_H = 168;
const OPEN_H = 330;

const REST_BTN = 68;
const OPEN_BTN = 74;

/**
 * Where the button sits in each state, measured from the frame's top.
 *
 * Sat on the geometric centre at rest, which put it hard against the two
 * lines of copy below it. The block of button-plus-copy is what wants
 * centring, not the button alone.
 */
const REST_TOP = (REST_H - REST_BTN) / 2 - 13;
const OPEN_TOP = OPEN_H - OPEN_BTN - 18;

const EXPAND = 440;
const COLLAPSE = 300;

/* ------------------------------------------------------------------ glyph */

function CameraGlyph({ size = 30, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8.5a2 2 0 0 1 2-2h2.2l1-1.8a1 1 0 0 1 .87-.5h5.86a1 1 0 0 1 .87.5l1 1.8H19a2 2 0 0 1 2 2v8.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <SvgCircle cx={12} cy={12.6} r={3.7} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

/* ------------------------------------------------------------------- step */

export function CameraStep({
  shots,
  onCapture,
  onRemove,
}: {
  shots: Shot[];
  onCapture: (s: Shot) => void;
  onRemove: (index: number) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const camera = useRef<CameraView>(null);
  const reduced = useReduceMotion();

  const full = shots.length >= MAX_PHOTOS;
  const denied = permission != null && !permission.granted && !permission.canAskAgain;
  const granted = permission?.granted === true;

  /*
    One value drives the whole transform.

    Height, top and margin are layout properties, so none of this can ride
    the native driver — and an Animated.Value cannot be split across drivers.
    Rather than run two values in parallel and let them drift, everything
    hangs off this one on the JS driver, which is what react-native-web uses
    for all of it anyway.
  */
  const open = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(open, {
      toValue: live ? 1 : 0,
      duration: dur(live ? EXPAND : COLLAPSE, reduced),
      easing: EASE,
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      open.setValue(live ? 1 : 0);
    };
  }, [live, open, reduced]);

  /* The press itself, before anything else moves. */
  const tap = useRef(new Animated.Value(0)).current;
  function press(down: boolean) {
    Animated.timing(tap, {
      toValue: down ? 1 : 0,
      duration: dur(down ? 90 : 160, reduced),
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }

  /* A shutter needs to say it fired. */
  const flash = useRef(new Animated.Value(0)).current;

  async function start() {
    if (full || denied || live) return;

    // Open first, ask second. A press whose only visible result is a system
    // dialog reads as the app having ignored it.
    setLive(true);

    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) setLive(false);
    }
  }

  async function shoot() {
    if (!camera.current || busy || full) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        flash.setValue(1);
        Animated.timing(flash, {
          toValue: 0,
          duration: dur(260, reduced),
          easing: EASE,
          useNativeDriver: false,
        }).start();

        onCapture({ uri: photo.uri, width: photo.width, height: photo.height });
        // Close after the last one, so the step resolves itself rather than
        // leaving a live camera running with nothing left to do.
        if (shots.length + 1 >= MAX_PHOTOS) setLive(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const i = (a: number, b: number) => open.interpolate({ inputRange: [0, 1], outputRange: [a, b], extrapolate: "clamp" });
  /** Late-arriving things: nothing until the frame is most of the way open. */
  const late = open.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0, 1], extrapolate: "clamp" });
  /** Early-leaving things: gone before the frame has finished growing. */
  const early = open.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 0, 0], extrapolate: "clamp" });

  const tapScale = tap.interpolate({ inputRange: [0, 1], outputRange: [1, reduced ? 1 : 0.93], extrapolate: "clamp" });

  return (
    <View style={{ gap: space.lg }}>
      <Animated.View
        style={{
          height: i(REST_H, OPEN_H),
          borderRadius: radii.xl,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.edge,
          borderStyle: live ? "solid" : "dashed",
          backgroundColor: colors.panel,
        }}
      >
        {/* ------------------------------------------------- the dark frame */}
        {/* Under the preview, so the box is already black when it opens and
            the picture settles into something rather than onto nothing. */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.ink, opacity: late }]} />

        {/* ----------------------------------------------------- the picture */}
        {granted && live && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: late,
                transform: [{ scale: open.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 1.07, 1], extrapolate: "clamp" }) }],
              },
            ]}
          >
            <CameraView ref={camera} style={{ flex: 1 }} facing="back" />
          </Animated.View>
        )}

        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "#FFFFFF", opacity: flash }]}
        />

        {/*
          The frame opens before permission comes back, which is the point —
          but an open black box with a shutter that does nothing is a broken
          camera, not a waiting one. It says which it is.
        */}
        {live && !granted && (
          <Animated.View
            pointerEvents="none"
            style={{ position: "absolute", left: 0, right: 0, top: OPEN_H / 2 - 40, alignItems: "center", opacity: late }}
          >
            <Text style={{ fontFamily: font.medium, fontSize: 13, color: colors.hairline }}>
              Waiting for camera access…
            </Text>
          </Animated.View>
        )}

        {/* --------------------------------------------------- resting copy */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 18,
            alignItems: "center",
            gap: 4,
            opacity: early,
            transform: [{ translateY: i(0, -14) }],
          }}
        >
          <Text style={{ fontFamily: font.semibold, fontSize: 15, color: colors.ink }}>
            {full ? "That's three" : denied ? "Camera access is off" : "Open camera"}
          </Text>
          <Text style={[type.metaSm, { textAlign: "center", paddingHorizontal: space.lg }]}>
            {full
              ? "Remove one to retake it."
              : denied
                ? "Enable it in your device settings if you want to add photos."
                : `Up to ${MAX_PHOTOS} photos. They stay attached to this check-in.`}
          </Text>
        </Animated.View>

        {/* ------------------------------------------------- frame furniture */}
        <Animated.View
          style={{
            position: "absolute",
            top: 14,
            left: 16,
            right: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: late,
          }}
          pointerEvents={live ? "auto" : "none"}
        >
          <Text style={{ fontFamily: font.numeralMedium, fontSize: 13, color: colors.panel }}>
            {shots.length}/{MAX_PHOTOS}
          </Text>
          <Pressable
            onPress={() => setLive(false)}
            accessibilityRole="button"
            accessibilityLabel="Close the camera"
            hitSlop={14}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, minHeight: 32, justifyContent: "center" })}
          >
            <Text style={{ fontFamily: font.semibold, fontSize: 14, color: colors.panel }}>Done</Text>
          </Pressable>
        </Animated.View>

        {/* -------------------------------------------------------- the button
            One object the whole way through: the thing you press to open the
            camera is the thing you press to take the photo, and it walks from
            the middle of the closed tile to the foot of the open frame. */}
        <Animated.View
          style={{
            position: "absolute",
            left: "50%",
            top: i(REST_TOP, OPEN_TOP),
            marginLeft: i(-REST_BTN / 2, -OPEN_BTN / 2),
            width: i(REST_BTN, OPEN_BTN),
            height: i(REST_BTN, OPEN_BTN),
            transform: [{ scale: tapScale }],
          }}
        >
          <Pressable
            onPress={live ? shoot : start}
            onPressIn={() => press(true)}
            onPressOut={() => press(false)}
            disabled={(full && !live) || denied || (live && (busy || full))}
            accessibilityRole="button"
            accessibilityLabel={live ? `Take photo ${shots.length + 1} of ${MAX_PHOTOS}` : "Open the camera"}
            style={{ flex: 1, borderRadius: 999, alignItems: "center", justifyContent: "center" }}
          >
            {/* closed: a filled teal button with a camera on it */}
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderRadius: 999,
                  backgroundColor: colors.signalInk,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: early,
                },
              ]}
            >
              <CameraGlyph color={colors.panel} />
            </Animated.View>

            {/* open: the ring and disc every camera has had for fifty years */}
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderRadius: 999,
                  borderWidth: 3,
                  borderColor: colors.panel,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: late,
                },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={colors.panel} />
              ) : (
                <View style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: colors.panel }} />
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* The whole closed tile is the target, not just the 68px button —
            but only while it is closed, or it would swallow the shutter. */}
        {!live && (
          <Pressable
            onPress={start}
            onPressIn={() => press(true)}
            onPressOut={() => press(false)}
            disabled={full || denied}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={StyleSheet.absoluteFillObject}
          />
        )}
      </Animated.View>

      {shots.length > 0 && (
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {shots.map((s, n) => (
            <Thumb key={s.uri} uri={s.uri} index={n} onRemove={() => onRemove(n)} />
          ))}
        </View>
      )}

      {Platform.OS === "web" && !live && shots.length === 0 && (
        <Text style={[type.metaSm, { textAlign: "center" }]}>Your browser will ask for camera access.</Text>
      )}
    </View>
  );
}

/* A photo should arrive, not appear. */
function Thumb({ uri, index, onRemove }: { uri: string; index: number; onRemove: () => void }) {
  const reduced = useReduceMotion();
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    p.setValue(0);
    const anim = Animated.timing(p, {
      toValue: 1,
      duration: dur(320, reduced),
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
      p.setValue(1);
    };
  }, [p, reduced]);

  return (
    <Animated.View
      style={{
        flex: 1,
        gap: 5,
        opacity: p,
        transform: [
          { scale: p.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 0.88, 1], extrapolate: "clamp" }) },
        ],
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: radii.lg, backgroundColor: colors.track }}
      />
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove photo ${index + 1}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, minHeight: 32, justifyContent: "center" })}
      >
        <Text style={{ fontFamily: font.medium, fontSize: 12, color: colors.ink3, textAlign: "center" }}>Remove</Text>
      </Pressable>
    </Animated.View>
  );
}
