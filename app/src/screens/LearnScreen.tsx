import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PEPTIDE_REFERENCE } from "../data/peptideReference";
import { colors, radii } from "../theme";

const TIER_COLOR: Record<string, string> = {
  "FDA Approved": colors.green,
  "Clinical Trials": "#2563EB",
  "Limited Human": colors.amber,
  Preclinical: colors.amber,
  Speculative: colors.red,
};

export function LearnScreen() {
  const [open, setOpen] = useState<string | null>(null);
  const names = Object.keys(PEPTIDE_REFERENCE);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 10 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, marginBottom: 4 }}>Learn</Text>
      <Text style={{ fontSize: 13, color: colors.ink3, marginBottom: 8 }}>
        Reference info only — not a recommendation to take anything.
      </Text>

      {names.map((name) => {
        const p = PEPTIDE_REFERENCE[name];
        const isOpen = open === name;
        const tierColor = p.evidenceTier ? TIER_COLOR[p.evidenceTier.tier] ?? colors.ink3 : colors.ink3;
        return (
          <Pressable
            key={name}
            onPress={() => setOpen(isOpen ? null : name)}
            style={{ backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16 }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.ink }}>{name}</Text>
                <Text style={{ color: colors.ink3, fontSize: 12, marginTop: 2 }}>{p.aka}</Text>
              </View>
              {p.evidenceTier && (
                <View style={{ borderRadius: 20, borderWidth: 1, borderColor: tierColor, paddingVertical: 3, paddingHorizontal: 10 }}>
                  <Text style={{ color: tierColor, fontSize: 10, fontWeight: "700" }}>{p.evidenceTier.label}</Text>
                </View>
              )}
            </View>

            {isOpen && (
              <View style={{ marginTop: 12, gap: 10 }}>
                {p.evidenceTier?.fdaFlag && (
                  <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "600" }}>
                    ⚑ {p.evidenceTier.fdaNote}
                  </Text>
                )}
                <Text style={{ color: colors.ink2, fontSize: 13, lineHeight: 19 }}>{p.description}</Text>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.green, textTransform: "uppercase" }}>Upsides</Text>
                  {p.upsides.map((u, i) => (
                    <Text key={i} style={{ color: colors.ink2, fontSize: 13, marginTop: 2 }}>• {u}</Text>
                  ))}
                </View>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.red, textTransform: "uppercase" }}>Risks</Text>
                  {p.risks.map((r, i) => (
                    <Text key={i} style={{ color: colors.ink2, fontSize: 13, marginTop: 2 }}>• {r}</Text>
                  ))}
                </View>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
