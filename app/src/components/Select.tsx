import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CheckMark, ChevronRight } from "./icons";
import { colors, font, radii, type } from "../theme";

interface Props {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Copy for the free-text row, e.g. "Enter a dose". */
  customPlaceholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  /** Optional per-option secondary line in the picker. */
  describe?: (option: string) => string | undefined;
}

const SEARCH_THRESHOLD = 10;

/**
 * A dropdown field: the closed state is one line, the picker opens as a sheet.
 * Presets exist to cut typos, not to restrict what can be logged — there is no
 * dosing engine behind this — so every picker keeps a free-text row.
 */
export function Select({
  label, value, options, onChange, placeholder = "Select", customPlaceholder, keyboardType = "default", describe,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [draft, setDraft] = useState("");

  const isPreset = options.includes(value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  function close() {
    setOpen(false);
    setQuery("");
    setCustomMode(false);
    setDraft("");
  }

  function pick(option: string) {
    onChange(option);
    close();
  }

  function commitCustom() {
    const v = draft.trim();
    if (!v) return;
    onChange(v);
    close();
  }

  return (
    <View>
      <Text style={[type.label, { marginBottom: 7 }]}>{label}</Text>

      <Pressable
        onPress={() => { setOpen(true); setCustomMode(false); setDraft(value && !isPreset ? value : ""); }}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          minHeight: 48,
          paddingHorizontal: 14,
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: value ? colors.hairline2 : colors.hairline,
          borderRadius: radii.md,
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: value ? font.semibold : font.regular,
            fontSize: 15,
            color: value ? colors.ink : colors.ink3,
          }}
        >
          {value || placeholder}
        </Text>
        {value && !isPreset && (
          <Text style={[type.label, { fontSize: 9.5, color: colors.ink3 }]}>Custom</Text>
        )}
        <View style={{ transform: [{ rotate: "90deg" }] }}>
          <ChevronRight size={15} color={colors.ink3} />
        </View>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(4,6,8,0.72)" }} onPress={close} />
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: "80%",
            backgroundColor: colors.panel,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: colors.hairline2,
            paddingTop: 16,
            paddingBottom: 18,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 }}>
            <Text style={[type.heading, { fontSize: 17 }]}>{label}</Text>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              style={({ pressed }) => ({ minHeight: 44, minWidth: 44, alignItems: "flex-end", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={{ fontFamily: font.semibold, fontSize: 14, color: colors.ink2 }}>Close</Text>
            </Pressable>
          </View>

          {options.length >= SEARCH_THRESHOLD && !customMode && (
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor={colors.ink3}
                autoCorrect={false}
                style={{
                  backgroundColor: colors.panelRaised,
                  borderWidth: 1,
                  borderColor: colors.hairline2,
                  borderRadius: radii.md,
                  paddingHorizontal: 13,
                  minHeight: 44,
                  fontFamily: font.regular,
                  fontSize: 15,
                  color: colors.ink,
                }}
              />
            </View>
          )}

          {customMode ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 12 }}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={customPlaceholder ?? `Enter ${label.toLowerCase()}`}
                placeholderTextColor={colors.ink3}
                keyboardType={keyboardType}
                autoFocus
                onSubmitEditing={commitCustom}
                style={{
                  backgroundColor: colors.panelRaised,
                  borderWidth: 1,
                  borderColor: colors.hairline2,
                  borderRadius: radii.md,
                  paddingHorizontal: 13,
                  minHeight: 48,
                  fontFamily: font.regular,
                  fontSize: 16,
                  color: colors.ink,
                }}
              />
              <Pressable
                onPress={commitCustom}
                disabled={!draft.trim()}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: draft.trim() ? colors.signal : colors.panelRaised,
                  borderRadius: radii.md,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: font.bold,
                    fontSize: 15,
                    letterSpacing: 0.3,
                    color: draft.trim() ? colors.onSignal : colors.ink3,
                  }}
                >
                  Use this
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setCustomMode(false)}
                accessibilityRole="button"
                style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
              >
                <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: colors.ink2 }}>Back to list</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView style={{ marginTop: 10 }} keyboardShouldPersistTaps="handled">
              {filtered.length === 0 && (
                <Text style={[type.body, { paddingHorizontal: 20, paddingVertical: 14 }]}>
                  No match for “{query.trim()}”.
                </Text>
              )}

              {filtered.map((opt, i) => {
                const selected = opt === value;
                const sub = describe?.(opt);
                return (
                  <Pressable
                    key={opt}
                    onPress={() => pick(opt)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      minHeight: 50,
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colors.hairline,
                      backgroundColor: selected ? colors.signalFaint : "transparent",
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: selected ? font.bold : font.medium,
                          fontSize: 15,
                          color: selected ? colors.signal : colors.ink,
                        }}
                      >
                        {opt}
                      </Text>
                      {sub && <Text style={[type.meta, { fontSize: 12, marginTop: 1 }]}>{sub}</Text>}
                    </View>
                    {selected && <CheckMark size={14} color={colors.signal} />}
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => setCustomMode(true)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  minHeight: 50,
                  justifyContent: "center",
                  paddingHorizontal: 20,
                  borderTopWidth: 1,
                  borderTopColor: colors.hairline2,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <Text style={{ fontFamily: font.semibold, fontSize: 14.5, color: colors.ink2 }}>
                  {customPlaceholder ?? `Enter ${label.toLowerCase()} manually`}
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
