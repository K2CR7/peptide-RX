/*
Settings.

Lives behind a control on Today rather than taking a tab — five sections is
the iOS ceiling and this is not a daily destination, the same reasoning that
keeps the peptide reference behind a button on Stack.

Three jobs, in descending order of how often they'll be used:
  - edit the medications declared at onboarding, which drive the cautions
  - replay the first-run survey and tour
  - clear tracked data, or sign out

The two destructive actions are deliberately bottom-placed, separated by a
rule, and each needs a second tap. Replaying the tutorial is NOT destructive
and is kept well away from them, because conflating "show me that again" with
"delete my history" is how people lose data they wanted.
*/
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MEDICATION_OPTIONS, isCustomMedication } from "../data/medications";
import { INTERACTION_DISCLAIMER } from "../data/peptideInteractions";
import { useResetAccount, useUpdateProfile } from "../lib/queries";
import { useAuthStore } from "../store/authStore";
import { PhoneModalFrame } from "./PhoneModalFrame";
import { Button, ErrorText, SectionLabel } from "./primitives";
import { CheckMark } from "./icons";
import { HIT, colors, font, radii, space, type } from "../theme";

export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useUpdateProfile();
  const resetAccount = useResetAccount();

  const [meds, setMeds] = useState<string[]>(user?.medications ?? []);
  const [customMed, setCustomMed] = useState("");
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Anything typed in at onboarding that isn't one of the listed classes.
  const customMeds = meds.filter(isCustomMedication);

  function toggleMed(id: string) {
    setSaved(false);
    setMeds((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  }

  async function saveMeds() {
    setError(null);
    const next = customMed.trim() ? [...meds, customMed.trim()] : meds;
    try {
      await updateProfile.mutateAsync({ medications: next });
      setMeds(next);
      setCustomMed("");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that — try again.");
    }
  }

  async function replayFirstRun() {
    setError(null);
    try {
      await resetAccount.mutateAsync({ replayFirstRun: true });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't restart the tutorial — try again.");
    }
  }

  async function wipe() {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }
    setError(null);
    try {
      await resetAccount.mutateAsync({ clearData: true, replayFirstRun: true });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reset — try again.");
      setConfirmWipe(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <PhoneModalFrame backgroundColor={colors.bg}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.xl, paddingTop: 56, paddingBottom: space.section, gap: space.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={type.title}>Settings</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close settings"
              style={({ pressed }) => ({
                minHeight: HIT,
                minWidth: HIT,
                alignItems: "flex-end",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontFamily: font.semibold, fontSize: 15, color: colors.signal }}>Done</Text>
            </Pressable>
          </View>

          {user && <Text style={type.metaSm}>Signed in as {user.email}</Text>}

          {/* ---------------------------------------------------- Medications */}
          <View style={{ gap: space.md }}>
            <SectionLabel>Medications</SectionLabel>
            <Text style={type.bodySm}>
              What you're taking alongside your stack. This is what the cautions on a peptide are
              checked against.
            </Text>

            <View style={{ gap: space.sm }}>
              {MEDICATION_OPTIONS.map((m) => {
                const on = meds.includes(m.id);
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => toggleMed(m.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: space.md,
                      minHeight: 52,
                      paddingHorizontal: space.lg,
                      paddingVertical: space.md,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: on ? colors.signal : colors.hairline2,
                      backgroundColor: on ? colors.signalFaint : colors.panel,
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[type.headingSm, { color: on ? colors.signal : colors.ink }]}>
                        {m.label}
                      </Text>
                      {m.examples && <Text style={[type.metaSm, { marginTop: 2 }]}>{m.examples}</Text>}
                    </View>
                    {on && <CheckMark size={15} color={colors.signal} />}
                  </Pressable>
                );
              })}
            </View>

            {customMeds.length > 0 && (
              <View style={{ gap: space.sm }}>
                <Text style={type.label}>Also added</Text>
                {customMeds.map((c) => (
                  <View
                    key={c}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: space.md,
                      minHeight: HIT,
                      paddingHorizontal: space.lg,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.hairline2,
                      backgroundColor: colors.panel,
                    }}
                  >
                    <Text style={[type.bodySm, { flex: 1, color: colors.ink }]}>{c}</Text>
                    <Pressable
                      onPress={() => toggleMed(c)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${c}`}
                      style={({ pressed }) => ({
                        minHeight: HIT,
                        justifyContent: "center",
                        paddingLeft: space.md,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={[type.meta, { color: colors.red }]}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <TextInput
              value={customMed}
              onChangeText={(v) => { setCustomMed(v); setSaved(false); }}
              placeholder="Add something else you take"
              placeholderTextColor={colors.ink3}
              style={{
                backgroundColor: colors.panel,
                borderWidth: 1,
                borderColor: colors.hairline,
                borderRadius: radii.md,
                paddingHorizontal: space.lg,
                minHeight: HIT,
                fontFamily: font.regular,
                fontSize: 15,
                color: colors.ink,
              }}
            />

            <Text style={[type.metaSm, { lineHeight: 17 }]}>{INTERACTION_DISCLAIMER}</Text>

            <Button
              label={saved ? "Saved" : "Save medications"}
              loadingLabel="Saving…"
              variant={saved ? "secondary" : "primary"}
              onPress={saveMeds}
              loading={updateProfile.isPending}
            />
          </View>

          {/* ------------------------------------------------------- Tutorial */}
          <View style={{ gap: space.md }}>
            <SectionLabel>Tutorial</SectionLabel>
            <Text style={type.bodySm}>
              Run the setup questions and the guided tour again. This doesn't touch anything
              you've logged.
            </Text>
            <Button
              label="Replay the tutorial"
              loadingLabel="Restarting…"
              variant="secondary"
              onPress={replayFirstRun}
              loading={resetAccount.isPending && !confirmWipe}
            />
          </View>

          {/* ------------------------------------------------------- Danger */}
          <View
            style={{
              gap: space.md,
              borderTopWidth: 1,
              borderTopColor: colors.hairline2,
              paddingTop: space.xxl,
            }}
          >
            <SectionLabel>Start over</SectionLabel>
            <Text style={type.bodySm}>
              {confirmWipe
                ? "This permanently deletes every stack item, injection log, check-in and photo on this account, and runs the tutorial again. Your login and profile answers stay. It can't be undone."
                : "Clear everything you've tracked and begin from scratch."}
            </Text>

            <ErrorText>{error}</ErrorText>

            <Button
              label={confirmWipe ? "Yes, delete everything" : "Reset all my data"}
              loadingLabel="Resetting…"
              variant={confirmWipe ? "dangerSolid" : "danger"}
              onPress={wipe}
              loading={resetAccount.isPending && confirmWipe}
            />
            {confirmWipe && (
              <Button label="Keep my data" variant="quiet" onPress={() => setConfirmWipe(false)} />
            )}

            <Button
              label="Sign out"
              variant="quiet"
              onPress={() => {
                void signOut();
                onClose();
              }}
            />
          </View>
        </ScrollView>
      </PhoneModalFrame>
    </Modal>
  );
}
