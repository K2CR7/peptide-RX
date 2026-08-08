import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { ChipSelect } from "../components/ChipSelect";
import { InjectionSitePicker } from "../components/InjectionSitePicker";
import { PEPTIDE_REFERENCE } from "../data/peptideReference";
import {
  type StackItem,
  useCreateStackItem,
  useInjectionLogs,
  useLogInjection,
  useStackItems,
} from "../lib/queries";
import { colors, radii } from "../theme";

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
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink }}>My Stack</Text>
          <Pressable
            onPress={() => setAddOpen(true)}
            style={{ backgroundColor: colors.teal, borderRadius: radii.md, paddingVertical: 10, paddingHorizontal: 16 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>+ Add</Text>
          </Pressable>
        </View>

        {isLoading && <Text style={{ color: colors.ink3 }}>Loading…</Text>}
        {!isLoading && items?.length === 0 && (
          <Text style={{ color: colors.ink3 }}>Nothing in your stack yet. Add what you're already taking.</Text>
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
    <View style={{ backgroundColor: colors.white, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.ink }}>{item.peptideName}</Text>
          <Text style={{ color: colors.ink3, fontSize: 12, marginTop: 2 }}>{item.frequency} · {item.route ?? "—"}</Text>
        </View>
        <View style={{ backgroundColor: colors.teal, borderRadius: radii.sm, paddingVertical: 6, paddingHorizontal: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>{item.dose} {item.unit}</Text>
        </View>
      </View>
      <Pressable
        onPress={onLog}
        style={{ marginTop: 12, borderWidth: 1.5, borderColor: colors.border2, borderRadius: radii.md, padding: 10, alignItems: "center" }}
      >
        <Text style={{ color: colors.tealDark, fontWeight: "700" }}>Log injection</Text>
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
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink, marginBottom: 8 }}>Add to your stack</Text>
        <Text style={{ fontSize: 13, color: colors.ink3, marginBottom: 4 }}>Peptide</Text>
        <ChipSelect
          options={Object.keys(PEPTIDE_REFERENCE)}
          value={peptideName}
          onChange={handlePeptideChange}
          customPlaceholder="Enter peptide name"
        />

        <Text style={{ fontSize: 13, color: colors.ink3, marginTop: 4 }}>Dose</Text>
        <ChipSelect options={DOSE_OPTIONS} value={dose} onChange={setDose} customPlaceholder="Enter dose" keyboardType="decimal-pad" />

        <Text style={{ fontSize: 13, color: colors.ink3, marginTop: 4 }}>Unit</Text>
        <ChipSelect options={UNIT_OPTIONS} value={unit} onChange={setUnit} customPlaceholder="Enter unit" />

        <Text style={{ fontSize: 13, color: colors.ink3, marginTop: 4 }}>Frequency</Text>
        <ChipSelect options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} customPlaceholder="Enter frequency" />

        <Text style={{ fontSize: 13, color: colors.ink3, marginTop: 4 }}>Route</Text>
        <ChipSelect options={ROUTE_OPTIONS} value={route} onChange={setRoute} customPlaceholder="Enter route" />

        <Text style={{ fontSize: 13, color: colors.ink3, marginTop: 4 }}>Schedule days</Text>
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
                  backgroundColor: on ? colors.teal : colors.white, borderWidth: 1.5, borderColor: on ? colors.teal : colors.border2,
                }}
              >
                <Text style={{ color: on ? "#fff" : colors.ink2, fontWeight: "700", fontSize: 12 }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {error && <Text style={{ color: colors.red, fontSize: 13, marginTop: 8 }}>{error}</Text>}

        <Pressable
          onPress={handleSubmit}
          disabled={createItem.isPending}
          style={{ backgroundColor: colors.teal, borderRadius: radii.md, padding: 15, alignItems: "center", marginTop: 12, opacity: createItem.isPending ? 0.6 : 1 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>{createItem.isPending ? "Adding…" : "Add to stack"}</Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ alignItems: "center", padding: 12 }}>
          <Text style={{ color: colors.ink3 }}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}
