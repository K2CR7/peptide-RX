import { Platform, type ViewStyle } from "react-native";

/**
 * React Native's Modal renders through a portal at the document root, so on
 * web it escapes the dev phone frame and stretches across the whole browser
 * window — which makes every sheet look far wider than it will on a device.
 * These styles pin modal content back to phone width on web only; on native
 * they are empty, because there the screen already is the phone.
 */

/** For a sheet laid out by its parent (flex child). */
export const phoneSheet: ViewStyle =
  Platform.OS === "web" ? { width: "100%", maxWidth: 430 } : {};

/** For a sheet positioned absolutely across the viewport. */
export const phoneSheetAbsolute: ViewStyle =
  Platform.OS === "web" ? { maxWidth: 430, marginLeft: "auto", marginRight: "auto" } : {};
