import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PEPTIDE_REFERENCE } from "../data/peptideReference";
import { colors, font, panel, radii, type } from "../theme";

// Evidence strength is a four-step ramp, not a set of categories: one hue
// carries "supported", one carries "thin", one carries "speculative". Trace
// blue is reserved for data lines and never appears here.
const TIER_TONE: Record<string, string> = {
  "FDA Approved": colors.signal,
  "Clinical Trials": colors.ink2,
  "Limited Human": colors.amber,
  Preclinical: colors.amber,
  Speculative: colors.red,
};

const TIER_ORDER = ["FDA Approved", "Clinical Trials", "Limited Human", "Preclinical", "Speculative"];

const GROUP_NOTE: Record<string, string> = {
  "FDA Approved": "Approved by the FDA for at least one indication.",
  "Clinical Trials": "Under active study in humans.",
  "Limited Human": "Some human data, but not conclusive.",
  Preclinical: "Animal or lab data only — no human trials.",
  Speculative: "Little or no published evidence.",
};

export function LearnScreen({ onClose }: { onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(() => {
    const byTier = new Map<string, string[]>();
    Object.keys(PEPTIDE_REFERENCE).forEach((name) => {
      const tier = PEPTIDE_REFERENCE[name].evidenceTier?.tier ?? "Speculative";
      if (!byTier.has(tier)) byTier.set(tier, []);
      byTier.get(tier)!.push(name);
    });
    return TIER_ORDER.filter((t) => byTier.has(t)).map((t) => ({ tier: t, names: byTier.get(t)! }));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 40, gap: 22 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={type.title}>Reference</Text>
            <Text style={[type.body, { fontSize: 13, marginTop: 4 }]}>
              Grouped by how strong the evidence is. Information only — not a recommendation to take anything.
            </Text>
          </View>
          {onClose && (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close reference"
              style={({ pressed }) => ({
                minWidth: 44,
                minHeight: 44,
                alignItems: "flex-end",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontFamily: font.semibold, color: colors.signal, fontSize: 14 }}>Done</Text>
            </Pressable>
          )}
        </View>

        {groups.map(({ tier, names }) => {
          const tone = TIER_TONE[tier] ?? colors.ink3;
          return (
            <View key={tier} style={{ gap: 9 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                <View style={{ width: 3, height: 15, borderRadius: 2, backgroundColor: tone }} />
                <Text style={[type.label, { color: tone }]}>{tier}</Text>
                <Text style={{ fontFamily: font.numeralMedium, fontSize: 13, color: colors.ink3 }}>{names.length}</Text>
              </View>
              <Text style={[type.meta, { fontSize: 12, marginTop: -3, marginLeft: 12 }]}>{GROUP_NOTE[tier]}</Text>

              <View style={[panel, { overflow: "hidden" }]}>
                {names.map((name, i) => (
                  <PeptideRow
                    key={name}
                    name={name}
                    tone={tone}
                    first={i === 0}
                    expanded={open === name}
                    onToggle={() => setOpen(open === name ? null : name)}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PeptideRow({
  name, tone, first, expanded, onToggle,
}: { name: string; tone: string; first: boolean; expanded: boolean; onToggle: () => void }) {
  const p = PEPTIDE_REFERENCE[name];

  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: colors.hairline }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          minHeight: 58,
          paddingVertical: 12,
          paddingHorizontal: 16,
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, { fontSize: 15.5 }]}>{name}</Text>
          <Text style={[type.meta, { marginTop: 2 }]}>{p.aka}</Text>
        </View>
        <Text style={{ fontFamily: font.numeralMedium, fontSize: 20, color: colors.ink3, lineHeight: 22 }}>
          {expanded ? "–" : "+"}
        </Text>
      </Pressable>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
          {p.evidenceTier?.fdaFlag && (
            <View
              style={{
                backgroundColor: colors.redFaint,
                borderWidth: 1,
                borderColor: colors.red,
                borderRadius: radii.sm,
                padding: 10,
              }}
            >
              <Text style={{ fontFamily: font.semibold, color: colors.red, fontSize: 12, lineHeight: 17 }}>
                {p.evidenceTier.fdaNote}
              </Text>
            </View>
          )}
          <Text style={type.body}>{p.description}</Text>
          <View>
            <Text style={[type.label, { color: tone }]}>Reported upsides</Text>
            {p.upsides.map((u, i) => (
              <Text key={i} style={[type.body, { fontSize: 13.5, marginTop: 4 }]}>· {u}</Text>
            ))}
          </View>
          <View>
            <Text style={[type.label, { color: colors.red }]}>Known risks</Text>
            {p.risks.map((r, i) => (
              <Text key={i} style={[type.body, { fontSize: 13.5, marginTop: 4 }]}>· {r}</Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
