/*
The camera step: a button, and a camera that grows out of it.

An in-app camera rather than the system picker. expo-image-picker's
launchCameraAsync hands control to a full-screen OS activity, which is the
opposite of fluid: the app disappears, something else appears, and three
photos means three round trips out of the flow and back.

What was here before was a dashed tile captioned "Open camera", which is a
label doing a picture's job. An aperture on a round button is already the
most legible symbol in consumer software; writing "Open camera" underneath it
is the interface explaining its own icon, and an interface that has to do
that has the wrong icon.

Pressing it does not swap one panel for another. The button swells — from
exactly where it sits, at 72px and fully round, to the whole screen with
square corners — and the camera is inside it the whole way. Taking a camera
to full screen is also not a flourish: a viewfinder is for judging framing
and light, and a 300px box in the middle of a form is too small to judge
either, which is the entire reason the photo is being taken.

The growth does real work too. A camera takes a few hundred milliseconds to
warm up and its first frame is the ugliest part of any camera UI, so the
preview fades in over the back half of the expansion — the frame opens to
black and the picture settles into it.

Permission is asked at the moment the step is reached, not at launch, and
*while* the frame is opening rather than before it. A camera prompt on first
open is the most reliable way to get a permanent denial, and a press whose
only visible result is a system dialog reads as the app having ignored you.

The step is optional. Progress photos are the most personal thing this app
stores, and the flow has to be completable — comfortably — by someone who
never wants to take one.
*/
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { EASE, dur, useReduceMotion } from "./motion";
import { ApertureIcon } from "./icons";
import { colors, font, radii, space, type } from "../theme";

export const MAX_PHOTOS = 3;

