import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { ChipSelect } from "../components/ChipSelect";
import { PlusMark } from "../components/icons";
import { InjectionSitePicker } from "../components/InjectionSitePicker";
import { PEPTIDE_REFERENCE } from "../data/peptideReference";
import {
  type StackItem,
  useCreateStackItem,
  useInjectionLogs,
  useLogInjection,
  useStackItems,
} from "../lib/queries";
import { colors, font, panel, radii, type } from "../theme";

const ROUTE_OPTIONS = ["SubQ", "IM", "SubQ or IM", "Nasal spray", "Oral"];
const UNIT_OPTIONS = ["mcg", "mg", "IU", "mL", "mg/mL"];
const DOSE_OPTIONS = [
  "0.25", "0.5", "1", "2", "2.5", "5", "10", "15", "20", "25",
  "50", "75", "100", "150", "200", "250", "300", "400", "500",
  "600", "750", "1000", "1500", "2000", "2500", "5000", "10000",
];
const FREQUENCY_OPTIONS = [
  "Once daily", "Twice daily", "3x daily",
  "Once weekly", "Twice weekly", "3x weekly",
  "Every other day", "Every 3 days", "As needed",
];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function StackScreen() {
  const { data: items, isLoading } = useStackItems();
  const [addOpen, setAddOpen] = useState(false);
  const [injectFor, setInjectFor] = useState<{ id: string; route: string | null } | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Text style={type.title}>My stack</Text>
          <Pressable
            onPress={() => setAddOpen(true)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.signal,
              borderRadius: radii.md,
              paddingVertical: 9,
              paddingHorizontal: 14,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <PlusMark size={13} color={colors.onSignal} />
            <Text style={{ fontFamily: font.bold, fontSize: 13.5, color: colors.onSignal, letterSpacing: 0.3 }}>Add</Text>
          </Pressable>
        </View>

        {isLoading && <Text style={type.body}>Loading…</Text>}
        {!isLoading && items?.length === 0 && (
          <View style={[panel, { padding: 18 }]}>
            <Text style={type.body}>Nothing in your stack yet. Add what you're already taking.</Text>
          </View>
        )}

        {items?.map((item) => (
          <StackItemCard key={item.id} item={item} onLog={() => setInjectFor({ id: item.id, route: item.route })} />
        ))}
      </ScrollView>

      <AddStackItemModal visible={addOpen} onClose={() => setAddOpen(false)} />

      {injectFor && (
        <InjectionLogger
          stackItemId={injectFor.id}
          route={injectFor.route}
          onClose={() => setInjectFor(null)}
        />
      )}
    </View>
  );
}

