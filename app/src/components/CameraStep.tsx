/*
The camera step.

An in-app camera rather than the system picker. expo-image-picker's
launchCameraAsync hands control to a full-screen OS activity, which is the
opposite of fluid: the app disappears, something else appears, and three
photos means three round trips out of the flow and back. expo-camera renders
a preview inside the step, so taking three shots never leaves the screen.

Permission is asked for at the moment the step is reached, not at launch. A
camera prompt on first open, before the user has seen what the app does, is
the single most reliable way to get a permanent denial.

The step is optional and says so. Progress photos are the most personal thing
this app stores, and the flow has to be completable — comfortably — by
someone who never wants to take one.
*/
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Platform, Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { EASE, dur, useReduceMotion } from "./motion";
import { colors, font, radii, space, type } from "../theme";

export const MAX_PHOTOS = 3;

export interface Shot {
  uri: string;
  width: number;
  height: number;
}

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

  /* The preview grows in rather than appearing. */
  const open = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(open, {
      toValue: live ? 1 : 0,
      duration: dur(300, reduced),
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
      open.setValue(live ? 1 : 0);
    };
  }, [live, open, reduced]);

  async function start() {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setLive(true);
  }

  async function shoot() {
    if (!camera.current || busy || full) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        onCapture({ uri: photo.uri, width: photo.width, height: photo.height });
        // Close after the last one, so the step resolves itself rather than
        // leaving a live camera running with nothing left to do.
        if (shots.length + 1 >= MAX_PHOTOS) setLive(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const denied = permission != null && !permission.granted && !permission.canAskAgain;

  return (
    <View style={{ gap: space.lg }}>
      {live ? (
        <Animated.View
          style={{
            opacity: open,
            transform: [
              { scale: open.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 0.96, 1], extrapolate: "clamp" }) },
            ],
          }}
        >
          <View
            style={{
              height: 300,
              borderRadius: radii.xl,
              overflow: "hidden",
              backgroundColor: colors.ink,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <CameraView ref={camera} style={{ flex: 1 }} facing="back" />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xl, marginTop: space.lg }}>
            <Pressable
              onPress={() => setLive(false)}
              accessibilityRole="button"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, minHeight: 44, justifyContent: "center" })}
            >
              <Text style={{ fontFamily: font.semibold, fontSize: 14, color: colors.ink2 }}>Done</Text>
            </Pressable>

            {/* The shutter. Big, round, and the only filled thing on screen. */}
            <Pressable
              onPress={shoot}
              disabled={busy || full}
              accessibilityRole="button"
              accessibilityLabel={`Take photo ${shots.length + 1} of ${MAX_PHOTOS}`}
              style={({ pressed }) => ({
                width: 68,
                height: 68,
                borderRadius: 999,
                borderWidth: 3,
                borderColor: colors.signalInk,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {busy ? (
                <ActivityIndicator color={colors.signalInk} />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: colors.signalInk }} />
              )}
            </Pressable>

            <Text style={[type.metaSm, { minWidth: 34 }]}>
              {shots.length}/{MAX_PHOTOS}
            </Text>
          </View>
        </Animated.View>
      ) : (
        <Pressable
          onPress={start}
          disabled={full || denied}
          accessibilityRole="button"
          accessibilityLabel="Open the camera"
          style={({ pressed }) => ({
            height: 160,
            borderRadius: radii.xl,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.edge,
            backgroundColor: colors.panel,
            alignItems: "center",
            justifyContent: "center",
            gap: space.sm,
            opacity: pressed ? 0.75 : full || denied ? 0.6 : 1,
          })}
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
        </Pressable>
      )}

      {shots.length > 0 && (
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {shots.map((s, i) => (
            <View key={s.uri} style={{ flex: 1, gap: 5 }}>
              <Image
                source={{ uri: s.uri }}
                style={{
                  width: "100%",
                  aspectRatio: 3 / 4,
                  borderRadius: radii.lg,
                  backgroundColor: colors.track,
                }}
              />
              <Pressable
                onPress={() => onRemove(i)}
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${i + 1}`}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, minHeight: 32, justifyContent: "center" })}
              >
                <Text style={{ fontFamily: font.medium, fontSize: 12, color: colors.ink3, textAlign: "center" }}>
                  Remove
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {Platform.OS === "web" && !live && shots.length === 0 && (
        <Text style={[type.metaSm, { textAlign: "center" }]}>
          Your browser will ask for camera access.
        </Text>
      )}
    </View>
  );
}
