import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { PhoneModalFrame } from "./PhoneModalFrame";
import { useAskAssistant } from "../lib/queries";
import { colors, font, radii, type } from "../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** What the screen is currently showing, so answers match the numbers on it. */
  context: string;
  /** Drawn from the user's real data, so the openers are answerable. */
  suggestions: string[];
}

export function AssistantSheet({ visible, onClose, context, suggestions }: Props) {
  const ask = useAskAssistant();
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function send(q: string) {
    const text = q.trim();
    if (!text) return;
    setError(null);
    setAsked(text);
    setAnswer(null);
    setQuestion("");
    ask.mutate(
      { question: text, context },
      {
        onSuccess: (r) => setAnswer(r.answer),
        onError: (e) => setError(e instanceof Error ? e.message : "Couldn't get an answer — try again."),
      },
    );
  }

  function reset() {
    setQuestion("");
    setAsked(null);
    setAnswer(null);
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <PhoneModalFrame>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(4,6,8,0.72)" }} onPress={close} />

          <View
            style={{
              backgroundColor: colors.panel,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderColor: colors.hairline2,
              maxHeight: "86%",
              paddingTop: 18,
              paddingHorizontal: 20,
              paddingBottom: 18,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[type.heading, { fontSize: 18 }]}>Ask about your data</Text>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                style={({ pressed }) => ({ minHeight: 44, minWidth: 44, alignItems: "flex-end", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
              >
                <Text style={{ fontFamily: font.semibold, fontSize: 14, color: colors.ink2 }}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={{ marginTop: 14 }} keyboardShouldPersistTaps="handled">
              {asked && (
                <View style={{ gap: 10 }}>
                  <Text style={{ fontFamily: font.semibold, fontSize: 14.5, color: colors.ink2 }}>{asked}</Text>

                  {ask.isPending && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 8 }}>
                      <ActivityIndicator color={colors.signal} />
                      <Text style={[type.meta, { fontSize: 13 }]}>Reading your data…</Text>
                    </View>
                  )}

                  {answer && (
                    <View
                      style={{
                        backgroundColor: colors.panelRaised,
                        borderWidth: 1,
                        borderColor: colors.hairline,
                        borderRadius: radii.md,
                        padding: 14,
                      }}
                    >
                      <Text style={[type.body, { fontSize: 14.5, lineHeight: 21, color: colors.ink }]}>{answer}</Text>
                    </View>
                  )}

                  {error && <Text style={{ fontFamily: font.medium, color: colors.red, fontSize: 13 }}>{error}</Text>}
                </View>
              )}

              {!asked && suggestions.length > 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={[type.label, { fontSize: 10.5 }]}>Try asking</Text>
                  {suggestions.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => send(s)}
                      accessibilityRole="button"
                      style={({ pressed }) => ({
                        minHeight: 48,
                        justifyContent: "center",
                        paddingHorizontal: 14,
                        borderWidth: 1,
                        borderColor: colors.hairline2,
                        borderRadius: radii.md,
                        opacity: pressed ? 0.72 : 1,
                      })}
                    >
                      <Text style={{ fontFamily: font.medium, fontSize: 14, color: colors.ink }}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {asked && !ask.isPending && (
                <Pressable
                  onPress={reset}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", marginTop: 6, opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: colors.ink2 }}>Ask something else</Text>
                </Pressable>
              )}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 9, marginTop: 12 }}>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Ask a question"
                placeholderTextColor={colors.ink3}
                onSubmitEditing={() => send(question)}
                returnKeyType="send"
                style={{
                  flex: 1,
                  backgroundColor: colors.panelRaised,
                  borderWidth: 1,
                  borderColor: colors.hairline2,
                  borderRadius: radii.md,
                  paddingHorizontal: 13,
                  minHeight: 48,
                  fontFamily: font.regular,
                  fontSize: 15,
                  color: colors.ink,
                }}
              />
              <Pressable
                onPress={() => send(question)}
                disabled={!question.trim() || ask.isPending}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  minHeight: 48,
                  paddingHorizontal: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radii.md,
                  backgroundColor: question.trim() ? colors.signal : colors.panelRaised,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: font.bold,
                    fontSize: 14,
                    letterSpacing: 0.3,
                    color: question.trim() ? colors.onSignal : colors.ink3,
                  }}
                >
                  Ask
                </Text>
              </Pressable>
            </View>

            <Text style={[type.meta, { fontSize: 11.5, marginTop: 9 }]}>
              Answers come from your logged data only. It won't advise on doses or anything medical.
            </Text>
          </View>
        </View>
      </PhoneModalFrame>
    </Modal>
  );
}
