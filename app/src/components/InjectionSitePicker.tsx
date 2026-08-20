import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { getNextSite, getRouteKey, INJECT_STEPS, ROUTE_SITES } from "../lib/injectionSites";
import { colors, font, radii, type } from "../theme";

interface Props {
  visible: boolean;
  route: string | null;
  history: string[]; // recent site ids used for this stack item, most-recent last
  onClose: () => void;
  onConfirm: (site: string | null) => void;
}

/**
 * List-based version of the old SVG body-diagram picker — same rotation
 * logic (getNextSite), simpler visual for the first cut. Swap in a real body
 * diagram (react-native-svg) later without touching the rotation algorithm.
 */
export function InjectionSitePicker({ visible, route, history, onClose, onConfirm }: Props) {
  const routeKey = useMemo(() => getRouteKey(route), [route]);
  const sites = ROUTE_SITES[routeKey];
  const steps = INJECT_STEPS[routeKey];
  const recommended = useMemo(() => getNextSite(routeKey, history), [routeKey, history]);
  const [selected, setSelected] = useState<string | null>(recommended?.id ?? null);
  const [phase, setPhase] = useState<"site" | "guide">("site");
  const [step, setStep] = useState(0);

  const hasSites = sites.length > 0;

  function reset() {
    setPhase("site");
    setStep(0);
    setSelected(recommended?.id ?? null);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(4,6,8,0.7)" }}>
        <View
          style={{
            backgroundColor: colors.panel,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: colors.hairline2,
            maxHeight: "85%",
            padding: 20,
          }}
        >
          {phase === "site" && hasSites && (
            <>
              <Text style={[type.heading, { fontSize: 18, marginBottom: 12 }]}>Choose injection site</Text>
              {recommended && (
                <View
                  style={{
                    backgroundColor: colors.signalFaint,
                    borderColor: colors.signalDim,
                    borderWidth: 1,
                    borderRadius: radii.md,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontFamily: font.bold, color: colors.signal, fontSize: 13 }}>
                    Recommended next: {recommended.label}
                  </Text>
                  <Text style={[type.body, { fontSize: 12, lineHeight: 17, marginTop: 3 }]}>
                    Rotating sites reduces irritation and lipohypertrophy.
                  </Text>
                </View>
              )}
              <ScrollView style={{ maxHeight: 320 }}>
                {sites.map((site) => {
                  const isSel = selected === site.id;
                  const usedCount = history.filter((h) => h === site.id).length;
                  return (
                    <Pressable
                      key={site.id}
                      onPress={() => setSelected(site.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 13,
                        borderRadius: radii.md,
                        borderWidth: 1,
                        borderColor: isSel ? colors.signal : colors.hairline,
                        backgroundColor: isSel ? colors.signalFaint : colors.panelRaised,
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: font.semibold, fontSize: 14.5, color: colors.ink }}>{site.label}</Text>
                        <Text style={[type.meta, { fontSize: 12, marginTop: 1 }]}>{site.desc}</Text>
                      </View>
                      {usedCount > 0 && (
                        <Text style={{ fontFamily: font.numeralMedium, fontSize: 13, color: colors.ink3 }}>
                          {usedCount}×
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                onPress={() => setPhase("guide")}
                style={({ pressed }) => ({
                  backgroundColor: colors.signal,
                  borderRadius: radii.md,
                  padding: 15,
                  alignItems: "center",
                  marginTop: 12,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.onSignal, letterSpacing: 0.3 }}>
                  How to inject here
                </Text>
              </Pressable>
            </>
          )}

          {phase === "site" && !hasSites && (
            <>
              <Text style={[type.heading, { fontSize: 18, marginBottom: 12 }]}>
                {routeKey === "Oral" ? "Oral — no injection needed" : "Nasal spray"}
              </Text>
              <Pressable
                onPress={() => setPhase("guide")}
                style={({ pressed }) => ({
                  backgroundColor: colors.signal,
                  borderRadius: radii.md,
                  padding: 15,
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.onSignal, letterSpacing: 0.3 }}>
                  See instructions
                </Text>
              </Pressable>
            </>
          )}

          {phase === "guide" && (
            <>
              <Text style={[type.label, { marginBottom: 8 }]}>
                Step {step + 1} of {steps.length}
              </Text>
              <View
                style={{
                  backgroundColor: colors.panelRaised,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  padding: 24,
                  alignItems: "center",
                  marginBottom: 16,
                  minHeight: 160,
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 40, marginBottom: 12 }}>{steps[step].icon}</Text>
                <Text style={[type.heading, { fontSize: 17, marginBottom: 8, textAlign: "center" }]}>{steps[step].title}</Text>
                <Text style={[type.body, { textAlign: "center" }]}>{steps[step].body}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {step > 0 && (
                  <Pressable
                    onPress={() => setStep((s) => s - 1)}
                    style={({ pressed }) => ({
                      borderWidth: 1,
                      borderColor: colors.hairline2,
                      borderRadius: radii.md,
                      padding: 14,
                      paddingHorizontal: 20,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontFamily: font.semibold, color: colors.ink2, fontSize: 14 }}>Back</Text>
                  </Pressable>
                )}
                {step < steps.length - 1 ? (
                  <Pressable
                    onPress={() => setStep((s) => s + 1)}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: colors.signal,
                      borderRadius: radii.md,
                      padding: 14,
                      alignItems: "center",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontFamily: font.bold, fontSize: 14.5, color: colors.onSignal, letterSpacing: 0.3 }}>
                      Next step
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => { const s = selected; reset(); onConfirm(s); }}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: colors.signal,
                      borderRadius: radii.md,
                      padding: 14,
                      alignItems: "center",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontFamily: font.bold, fontSize: 14.5, color: colors.onSignal, letterSpacing: 0.3 }}>
                      Confirm logged
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          <Pressable onPress={() => { reset(); onClose(); }} style={{ alignItems: "center", marginTop: 14, padding: 4 }}>
            <Text style={[type.meta, { fontSize: 14 }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
