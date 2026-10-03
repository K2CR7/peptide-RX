import type { ReactNode } from "react";
import { Platform, useWindowDimensions, View } from "react-native";

const FRAME_W = 430;
const FRAME_MAX_H = 932;
const FRAME_VH = 0.92;

/**
 * React Native's Modal renders through a portal at the document root, so on
 * web a sheet escapes the dev phone frame and fills the whole browser window —
 * wrong width and wrong height, which misrepresents every layout being judged.
 *
 * This puts a modal back inside a phone-shaped box matching WebPhoneFrame in
 * App.tsx. It has to be a component rather than a style object because the
 * height depends on the viewport. On native it is a plain flex container, so
 * device behavior is untouched.
 */
export function PhoneModalFrame({
  children,
  backgroundColor,
}: {
  children: ReactNode;
  backgroundColor?: string;
}) {
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== "web") {
    return <View style={{ flex: 1, backgroundColor }}>{children}</View>;
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: Math.min(width, FRAME_W),
          height: Math.min(Math.round(height * FRAME_VH), FRAME_MAX_H),
          borderRadius: 34,
          overflow: "hidden",
          backgroundColor,
        }}
      >
        {children}
      </View>
    </View>
  );
}
