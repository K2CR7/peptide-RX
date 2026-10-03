import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { PhoneModalFrame } from "./PhoneModalFrame";
import { useAskAssistant } from "../lib/queries";
import { colors, font, radii, type } from "../theme";

interface Turn {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** What the screen is currently showing, so answers match the numbers on it. */
  context: string;
  /** Drawn from the user's real data, so the openers are answerable. */
  suggestions: string[];
}

/** How many prior turns go back to the model — enough for "why?" to resolve. */
const HISTORY_DEPTH = 8;

export function AssistantSheet({ visible, onClose, context, suggestions }: Props) {
  const ask = useAskAssistant();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<ScrollView>(null);

  function send(raw: string) {
    const text = raw.trim();
    if (!text || ask.isPending) return;

    const history = turns.slice(-HISTORY_DEPTH);
    setTurns((t) => [...t, { role: "user", text }]);
    setQuestion("");
    setError(null);

    ask.mutate(
      { question: text, context, history },
      {
        onSuccess: (r) => setTurns((t) => [...t, { role: "assistant", text: r.answer }]),
        onError: (e) =>
          setError(e instanceof Error ? e.message : "Couldn't get an answer — try again."),
      },
    );
  }

  function close() {
    setTurns([]);
    setQuestion("");
    setError(null);
    onClose();
  }

  const empty = turns.length === 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <PhoneModalFrame>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(4,6,8,0.72)" }} onPress={close} />

          {/* Fixed height: the sheet shouldn't jump as answers arrive. */}
          <View
            style={{
              height: "74%",
              backgroundColor: colors.panel,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderColor: colors.hairline2,
              paddingTop: 16,
              paddingBottom: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.hairline,
              }}
            >
              <Text style={[type.heading, { fontSize: 17 }]}>Ask about your data</Text>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  minHeight: 44,
                  minWidth: 44,
                  alignItems: "flex-end",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontFamily: font.semibold, fontSize: 14, color: colors.ink2 }}>Close</Text>
              </Pressable>
            </View>

            <ScrollView
              ref={scroller}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, gap: 12 }}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
            >
              {empty && (
                <View style={{ gap: 8 }}>
                  <Text style={[type.body, { fontSize: 13.5, marginBottom: 2 }]}>
                    Answers come from what you've logged. It won't advise on doses or anything medical.
                  </Text>
                  {suggestions.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => send(s)}
                      accessibilityRole="button"
                      style={({ pressed }) => ({
                        minHeight: 46,
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

              {turns.map((turn, i) =>
                turn.role === "user" ? (
                  <View key={i} style={{ alignSelf: "flex-end", maxWidth: "85%" }}>
                    <View
                      style={{
                        backgroundColor: colors.signalFaint,
                        borderWidth: 1,
                        borderColor: colors.signalDim,
                        borderRadius: radii.lg,
                        borderBottomRightRadius: 4,
                        paddingVertical: 9,
                        paddingHorizontal: 13,
                      }}
                    >
                      <Text style={{ fontFamily: font.medium, fontSize: 14.5, color: colors.ink, lineHeight: 20 }}>
                        {turn.text}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View key={i} style={{ alignSelf: "flex-start", maxWidth: "92%" }}>
                    <Text
                      style={{
                        fontFamily: font.regular,
                        fontSize: 15,
                        lineHeight: 22,
                        color: colors.ink,
                      }}
                    >
                      {turn.text}
                    </Text>
                  </View>
                ),
              )}

              {ask.isPending && (
                <View style={{ alignSelf: "flex-start", flexDirection: "row", gap: 5, paddingVertical: 4 }}>
                  {[0, 1, 2].map((d) => (
                    <View
                      key={d}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.ink3,
                        opacity: 1 - d * 0.28,
                      }}
                    />
                  ))}
                </View>
              )}

              {error && <Text style={{ fontFamily: font.medium, color: colors.red, fontSize: 13 }}>{error}</Text>}
            </ScrollView>

            <View
              style={{
                flexDirection: "row",
                gap: 9,
                paddingHorizontal: 20,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
              }}
            >
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder={empty ? "Ask a question" : "Ask a follow-up"}
                placeholderTextColor={colors.ink3}
                onSubmitEditing={() => send(question)}
                returnKeyType="send"
                blurOnSubmit={false}
                style={{
                  flex: 1,
                  backgroundColor: colors.panelRaised,
                  borderWidth: 1,
                  borderColor: colors.hairline2,
                  borderRadius: radii.md,
                  paddingHorizontal: 13,
                  minHeight: 46,
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
                  minHeight: 46,
                  paddingHorizontal: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radii.md,
                  backgroundColor: question.trim() && !ask.isPending ? colors.signal : colors.panelRaised,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: font.bold,
                    fontSize: 14,
                    letterSpacing: 0.3,
                    color: question.trim() && !ask.isPending ? colors.onSignal : colors.ink3,
                  }}
                >
                  Ask
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </PhoneModalFrame>
    </Modal>
  );
}