export interface Shot {
  uri: string;
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const BTN = 76;
const EXPAND = 480;
const COLLAPSE = 320;

/* ------------------------------------------------------------- the button */

export function CameraStep({
  shots,
  onOpen,
  onRemove,
  disabled,
  relativeTo,
}: {
  shots: Shot[];
  /** Hands up where the button is inside `relativeTo`, so the camera can grow from it. */
  onOpen: (origin: Rect | null) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  /** The view the camera overlay fills — the frame the origin is measured in. */
  relativeTo?: RefObject<View | null>;
}) {
  const reduced = useReduceMotion();
  const button = useRef<View>(null);
  const tap = useRef(new Animated.Value(0)).current;

  const full = shots.length >= MAX_PHOTOS;

  function press(down: boolean) {
    Animated.timing(tap, {
      toValue: down ? 1 : 0,
      duration: dur(down ? 90 : 180, reduced),
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }

  /*
    Measured against the overlay's own view, at the moment of the press.

    measureLayout rather than measureInWindow because the answer wanted is
    "where is this button inside that view", and asking it directly is one
    measurement instead of two subtracted. Two measurements is also how the
    first version of this got it wrong: react-native-web's measureInWindow
    reported the overlay's top at the bottom of the viewport, and the
    expansion started from a thousand pixels above the screen.

    At the moment of the press, not at layout: the step sits in a scroll
    view, so a position captured earlier would start the swell from
    wherever the button used to be.
  */
  function open() {
    if (full || disabled) return;
    const node = button.current;
    const against = relativeTo?.current;
    if (node == null || against == null) {
      onOpen(null);
      return;
    }
    node.measureLayout(
      against,
      (x, y, width, height) => {
        const ok = [x, y, width, height].every((n) => typeof n === "number" && Number.isFinite(n)) && width > 0;
        onOpen(ok ? { x, y, width, height } : null);
      },
      () => onOpen(null),
    );
  }

  return (
    <View style={{ gap: space.xl, alignItems: "center", paddingTop: space.xl }}>
      <Animated.View
        ref={button}
        style={{
          transform: [
            { scale: tap.interpolate({ inputRange: [0, 1], outputRange: [1, reduced ? 1 : 0.9], extrapolate: "clamp" }) },
          ],
        }}
      >
        <Pressable
          onPress={open}
          onPressIn={() => press(true)}
          onPressOut={() => press(false)}
          disabled={full || disabled}
          accessibilityRole="button"
          accessibilityLabel={full ? "Three photos taken" : "Take a photo"}
          style={({ pressed }) => ({
            width: BTN,
            height: BTN,
            borderRadius: 999,
            backgroundColor: full ? colors.track : colors.signalInk,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          {/*
            The blades turn as it is pressed. An iris is a mechanism, and a
            mechanism that doesn't move when you operate it is a drawing.
          */}
          <Animated.View
            style={{
              transform: [
                {
                  rotate: tap.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", reduced ? "0deg" : "26deg"],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
          >
            <ApertureIcon size={34} color={full ? colors.ink3 : colors.panel} weight={1.9} />
          </Animated.View>
        </Pressable>
      </Animated.View>

      {shots.length === 0 ? (
        <Text style={[type.metaSm, { textAlign: "center" }]}>Up to {MAX_PHOTOS}, kept with this check-in.</Text>
      ) : (
        <View style={{ flexDirection: "row", gap: space.sm, alignSelf: "stretch" }}>
          {shots.map((s, n) => (
            <Thumb key={s.uri} uri={s.uri} index={n} onRemove={() => onRemove(n)} />
          ))}
          {/* Keeps the taken photos at a constant size rather than letting one
              photo stretch to the full width of the step. */}
          {Array.from({ length: MAX_PHOTOS - shots.length }, (_, n) => (
            <View key={`gap${n}`} style={{ flex: 1 }} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ----------------------------------------------------------- the overlay */

/*
  Rendered by the flow, not by the step.

  It has to escape the scroll view the step lives in — anything absolutely
  positioned inside a scroll view is clipped by it, so a full-screen camera
  parented to the step could never be full-screen. The flow's root view is
  the first ancestor that covers the whole modal, so that is where this goes.
*/
export function CameraOverlay({
  visible,
  origin,
  shots,
  onCapture,
  onClose,
}: {
  visible: boolean;
  origin: Rect | null;
  shots: Shot[];
  onCapture: (s: Shot) => void;
  onClose: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  /*
    The overlay's own size, from onLayout.

    onLayout rather than a measure call because it is synchronous and
    arrives with the first layout pass. The first version waited on an
    async measurement instead, which meant the expansion spent its opening
    frames animating toward a width of zero and then snapped to full size
    when the number finally landed — a 250ms stall followed by a cut.

    No offset is needed: the overlay fills the flow's root view, so the
    origin handed up by the step was already measured in these coordinates.
  */
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const camera = useRef<CameraView>(null);
  const root = useRef<View>(null);
  const reduced = useReduceMotion();

  const granted = permission?.granted === true;
  const denied = permission != null && !permission.granted && !permission.canAskAgain;
  const full = shots.length >= MAX_PHOTOS;

  const p = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  // Nothing moves until the overlay knows how big it is — animating to an
  // unknown target is what produced the stall-then-snap.
  const measured = (size?.width ?? 0) > 0;

  useEffect(() => {
    if (!mounted || !measured) return;
    const anim = Animated.timing(p, {
      toValue: visible ? 1 : 0,
      duration: dur(visible ? EXPAND : COLLAPSE, reduced),
      easing: EASE,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      // Unmount only once it has actually shrunk away, so the camera stream
      // is released but the collapse is still seen.
      if (finished && !visible) setMounted(false);
    });
    return () => anim.stop();
  }, [measured, mounted, p, reduced, visible]);

  /* Asked on the way open, and only once the overlay is actually up. */
  useEffect(() => {
    if (!visible || permission == null || permission.granted || !permission.canAskAgain) return;
    let cancelled = false;
    void requestPermission().then((res) => {
      if (!cancelled && !res.granted) onClose();
    });
    return () => {
      cancelled = true;
    };
    // onClose is stable enough here; re-running on identity changes would
    // fire a second permission request mid-prompt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, permission?.granted, permission?.canAskAgain]);

  async function shoot() {
    if (!camera.current || busy || full) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        flash.setValue(1);
        Animated.timing(flash, {
          toValue: 0,
          duration: dur(280, reduced),
          easing: EASE,
          useNativeDriver: false,
        }).start();

        onCapture({ uri: photo.uri, width: photo.width, height: photo.height });
        // Close after the last one: the step resolves itself rather than
        // leaving a live camera running with nothing left to do.
        if (shots.length + 1 >= MAX_PHOTOS) onClose();
      }
    } finally {
      setBusy(false);
    }
  }

  /*
    Where the swell starts.

    The origin is sanity-checked against the overlay's own bounds before it
    is trusted. A measurement that lands outside them is not a button the
    user pressed, it is a measurement that went wrong — and the failure mode
    is severe and silent: the expansion starts off-screen and the camera
    appears to teleport in. Growing from the centre is a worse animation and
    a much better wrong answer.
  */
  const W = size?.width ?? 0;
  const H = size?.height ?? 0;
  const fromW = origin?.width ?? BTN;
  const sane =
    origin != null &&
    W > 0 &&
    origin.x > -fromW &&
    origin.y > -fromW &&
    origin.x < W &&
    origin.y < H;
  const from = {
    x: sane ? (origin as Rect).x : (W - fromW) / 2,
    y: sane ? (origin as Rect).y : (H - fromW) / 2,
    size: fromW,
  };

  const i = (a: number, b: number) => p.interpolate({ inputRange: [0, 1], outputRange: [a, b], extrapolate: "clamp" });
  const deg = (a: string, b: string) =>
    p.interpolate({ inputRange: [0, 1], outputRange: [a, b], extrapolate: "clamp" });
  const late = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1], extrapolate: "clamp" });

  return (
    /*
      The shell stays mounted; only its contents come and go.

      It has to be laid out before the first press so that its size is
      already known when the expansion starts. It costs one empty
      absolutely-positioned view and it takes no touches while closed.
    */
    <View
      ref={root}
      style={StyleSheet.absoluteFillObject}
      pointerEvents={mounted && visible ? "auto" : "none"}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      {!mounted ? null : (
        <>
      {/* The flow behind it dims rather than disappearing, so the camera
          reads as something on top of the step and not as a new screen. */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.ink, opacity: i(0, 0.55) }]}
        pointerEvents="none"
      />

      <Animated.View
        style={{
          position: "absolute",
          left: i(from.x, 0),
          top: i(from.y, 0),
          width: i(from.size, W),
          height: i(from.size, H),
          borderRadius: i(999, 0),
          overflow: "hidden",
          backgroundColor: colors.ink,
        }}
      >
        {W > 0 && granted && (
          <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: late }]}>
            <CameraView ref={camera} style={{ flex: 1 }} facing="back" />
          </Animated.View>
        )}

        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "#FFFFFF", opacity: flash }]}
        />

        {/*
          The aperture carries through the swell and hands off to the
          viewfinder. Without it the button appears to vanish the instant it
          is pressed and a black rectangle appears instead.
        */}
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            alignItems: "center",
            justifyContent: "center",
            opacity: p.interpolate({ inputRange: [0, 0.18, 0.6], outputRange: [1, 1, 0], extrapolate: "clamp" }),
          }}
        >
          <Animated.View
            style={{
              transform: [
                { rotate: deg("26deg", "90deg") },
                { scale: i(1, 2.4) },
              ],
            }}
          >
            <ApertureIcon size={34} color={colors.panel} weight={1.9} />
          </Animated.View>
        </Animated.View>

        {/* --------------------------------------------------- the furniture */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            paddingTop: 54,
            paddingHorizontal: space.xl,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: late,
          }}
        >
          <Text style={{ fontFamily: font.numeralMedium, fontSize: 14, color: colors.panel }}>
            {shots.length}/{MAX_PHOTOS}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close the camera"
            hitSlop={16}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, minHeight: 44, justifyContent: "center" })}
          >
            <Text style={{ fontFamily: font.semibold, fontSize: 15, color: colors.panel }}>Done</Text>
          </Pressable>
        </Animated.View>

        {!granted && (
          <Animated.View
            pointerEvents="none"
            style={{
              ...StyleSheet.absoluteFillObject,
              alignItems: "center",
              justifyContent: "center",
              opacity: late,
            }}
          >
            {/* An open black frame with a dead shutter is a broken camera.
                This says which it is. */}
            <Text style={{ fontFamily: font.medium, fontSize: 14, color: colors.hairline }}>
              {denied ? "Camera access is off" : "Waiting for camera access…"}
            </Text>
          </Animated.View>
        )}

        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingBottom: 44,
            paddingHorizontal: space.xl,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: late,
          }}
        >
          {/* The last shot, where every camera since 2007 has put it. */}
          <View style={{ width: 52, height: 52 }}>
            {shots.length > 0 && (
              <Image
                source={{ uri: shots[shots.length - 1].uri }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.panel,
                }}
              />
            )}
          </View>

          <Pressable
            onPress={shoot}
            disabled={busy || full || !granted}
            accessibilityRole="button"
            accessibilityLabel={`Take photo ${shots.length + 1} of ${MAX_PHOTOS}`}
            style={({ pressed }) => ({
              width: 76,
              height: 76,
              borderRadius: 999,
              borderWidth: 3,
              borderColor: colors.panel,
              alignItems: "center",
              justifyContent: "center",
              opacity: !granted ? 0.4 : pressed ? 0.7 : 1,
            })}
          >
            {busy ? (
              <ActivityIndicator color={colors.panel} />
            ) : (
              <View style={{ width: 62, height: 62, borderRadius: 999, backgroundColor: colors.panel }} />
            )}
          </Pressable>

          {/* Balances the thumbnail so the shutter stays on the centre line. */}
          <View style={{ width: 52 }} />
        </Animated.View>
      </Animated.View>
        </>
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
