/*
The shared layer the app was missing.

Before this file, 12 primary buttons, 6 error lines and a dozen stat pairs were
hand-assembled in 11 different screens, each re-deciding its own sizes, radius
and press behaviour. That — not the palette or the concept — is what made the
UI read as assembled rather than built. Anything repeated across screens
belongs here so it can only be decided once.

Nothing here changes the established world: same ground, same hairlines, same
signal green, same numerals. It only stops each screen reinventing them.
*/
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from "react-native";
import { HIT, colors, radii, space, type } from "../theme";

/* ---------------------------------------------------------------- Button */

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger" | "dangerSolid";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Copy shown while `loading` — defaults to the resting label. */
  loadingLabel?: string;
  icon?: ReactNode;
  size?: "md" | "sm";
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * Disabled and pressed must never look alike. Several screens previously
 * expressed both as `opacity: 0.7` on a fully saturated green, so a dead
 * button and a button mid-tap were indistinguishable. Disabled drops to the
 * raised panel with dim ink; pressed keeps the colour and dips opacity.
 */
export function Button({
  label, onPress, variant = "primary", disabled = false, loading = false,
  loadingLabel, icon, size = "md", style, accessibilityLabel,
}: ButtonProps) {
  const inert = disabled || loading;

  const fill: Record<ButtonVariant, string> = {
    primary: colors.signal,
    secondary: "transparent",
    quiet: "transparent",
    danger: colors.redFaint,
    dangerSolid: colors.red,
  };
  const ink: Record<ButtonVariant, string> = {
    primary: colors.onSignal,
    secondary: colors.ink,
    quiet: colors.ink2,
    danger: colors.red,
    dangerSolid: colors.bg,
  };
  const edge: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: colors.hairline2,
    quiet: undefined,
    danger: colors.red,
    dangerSolid: colors.red,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: space.sm,
        minHeight: size === "sm" ? HIT : 48,
        paddingHorizontal: size === "sm" ? space.lg : space.xl,
        borderRadius: radii.md,
        backgroundColor: inert ? colors.panelRaised : fill[variant],
        borderWidth: edge[variant] ? 1 : 0,
        borderColor: inert ? colors.hairline : edge[variant],
        opacity: pressed ? 0.7 : 1,
        ...style,
      })}
    >
      {loading && <ActivityIndicator size="small" color={inert ? colors.ink3 : ink[variant]} />}
      {!loading && icon}
      <Text
        style={[
          size === "sm" ? type.buttonSm : type.button,
          { color: inert ? colors.ink3 : ink[variant] },
        ]}
      >
        {loading ? (loadingLabel ?? label) : label}
      </Text>
    </Pressable>
  );
}

/* ----------------------------------------------------------------- Panel */

/**
 * The panel as a component rather than a style object, so padding and radius
 * stop being re-specified at every call site. `tone` tints the whole surface
 * for the one case that earns it: the completed state.
 */
export function Panel({
  children, pad = space.lg, tone, style,
}: {
  children: ReactNode;
  pad?: number;
  tone?: "signal" | "amber";
  style?: ViewStyle;
}) {
  const tinted = tone === "signal"
    ? { backgroundColor: colors.signalFaint, borderColor: colors.signalDim }
    : tone === "amber"
      ? { backgroundColor: colors.amberFaint, borderColor: colors.amber }
      : { backgroundColor: colors.panel, borderColor: colors.hairline };

  return (
    <View
      style={{
        borderWidth: 1,
        borderRadius: radii.xl,
        padding: pad,
        ...tinted,
        ...style,
      }}
    >
      {children}
    </View>
  );
}

/* ---------------------------------------------------------- SectionLabel */

/**
 * The tracked uppercase label that heads each block of the readout. These are
 * load-bearing on an instrument panel — they are how you scan it — so they
 * stay, and they stay identical everywhere.
 */
export function SectionLabel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <Text style={[type.label, style]}>{children}</Text>;
}

/* -------------------------------------------------------------- StatPair */

/**
 * A measured value and what it measures. Previously rebuilt by hand in the
 * check-in stats, the macro pills and the stack rows, each with its own sizes.
 */
export function StatPair({
  value, unit, caption, tone = "ink", size = "md",
}: {
  value: string | number;
  unit?: string;
  caption?: string;
  tone?: "ink" | "signal" | "amber" | "red" | "dim";
  size?: "lg" | "md" | "sm";
}) {
  const color = {
    ink: colors.ink, signal: colors.signal, amber: colors.amber,
    red: colors.red, dim: colors.ink3,
  }[tone];
  const valueStyle = size === "lg" ? type.statLg : size === "md" ? type.statMd : type.statSm;

  return (
    <View>
      <Text style={[valueStyle, { color }]}>
        {value}
        {unit ? <Text style={[type.metaSm, { color: colors.ink3 }]}> {unit}</Text> : null}
      </Text>
      {caption ? <Text style={[type.metaSm, { marginTop: 2 }]}>{caption}</Text> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Chip */

/** Selectable pill. One implementation for the day toggles, macro priorities and profile chips. */
export function Chip({
  label, selected, onPress, tone = "signal", fullWidth,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: "signal" | "trace";
  fullWidth?: boolean;
}) {
  const accent = tone === "trace" ? colors.trace : colors.signal;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: HIT,
        justifyContent: "center",
        paddingHorizontal: space.lg,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: selected ? accent : colors.hairline2,
        backgroundColor: selected ? colors.signalFaint : "transparent",
        width: fullWidth ? "100%" : undefined,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={[type.buttonSm, { color: selected ? accent : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------- ErrorText */

/** One error voice. This exact block was re-typed in six files. */
export function ErrorText({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  if (!children) return null;
  return (
    <Text accessibilityRole="alert" style={[type.error, style]}>
      {children}
    </Text>
  );
}

/* ----------------------------------------------------------- Async state */

/**
 * Loading, failure and emptiness for a data block, in that order of truth.
 *
 * This ordering matters more than it looks: several screens previously read
 * only `data` and rendered their empty copy while the request was still in
 * flight, so an offline user with a full stack was told their stack was empty.
 * An empty state is a claim about the data, and it must not be made before the
 * data has arrived.
 */
export function AsyncBlock({
  loading, error, isEmpty, emptyText, onRetry, children,
}: {
  loading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <View style={{ paddingVertical: space.xl, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.ink3} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ gap: space.md }}>
        <ErrorText>Couldn't load this. Check your connection and try again.</ErrorText>
        {onRetry && <Button label="Retry" variant="secondary" size="sm" onPress={onRetry} />}
      </View>
    );
  }
  if (isEmpty) {
    return <Text style={type.body}>{emptyText}</Text>;
  }
  return <>{children}</>;
}
