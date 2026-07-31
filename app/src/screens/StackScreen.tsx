import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
  const [route, setRoute] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>([]);

  const suggestions = peptideName.length > 1
    ? Object.keys(PEPTIDE_REFERENCE).filter((n) => n.toLowerCase().includes(peptideName.toLowerCase())).slice(0, 5)
    : [];

  function toggleDay(day: number) {
    setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day].sort()));
  }

  function applySuggestion(name: string) {
    setPeptideName(name);
    const ref = PEPTIDE_REFERENCE[name];
    if (ref) {
      setFrequency(ref.frequency);
      setRoute(ref.primaryRoute);
      setDays(ref.typicalScheduleDays);
    }
  }

  function reset() {
    setPeptideName(""); setDose(""); setUnit("mcg"); setFrequency(""); setRoute(null); setDays([]);
  }

  async function handleSubmit() {
    const doseNum = Number(dose);
    if (!peptideName.trim() || !doseNum || !frequency.trim()) return;
    await createItem.mutateAsync({
      peptideName: peptideName.trim(),
      dose: doseNum,
      unit,
      frequency: frequency.trim(),
      scheduleDays: days,
      route,
      cycleOnDays: null,
      cycleOffDays: null,
    });
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink, marginBottom: 8 }}>Add to your stack</Text>
        <Text style={{ fontSize: 13, color: colors.ink3, marginBottom: 4 }}>Peptide</Text>
        <TextInput placeholder="e.g. BPC-157" value={peptideName} onChangeText={setPeptideName} style={inputStyle} />
        {suggestions.map((s) => (
          <Pressable key={s} onPress={() => applySuggestion(s)} style={{ paddingVertical: 6 }}>
            <Text style={{ color: colors.teal, fontWeight: "600" }}>{s}</Text>
          </Pressable>
        ))}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput placeholder="Dose" keyboardType="numeric" value={dose} onChangeText={setDose} style={[inputStyle, { flex: 1 }]} />
          <TextInput placeholder="Unit (mcg/mg)" value={unit} onChangeText={setUnit} style={[inputStyle, { flex: 1 }]} />
        </View>

        <Text style={{ fontSize: 13, color: colors.ink3, marginTop: 4 }}>Frequency</Text>
        <TextInput placeholder="e.g. Once daily" value={frequency} onChangeText={setFrequency} style={inputStyle} />

        <Text style={{ fontSize: 13, color: colors.ink3, marginTop: 4 }}>Route</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ROUTE_OPTIONS.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRoute(r)}
              style={{
                paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
                borderWidth: 1.5, borderColor: route === r ? colors.teal : colors.border2,
                backgroundColor: route === r ? colors.tealLight : colors.white,
              }}
            >
              <Text style={{ color: route === r ? colors.tealDark : colors.ink2, fontWeight: "600", fontSize: 13 }}>{r}</Text>
            </Pressable>
          ))}
        </View>

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

        <Pressable
          onPress={handleSubmit}
          disabled={createItem.isPending}
          style={{ backgroundColor: colors.teal, borderRadius: radii.md, padding: 15, alignItems: "center", marginTop: 20 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Add to stack</Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ alignItems: "center", padding: 12 }}>
          <Text style={{ color: colors.ink3 }}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

const inputStyle = {
  backgroundColor: colors.white,
  borderWidth: 1.5,
  borderColor: colors.border2,
  borderRadius: radii.md,
  padding: 13,
  fontSize: 15,
  color: colors.ink,
};
