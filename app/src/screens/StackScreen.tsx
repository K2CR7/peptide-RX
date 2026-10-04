import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Select } from "../components/Select";
import { PhoneModalFrame } from "../components/PhoneModalFrame";
import { BookIcon, PlusMark } from "../components/icons";
import { InjectionSitePicker } from "../components/InjectionSitePicker";
import { siteHistory } from "../lib/injectionSites";
import { PEPTIDE_REFERENCE } from "../data/peptideReference";
import {
  CUSTOM_CYCLE_LABEL, NO_CYCLE_LABEL, cycleOptionLabels, cycleState, describeCycle,
  describeRemaining, findCycleOption, labelForCycle,
} from "../lib/cycle";
import { LearnScreen } from "../screens/LearnScreen";
import {
  type StackItem,
  useArchiveStackItem,
  useCreateStackItem,
  useUpdateStackItem,
  useInjectionLogs,
  useLogInjection,
  useStackItems,
} from "../lib/queries";
import { AsyncBlock, Button, ErrorText, Panel } from "../components/primitives";
import { HIT, colors, font, panel, radii, space, type } from "../theme";

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
const FULL_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function StackScreen() {
  const insets = useSafeAreaInsets();
  const { data: items, isLoading, isError, refetch } = useStackItems();
  const [addOpen, setAddOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [injectFor, setInjectFor] = useState<{ id: string; route: string | null } | null>(null);
  const [detailFor, setDetailFor] = useState<StackItem | null>(null);
  const [editFor, setEditFor] = useState<StackItem | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 32, gap: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={type.title}>My stack</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={() => setLearnOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Peptide reference"
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.hairline2,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <BookIcon size={20} color={colors.ink2} />
            </Pressable>
            <Pressable
              onPress={() => setAddOpen(true)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 44,
                backgroundColor: colors.signal,
                borderRadius: radii.md,
                paddingHorizontal: 16,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <PlusMark size={13} color={colors.onSignal} />
              <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.onSignal, letterSpacing: 0.3 }}>Add</Text>
            </Pressable>
          </View>
        </View>

        {(isLoading || isError || items?.length === 0) && (
          <Panel pad={space.lg}>
            <AsyncBlock
              loading={isLoading}
              error={isError}
              isEmpty={items?.length === 0}
              emptyText="Nothing in your stack yet. Add what you're already taking."
              onRetry={refetch}
            >
              <View />
            </AsyncBlock>
          </Panel>
        )}

        {items && items.length > 0 && (
          <View style={[panel, { overflow: "hidden" }]}>
            {items.map((item, i) => (
              <StackItemRow
                key={item.id}
                item={item}
                first={i === 0}
                onLog={() => setInjectFor({ id: item.id, route: item.route })}
                onOpen={() => setDetailFor(item)}
              />
            ))}
          </View>
        )}

        {items && items.length > 0 && (
          <Text style={[type.metaSm, { paddingHorizontal: 2 }]}>
            Tap an item to edit or remove it.
          </Text>
        )}
      </ScrollView>

      {detailFor && (
        <StackItemSheet
          item={detailFor}
          onClose={() => setDetailFor(null)}
          onEdit={() => {
            setEditFor(detailFor);
            setDetailFor(null);
          }}
        />
      )}

      {addOpen && <StackItemFormModal onClose={() => setAddOpen(false)} />}
      {editFor && <StackItemFormModal item={editFor} onClose={() => setEditFor(null)} />}

      <Modal visible={learnOpen} animationType="slide" onRequestClose={() => setLearnOpen(false)}>
        <PhoneModalFrame backgroundColor={colors.bg}>
          <LearnScreen onClose={() => setLearnOpen(false)} />
        </PhoneModalFrame>
      </Modal>

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

function StackItemRow({
  item, first, onLog, onOpen,
}: { item: StackItem; first: boolean; onLog: () => void; onOpen: () => void }) {
  const cycle = cycleState(item.startedAt, item.cycleOnDays, item.cycleOffDays);
  const off = cycle?.phase === "off";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingLeft: 16,
        paddingRight: 12,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.hairline,
      }}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${item.peptideName} details`}
        style={({ pressed }) => ({ flex: 1, minHeight: 44, justifyContent: "center", opacity: pressed ? 0.72 : 1 })}
      >
        <Text style={type.headingSm}>{item.peptideName}</Text>
        <Text style={[type.meta, { marginTop: 2 }]}>
          {item.frequency}
          {item.route ? ` · ${item.route}` : ""}
        </Text>
        {cycle && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: off ? colors.amber : colors.signal,
              }}
            />
            <Text style={{ fontFamily: font.semibold, fontSize: 11, color: off ? colors.amber : colors.signal }}>
              {describeCycle(cycle)}
            </Text>
            <Text style={type.metaSm}>· {describeRemaining(cycle)}</Text>
          </View>
        )}
      </Pressable>

      <Text style={{ fontFamily: font.numeralMedium, fontSize: 20, color: colors.ink, letterSpacing: 0.3 }}>
        {item.dose}
        <Text style={{ fontSize: 13, color: colors.ink3 }}> {item.unit}</Text>
      </Text>

      <Pressable
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel={`Log ${item.peptideName}`}
        style={({ pressed }) => ({
          minHeight: 44,
          minWidth: 62,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: colors.signalDim,
          backgroundColor: colors.signalFaint,
          borderRadius: radii.md,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ fontFamily: font.bold, fontSize: 13, color: colors.signal, letterSpacing: 0.3 }}>Log</Text>
      </Pressable>
    </View>
  );
}

function InjectionLogger({ stackItemId, route, onClose }: { stackItemId: string; route: string | null; onClose: () => void }) {
  const { data: logs } = useInjectionLogs(stackItemId);
  const logInjection = useLogInjection();
  const history = siteHistory(logs ?? []).reverse();

  return (
    <InjectionSitePicker
      visible
      route={route}
      history={history}
      onClose={onClose}
      onConfirm={(site) => {
        // site is null for oral and nasal routes — there is nowhere to pin,
        // but the dose still happened, so it still gets logged.
        logInjection.mutate({ stackItemId, site });
        onClose();
      }}
    />
  );
}

/**
 * One form for both adding and editing — passing `item` switches it to edit
 * mode. Duplicating it would mean two places to keep the autofill, the cycle
 * presets and the validation in step.
 */
function StackItemFormModal({ item, onClose }: { item?: StackItem; onClose: () => void }) {
  const createItem = useCreateStackItem();
  const updateItem = useUpdateStackItem();
  const editing = item !== undefined;

  const [peptideName, setPeptideName] = useState(item?.peptideName ?? "");
  const [dose, setDose] = useState(item ? String(item.dose) : "");
  const [unit, setUnit] = useState(item?.unit ?? "mcg");
  const [frequency, setFrequency] = useState(item?.frequency ?? "");
  const [route, setRoute] = useState(item?.route ?? "");
  const [days, setDays] = useState<number[]>(item?.scheduleDays ?? []);
  const [cycleLabel, setCycleLabel] = useState(
    item ? labelForCycle(item.cycleOnDays, item.cycleOffDays) : NO_CYCLE_LABEL,
  );
  const [customOnWeeks, setCustomOnWeeks] = useState(
    item?.cycleOnDays ? String(item.cycleOnDays / 7) : "",
  );
  const [customOffWeeks, setCustomOffWeeks] = useState(
    item?.cycleOffDays ? String(item.cycleOffDays / 7) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const pending = createItem.isPending || updateItem.isPending;

  const isCustomCycle = cycleLabel === CUSTOM_CYCLE_LABEL;

  function resolveCycle(): { onDays: number | null; offDays: number | null } {
    if (isCustomCycle) {
      const on = Math.round(Number(customOnWeeks) * 7);
      const off = Math.round(Number(customOffWeeks) * 7);
      return on > 0 && off > 0 ? { onDays: on, offDays: off } : { onDays: null, offDays: null };
    }
    const preset = findCycleOption(cycleLabel);
    return { onDays: preset?.onDays ?? null, offDays: preset?.offDays ?? null };
  }

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

  async function handleSubmit() {
    setError(null);
    const doseNum = Number(dose);
    if (!peptideName.trim()) return setError("Pick or enter a peptide name.");
    if (!dose || !doseNum) return setError("Pick or enter a dose.");
    if (!frequency.trim()) return setError("Pick or enter a frequency.");
    const cycle = resolveCycle();
    if (isCustomCycle && (cycle.onDays === null || cycle.offDays === null)) {
      return setError("Enter both weeks on and weeks off, or pick a preset cycle.");
    }

    const payload = {
      peptideName: peptideName.trim(),
      dose: doseNum,
      unit,
      frequency: frequency.trim(),
      scheduleDays: days,
      route: route.trim() || null,
      cycleOnDays: cycle.onDays,
      cycleOffDays: cycle.offDays,
    };

    try {
      if (editing) {
        await updateItem.mutateAsync({ id: item.id, ...payload });
      } else {
        await createItem.mutateAsync(payload);
      }
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : editing
            ? "Couldn't save those changes — try again."
            : "Failed to add to stack — try again.",
      );
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <PhoneModalFrame backgroundColor={colors.bg}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 68, paddingBottom: 40, gap: 12 }}>
        <Text style={[type.title, { marginBottom: 12 }]}>
          {editing ? "Edit stack item" : "Add to your stack"}
        </Text>

        <Select
          label="Peptide"
          options={Object.keys(PEPTIDE_REFERENCE)}
          value={peptideName}
          onChange={handlePeptideChange}
          placeholder="Choose a peptide"
          customPlaceholder="Enter a peptide not listed"
          describe={(name) => PEPTIDE_REFERENCE[name]?.aka}
        />

        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1.4 }}>
            <Select
              label="Dose"
              options={DOSE_OPTIONS}
              value={dose}
              onChange={setDose}
              placeholder="Amount"
              customPlaceholder="Enter a dose"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Select
              label="Unit"
              options={UNIT_OPTIONS}
              value={unit}
              onChange={setUnit}
              placeholder="Unit"
              customPlaceholder="Enter a unit"
            />
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Select
            label="Frequency"
            options={FREQUENCY_OPTIONS}
            value={frequency}
            onChange={setFrequency}
            placeholder="How often"
            customPlaceholder="Enter a frequency"
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <Select
            label="Route"
            options={ROUTE_OPTIONS}
            value={route}
            onChange={setRoute}
            placeholder="How it's taken"
            customPlaceholder="Enter a route"
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <Select
            label="Cycle"
            options={cycleOptionLabels()}
            value={cycleLabel}
            onChange={setCycleLabel}
            placeholder="No cycle — continuous"
            customPlaceholder="Enter a cycle"
          />
        </View>

        {isCustomCycle && (
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <WeeksField label="Weeks on" value={customOnWeeks} onChangeText={setCustomOnWeeks} />
            <WeeksField label="Weeks off" value={customOffWeeks} onChangeText={setCustomOffWeeks} />
          </View>
        )}

        <Text style={[type.label, { marginTop: space.lg }]}>Schedule days</Text>
        {/* Seven adjacent circles were 38pt with a 6pt gap — under the 44pt
            floor and close enough together to mis-tap. */}
        <View style={{ flexDirection: "row", gap: space.xs }}>
          {DAY_LABELS.map((label, i) => {
            const day = i + 1;
            const on = days.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => toggleDay(day)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={FULL_DAY_NAMES[i]}
                style={({ pressed }) => ({
                  flex: 1,
                  height: HIT,
                  borderRadius: radii.md,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: on ? colors.signal : colors.panel,
                  borderWidth: 1,
                  borderColor: on ? colors.signal : colors.hairline2,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={[type.buttonSm, { color: on ? colors.onSignal : colors.ink2 }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ErrorText style={{ marginTop: space.sm }}>{error}</ErrorText>

        <Button
          label={editing ? "Save changes" : "Add to stack"}
          loadingLabel={editing ? "Saving…" : "Adding…"}
          onPress={handleSubmit}
          loading={pending}
          style={{ marginTop: space.lg }}
        />
        <Button label="Cancel" variant="quiet" onPress={onClose} />
      </ScrollView>
      </PhoneModalFrame>
    </Modal>
  );
}

function WeeksField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[type.label, { marginBottom: 8 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.ink3}
        style={{
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.hairline2,
          borderRadius: radii.md,
          paddingHorizontal: 16,
          minHeight: 48,
          fontFamily: font.numeralMedium,
          fontSize: 17,
          color: colors.ink,
        }}
      />
    </View>
  );
}

/**
 * Item detail and removal. Removing archives rather than deletes, so the
 * injection history behind it stays intact and past weeks keep reading
 * truthfully; the item just stops appearing in the stack and the schedule.
 */
function StackItemSheet({
  item, onClose, onEdit,
}: { item: StackItem; onClose: () => void; onEdit: () => void }) {
  const archive = useArchiveStackItem();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cycle = cycleState(item.startedAt, item.cycleOnDays, item.cycleOffDays);

  // Only onSuccess was handled, so a failed archive left the sheet open with
  // the button reading "Removing…" indefinitely and nothing explaining why.
  function handleRemove() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    archive.mutate(item.id, {
      onSuccess: onClose,
      onError: () => {
        setError("Couldn't remove that — check your connection and try again.");
        setConfirming(false);
      },
    });
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <PhoneModalFrame>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(4,6,8,0.72)" }} onPress={onClose} />
          <View
            style={{
              backgroundColor: colors.panel,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderColor: colors.hairline2,
              paddingTop: 20,
              paddingHorizontal: 20,
              paddingBottom: 20,
            }}
          >
            <Text style={[type.heading, { fontSize: 20 }]}>{item.peptideName}</Text>

            <View style={{ marginTop: 16, gap: 8 }}>
              <DetailRow label="Dose" value={`${item.dose} ${item.unit}`} />
              <DetailRow label="Frequency" value={item.frequency} />
              <DetailRow label="Route" value={item.route ?? "—"} />
              <DetailRow
                label="Cycle"
                value={cycle ? `${describeCycle(cycle)} · ${describeRemaining(cycle)}` : "Continuous"}
              />
              <DetailRow
                label="Started"
                value={new Date(item.startedAt).toLocaleDateString(undefined, {
                  month: "short", day: "numeric", year: "numeric",
                })}
              />
            </View>

            {!confirming && (
              <Button label="Edit" onPress={onEdit} style={{ marginTop: space.lg }} />
            )}

            {confirming && (
              <Text style={[type.bodySm, { marginTop: space.lg }]}>
                This takes {item.peptideName} out of your stack and schedule. Injections you already
                logged are kept, so past weeks still read correctly.
              </Text>
            )}

            <ErrorText style={{ marginTop: space.md }}>{error}</ErrorText>

            <Button
              label={confirming ? "Yes, remove it" : "Remove from stack"}
              loadingLabel="Removing…"
              variant={confirming ? "dangerSolid" : "danger"}
              onPress={handleRemove}
              loading={archive.isPending}
              style={{ marginTop: space.lg }}
            />

            <Button
              label={confirming ? "Keep it" : "Close"}
              variant="quiet"
              onPress={confirming ? () => setConfirming(false) : onClose}
            />
          </View>
        </View>
      </PhoneModalFrame>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <Text style={type.label}>{label}</Text>
      <Text style={{ fontFamily: font.semibold, fontSize: 15, color: colors.ink, flexShrink: 1, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}