function StackItemCard({ item, onLog }: { item: StackItem; onLog: () => void }) {
  return (
    <View style={[panel, { padding: 16 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={type.heading}>{item.peptideName}</Text>
          <Text style={[type.meta, { marginTop: 3 }]}>{item.frequency} · {item.route ?? "—"}</Text>
        </View>
        <Text style={{ fontFamily: font.numeralMedium, fontSize: 22, color: colors.ink, letterSpacing: 0.3 }}>
          {item.dose}
          <Text style={{ fontSize: 13, color: colors.ink3 }}> {item.unit}</Text>
        </Text>
      </View>
      <Pressable
        onPress={onLog}
        style={({ pressed }) => ({
          marginTop: 14,
          borderWidth: 1,
          borderColor: colors.hairline2,
          borderRadius: radii.md,
          padding: 11,
          alignItems: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: colors.signal, letterSpacing: 0.4 }}>
          Log injection
        </Text>
      </Pressable>
    </View>
  );
}

function InjectionLogger({ stackItemId, route, onClose }: { stackItemId: string; route: string | null; onClose: () => void }) {
  const { data: logs } = useInjectionLogs(stackItemId);
  const logInjection = useLogInjection();
  const history = (logs ?? []).map((l) => l.site).reverse();

  return (
    <InjectionSitePicker
      visible
      route={route}
      history={history}
      onClose={onClose}
      onConfirm={(site) => {
        if (site) logInjection.mutate({ stackItemId, site });
        onClose();
      }}
    />
  );
}

function AddStackItemModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const createItem = useCreateStackItem();
  const [peptideName, setPeptideName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("mcg");
  const [frequency, setFrequency] = useState("");
  const [route, setRoute] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: number) {
    setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day].sort()));
  }

  // Picking a known peptide from the reference list autofills the fields
  // below with its typical values — still fully editable, just a starting
  // point. Typing a custom name (something not in our reference data) skips
  // the autofill since we have nothing to fill in from.
  function handlePeptideChange(name: string) {
    setPeptideName(name);
    const ref = PEPTIDE_REFERENCE[name];
    if (ref) {
      setFrequency(ref.frequency);
      setRoute(ref.primaryRoute);
      setDays(ref.typicalScheduleDays);
    }
  }

  function reset() {
    setPeptideName(""); setDose(""); setUnit("mcg"); setFrequency(""); setRoute(""); setDays([]); setError(null);
  }

  async function handleSubmit() {
    setError(null);
    const doseNum = Number(dose);
    if (!peptideName.trim()) return setError("Pick or enter a peptide name.");
    if (!dose || !doseNum) return setError("Pick or enter a dose.");
    if (!frequency.trim()) return setError("Pick or enter a frequency.");
    try {
      await createItem.mutateAsync({
        peptideName: peptideName.trim(),
        dose: doseNum,
        unit,
        frequency: frequency.trim(),
        scheduleDays: days,
        route: route.trim() || null,
        cycleOnDays: null,
        cycleOffDays: null,
      });
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add to stack — try again.");
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32, gap: 10 }}>
        <Text style={[type.title, { marginBottom: 10 }]}>Add to your stack</Text>

        <Text style={type.label}>Peptide</Text>
        <ChipSelect
          options={Object.keys(PEPTIDE_REFERENCE)}
          value={peptideName}
          onChange={handlePeptideChange}
          customPlaceholder="Enter peptide name"
        />

        <Text style={[type.label, { marginTop: 10 }]}>Dose</Text>
        <ChipSelect options={DOSE_OPTIONS} value={dose} onChange={setDose} customPlaceholder="Enter dose" keyboardType="decimal-pad" />

        <Text style={[type.label, { marginTop: 10 }]}>Unit</Text>
        <ChipSelect options={UNIT_OPTIONS} value={unit} onChange={setUnit} customPlaceholder="Enter unit" />

        <Text style={[type.label, { marginTop: 10 }]}>Frequency</Text>
        <ChipSelect options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} customPlaceholder="Enter frequency" />

        <Text style={[type.label, { marginTop: 10 }]}>Route</Text>
        <ChipSelect options={ROUTE_OPTIONS} value={route} onChange={setRoute} customPlaceholder="Enter route" />

        <Text style={[type.label, { marginTop: 10 }]}>Schedule days</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {DAY_LABELS.map((label, i) => {
            const day = i + 1;
            const on = days.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => toggleDay(day)}
                style={{
                  width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center",
                  backgroundColor: on ? colors.signal : colors.panel,
                  borderWidth: 1,
                  borderColor: on ? colors.signal : colors.hairline2,
                }}
              >
                <Text style={{ fontFamily: font.bold, fontSize: 12.5, color: on ? colors.onSignal : colors.ink2 }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {error && <Text style={{ fontFamily: font.medium, color: colors.red, fontSize: 13, marginTop: 8 }}>{error}</Text>}

        <Pressable
          onPress={handleSubmit}
          disabled={createItem.isPending}
          style={({ pressed }) => ({
            backgroundColor: colors.signal,
            borderRadius: radii.md,
            padding: 15,
            alignItems: "center",
            marginTop: 14,
            opacity: createItem.isPending || pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.onSignal, letterSpacing: 0.3 }}>
            {createItem.isPending ? "Adding…" : "Add to stack"}
          </Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ alignItems: "center", padding: 12 }}>
          <Text style={[type.meta, { fontSize: 14 }]}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}
