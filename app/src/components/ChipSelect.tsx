import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { colors, font, radii } from "../theme";

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  customPlaceholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
}

/**
 * Chip picker with a "Custom" escape hatch. The app has no dosing engine
 * anymore — every value here is exactly what the user typed — so presets
 * exist to cut down on typos (extra zero, wrong unit spelling, etc.), not to
 * restrict what someone can actually log.
 */
export function ChipSelect({ options, value, onChange, customPlaceholder, keyboardType = "default" }: Props) {
  const isPreset = options.includes(value);
  const [customMode, setCustomMode] = useState(!isPreset && value !== "");

  // Re-sync when `value` changes from outside (e.g. autofilled from a
  // peptide-reference suggestion) rather than from a tap in this component —
  // otherwise a non-preset value set externally could land with no chip
  // highlighted and no text input shown to edit it.
  useEffect(() => {
    if (!isPreset && value !== "") setCustomMode(true);
    else if (isPreset) setCustomMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const chipStyle = (on: boolean) => ({
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: on ? colors.signal : colors.hairline2,
    backgroundColor: on ? colors.signalFaint : "transparent",
  });

  const chipText = (on: boolean) => ({
    fontFamily: font.semibold,
    color: on ? colors.signal : colors.ink2,
    fontSize: 13,
  });

  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const on = !customMode && value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => {
                setCustomMode(false);
                onChange(opt);
              }}
              style={chipStyle(on)}
            >
              <Text style={chipText(on)}>{opt}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => {
            setCustomMode(true);
            if (isPreset) onChange("");
          }}
          style={chipStyle(customMode)}
        >
          <Text style={chipText(customMode)}>Custom</Text>
        </Pressable>
      </View>
      {customMode && (
        <TextInput
          placeholder={customPlaceholder}
          placeholderTextColor={colors.ink3}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          autoFocus
          style={{
            marginTop: 8,
            backgroundColor: colors.panel,
            borderWidth: 1,
            borderColor: colors.hairline2,
            borderRadius: radii.md,
            padding: 13,
            fontFamily: font.regular,
            fontSize: 15,
            color: colors.ink,
          }}
        />
      )}
    </View>
  );
}
