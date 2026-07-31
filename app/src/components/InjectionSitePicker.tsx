import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { getNextSite, getRouteKey, INJECT_STEPS, ROUTE_SITES } from "../lib/injectionSites";
import { colors, radii } from "../theme";

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
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10,25,25,0.5)" }}>
        <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", padding: 20 }}>
          {phase === "site" && hasSites && (
            <>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 12 }}>Choose injection site</Text>
              {recommended && (
                <View style={{ backgroundColor: colors.tealLight, borderColor: colors.tealMid, borderWidth: 1, borderRadius: radii.md, padding: 12, marginBottom: 12 }}>
                  <Text style={{ color: colors.tealDark, fontWeight: "700", fontSize: 13 }}>Recommended next: {recommended.label}</Text>
                  <Text style={{ color: colors.ink2, fontSize: 12, marginTop: 2 }}>Rotating sites reduces irritation and lipohypertrophy.</Text>
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
                        borderWidth: 1.5,
                        borderColor: isSel ? colors.teal : colors.border,
                        backgroundColor: isSel ? colors.tealLight : colors.white,
                        marginBottom: 8,
                      }}
                    >
                      <View>
                        <Text style={{ fontWeight: "700", color: colors.ink }}>{site.label}</Text>
                        <Text style={{ color: colors.ink3, fontSize: 12 }}>{site.desc}</Text>
                      </View>
                      {usedCount > 0 && <Text style={{ color: colors.ink3, fontSize: 12 }}>used {usedCount}×</Text>}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                onPress={() => setPhase("guide")}
                style={{ backgroundColor: colors.teal, borderRadius: radii.md, padding: 15, alignItems: "center", marginTop: 12 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>How to inject here →</Text>
              </Pressable>
            </>
          )}

          {phase === "site" && !hasSites && (
            <>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 12 }}>
                {routeKey === "Oral" ? "Oral — no injection needed" : "Nasal spray"}
              </Text>
              <Pressable
                onPress={() => setPhase("guide")}
                style={{ backgroundColor: colors.teal, borderRadius: radii.md, padding: 15, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>See instructions →</Text>
              </Pressable>
            </>
          )}

          {phase === "guide" && (
            <>
              <Text style={{ fontSize: 13, color: colors.ink3, marginBottom: 6 }}>
                Step {step + 1} of {steps.length}
              </Text>
              <View style={{ backgroundColor: colors.bg, borderRadius: radii.lg, padding: 24, alignItems: "center", marginBottom: 16, minHeight: 160, justifyContent: "center" }}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>{steps[step].icon}</Text>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 8, textAlign: "center" }}>{steps[step].title}</Text>
                <Text style={{ color: colors.ink2, fontSize: 14, textAlign: "center", lineHeight: 20 }}>{steps[step].body}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {step > 0 && (
                  <Pressable
                    onPress={() => setStep((s) => s - 1)}
                    style={{ borderWidth: 1.5, borderColor: colors.border2, borderRadius: radii.md, padding: 14, paddingHorizontal: 20 }}
                  >
                    <Text style={{ color: colors.ink2, fontWeight: "700" }}>← Back</Text>
                  </Pressable>
                )}
                {step < steps.length - 1 ? (
                  <Pressable
                    onPress={() => setStep((s) => s + 1)}
                    style={{ flex: 1, backgroundColor: colors.teal, borderRadius: radii.md, padding: 14, alignItems: "center" }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Next step →</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => { const s = selected; reset(); onConfirm(s); }}
                    style={{ flex: 1, backgroundColor: colors.teal, borderRadius: radii.md, padding: 14, alignItems: "center" }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>✓ Confirm logged</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          <Pressable onPress={() => { reset(); onClose(); }} style={{ alignItems: "center", marginTop: 14 }}>
            <Text style={{ color: colors.ink3 }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
