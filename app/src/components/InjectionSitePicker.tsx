import { type ReactElement, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { BodyDiagram } from "./BodyDiagram";
import {
  StepAspirate, StepDispose, StepMuscle, StepNeedle, StepNose, StepNote,
  StepPill, StepPress, StepSwab, StepTimer, StepWash,
} from "./icons";
import {
  type BodyView, getNextSite, getRouteKey, INJECT_STEPS, ROUTE_SITES, type StepMark,
} from "../lib/injectionSites";
import { colors, font, radii, type } from "../theme";

const STEP_ICONS: Record<StepMark, (p: { size?: number; color: string }) => ReactElement> = {
  wash: StepWash,
  swab: StepSwab,
  needle: StepNeedle,
  timer: StepTimer,
  press: StepPress,
  dispose: StepDispose,
  muscle: StepMuscle,
  aspirate: StepAspirate,
  nose: StepNose,
  pill: StepPill,
  note: StepNote,
};

interface Props {
  visible: boolean;
  route: string | null;
  history: string[]; // recent site ids used for this stack item, most-recent last
  onClose: () => void;
  onConfirm: (site: string | null) => void;
}

/**
 * Pin a site and confirm — that is the whole required path. The step-by-step
 * guide is reference material behind a link, not a gate: someone logging their
 * hundredth injection should not have to page through six screens to do it.
 */
export function InjectionSitePicker({ visible, route, history, onClose, onConfirm }: Props) {
  const routeKey = useMemo(() => getRouteKey(route), [route]);
  const sites = ROUTE_SITES[routeKey];
  const steps = INJECT_STEPS[routeKey];
  const recommended = useMemo(() => getNextSite(routeKey, history), [routeKey, history]);

  const [selected, setSelected] = useState<string | null>(recommended?.id ?? null);
  const [view, setView] = useState<BodyView>(recommended?.view ?? "front");
  const [showGuide, setShowGuide] = useState(false);
  const [step, setStep] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [touched, setTouched] = useState(false);

  // Injection history arrives a tick after mount, so the first recommendation
  // is computed against an empty history and can land on a site the user just
  // used. Re-sync until they pick one themselves.
  useEffect(() => {
    if (touched || !recommended) return;
    setSelected(recommended.id);
    setView(recommended.view);
  }, [recommended, touched]);

  const hasSites = sites.length > 0;
  const hasBack = sites.some((s) => s.view === "back");

  const usage = useMemo(() => {
    const counts: Record<string, number> = {};
    // Only the last full rotation matters — older history should not keep a
    // site flagged forever.
    history.slice(-sites.length).forEach((id) => {
      counts[id] = (counts[id] ?? 0) + 1;
    });
    return counts;
  }, [history, sites.length]);

  const selectedSite = sites.find((s) => s.id === selected) ?? null;

  function reset() {
    setShowGuide(false);
    setStep(0);
    setShowAll(false);
    setTouched(false);
    setSelected(recommended?.id ?? null);
    setView(recommended?.view ?? "front");
  }

  function handleSelect(id: string) {
    setTouched(true);
    setSelected(id);
    const site = sites.find((s) => s.id === id);
    if (site) setView(site.view);
  }

  function handleConfirm() {
    const chosen = selected;
    reset();
    onConfirm(chosen);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(4,6,8,0.72)" }}>
        <View
          style={{
            backgroundColor: colors.panel,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: colors.hairline2,
            maxHeight: "92%",
            paddingTop: 18,
            paddingHorizontal: 20,
            paddingBottom: 18,
          }}
        >
          {!showGuide && hasSites && (
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={[type.heading, { fontSize: 18 }]}>Pin your site</Text>
                {hasBack && <ViewToggle view={view} onChange={setView} />}
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 6 }}>
                <BodyDiagram
                  view={view}
                  sites={sites}
                  selectedId={selected}
                  recommendedId={recommended?.id ?? null}
                  usage={usage}
                  onSelect={handleSelect}
                  width={186}
                />

                <View
                  style={{
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: selectedSite ? colors.signalDim : colors.hairline,
                    backgroundColor: selectedSite ? colors.signalFaint : colors.panelRaised,
                    borderRadius: radii.md,
                    padding: 13,
                  }}
                >
                  {selectedSite ? (
                    <>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontFamily: font.bold, fontSize: 15.5, color: colors.signal }}>
                          {selectedSite.label}
                        </Text>
                        {selectedSite.id === recommended?.id && (
                          <Text style={[type.label, { fontSize: 10, color: colors.signal }]}>Next up</Text>
                        )}
                      </View>
                      <Text style={[type.body, { fontSize: 13, marginTop: 3 }]}>{selectedSite.desc}</Text>
                      {(usage[selectedSite.id] ?? 0) > 0 && (
                        <Text style={{ fontFamily: font.medium, fontSize: 12.5, color: colors.amber, marginTop: 6 }}>
                          Used {usage[selectedSite.id]}× recently — rotating reduces irritation and lipohypertrophy.
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={type.body}>Tap a site on the diagram to pin it.</Text>
                  )}
                </View>

                <Pressable
                  onPress={() => setShowAll((v) => !v)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: colors.ink2 }}>
                    {showAll ? "Hide site list" : "Choose from a list instead"}
                  </Text>
                </Pressable>

                {showAll && (
                  <View style={{ borderWidth: 1, borderColor: colors.hairline, borderRadius: radii.md, overflow: "hidden" }}>
                    {sites.map((site, i) => {
                      const isSel = selected === site.id;
                      const used = usage[site.id] ?? 0;
                      return (
                        <Pressable
                          key={site.id}
                          onPress={() => handleSelect(site.id)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSel }}
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            minHeight: 52,
                            paddingVertical: 10,
                            paddingHorizontal: 13,
                            borderTopWidth: i === 0 ? 0 : 1,
                            borderTopColor: colors.hairline,
                            backgroundColor: isSel ? colors.signalFaint : "transparent",
                            opacity: pressed ? 0.72 : 1,
                          })}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontFamily: font.semibold,
                                fontSize: 14.5,
                                color: isSel ? colors.signal : colors.ink,
                              }}
                            >
                              {site.label}
                            </Text>
                            <Text style={[type.meta, { fontSize: 12, marginTop: 1 }]}>{site.desc}</Text>
                          </View>
                          {used > 0 && (
                            <Text style={{ fontFamily: font.numeralMedium, fontSize: 13, color: colors.amber }}>
                              {used}×
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>

              <Pressable
                onPress={handleConfirm}
                disabled={!selected}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: selected ? colors.signal : colors.panelRaised,
                  borderRadius: radii.md,
                  minHeight: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 14,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: font.bold,
                    fontSize: 15,
                    letterSpacing: 0.3,
                    color: selected ? colors.onSignal : colors.ink3,
                  }}
                >
                  {selectedSite ? `Confirm pin · ${selectedSite.short}` : "Pick a site"}
                </Text>
              </Pressable>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                <Pressable
                  onPress={() => { setStep(0); setShowGuide(true); }}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", paddingRight: 12, opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: colors.ink2 }}>
                    How to inject
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { reset(); onClose(); }}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", paddingLeft: 12, opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={[type.meta, { fontSize: 13.5 }]}>Cancel</Text>
                </Pressable>
              </View>
            </>
          )}

          {!showGuide && !hasSites && (
            <>
              <Text style={[type.heading, { fontSize: 18 }]}>
                {routeKey === "Oral" ? "Oral — no injection site" : "Nasal spray — no injection site"}
              </Text>
              <Text style={[type.body, { marginTop: 6 }]}>
                Nothing to pin for this route. Confirm to log today's dose.
              </Text>

              <Pressable
                onPress={() => { reset(); onConfirm(null); }}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: colors.signal,
                  borderRadius: radii.md,
                  minHeight: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 16,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.onSignal, letterSpacing: 0.3 }}>
                  Confirm dose
                </Text>
              </Pressable>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                <Pressable
                  onPress={() => { setStep(0); setShowGuide(true); }}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", paddingRight: 12, opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: colors.ink2 }}>Instructions</Text>
                </Pressable>
                <Pressable
                  onPress={() => { reset(); onClose(); }}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", paddingLeft: 12, opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={[type.meta, { fontSize: 13.5 }]}>Cancel</Text>
                </Pressable>
              </View>
            </>
          )}

          {showGuide && (
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={type.label}>Step {step + 1} of {steps.length}</Text>
                <Pressable
                  onPress={() => setShowGuide(false)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", paddingLeft: 12, opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: colors.signal }}>Done</Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: "row", gap: 4, marginTop: 8, marginBottom: 14 }}>
                {steps.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 2.5,
                      borderRadius: 2,
                      backgroundColor: i <= step ? colors.signal : colors.hairline2,
                    }}
                  />
                ))}
              </View>

              <View
                style={{
                  backgroundColor: colors.panelRaised,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  padding: 24,
                  alignItems: "center",
                  marginBottom: 16,
                  minHeight: 190,
                  justifyContent: "center",
                }}
              >
                <View style={{ marginBottom: 14 }}>
                  {STEP_ICONS[steps[step].mark]({ size: 38, color: colors.signal })}
                </View>
                <Text style={[type.heading, { fontSize: 17, marginBottom: 8, textAlign: "center" }]}>
                  {steps[step].title}
                </Text>
                <Text style={[type.body, { textAlign: "center" }]}>{steps[step].body}</Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                {step > 0 && (
                  <Pressable
                    onPress={() => setStep((s) => s - 1)}
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                      borderWidth: 1,
                      borderColor: colors.hairline2,
                      borderRadius: radii.md,
                      minHeight: 48,
                      paddingHorizontal: 22,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontFamily: font.semibold, color: colors.ink2, fontSize: 14 }}>Back</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => (step < steps.length - 1 ? setStep((s) => s + 1) : setShowGuide(false))}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: colors.signal,
                    borderRadius: radii.md,
                    minHeight: 48,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontFamily: font.bold, fontSize: 14.5, color: colors.onSignal, letterSpacing: 0.3 }}>
                    {step < steps.length - 1 ? "Next step" : "Back to pinning"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ViewToggle({ view, onChange }: { view: BodyView; onChange: (v: BodyView) => void }) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderWidth: 1,
        borderColor: colors.hairline2,
        borderRadius: radii.md,
        overflow: "hidden",
      }}
    >
      {(["front", "back"] as const).map((v) => {
        const on = view === v;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => ({
              minHeight: 36,
              paddingHorizontal: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on ? colors.signalFaint : "transparent",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: font.semibold,
                fontSize: 12.5,
                color: on ? colors.signal : colors.ink3,
                textTransform: "capitalize",
              }}
            >
              {v}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
