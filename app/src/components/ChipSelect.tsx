import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { colors, radii } from "../theme";

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
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: on ? colors.teal : colors.border2,
                backgroundColor: on ? colors.tealLight : colors.white,
              }}
            >
              <Text style={{ color: on ? colors.tealDark : colors.ink2, fontWeight: "600", fontSize: 13 }}>{opt}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => {
            setCustomMode(true);
            if (isPreset) onChange("");
          }}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: customMode ? colors.teal : colors.border2,
            backgroundColor: customMode ? colors.tealLight : colors.white,
          }}
        >
          <Text style={{ color: customMode ? colors.tealDark : colors.ink2, fontWeight: "600", fontSize: 13 }}>Custom</Text>
        </Pressable>
      </View>
      {customMode && (
        <TextInput
          placeholder={customPlaceholder}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          autoFocus
          style={{
            marginTop: 8,
            backgroundColor: colors.white,
            borderWidth: 1.5,
            borderColor: colors.border2,
            borderRadius: radii.md,
            padding: 13,
            fontSize: 15,
            color: colors.ink,
          }}
        />
      )}
    </View>
  );
}
