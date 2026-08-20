import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PEPTIDE_REFERENCE } from "../data/peptideReference";
import { colors, font, panel, radii, type } from "../theme";

const TIER_COLOR: Record<string, string> = {
  "FDA Approved": colors.signal,
  "Clinical Trials": colors.trace,
  "Limited Human": colors.amber,
  Preclinical: colors.amber,
  Speculative: colors.red,
};

export function LearnScreen() {
  const [open, setOpen] = useState<string | null>(null);
  const names = Object.keys(PEPTIDE_REFERENCE);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32, gap: 10 }}>
      <Text style={type.title}>Learn</Text>
      <Text style={[type.body, { fontSize: 13, marginBottom: 6 }]}>
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
            style={[panel, { borderRadius: radii.lg, padding: 16 }]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={[type.heading, { fontSize: 16 }]}>{name}</Text>
                <Text style={[type.meta, { marginTop: 3 }]}>{p.aka}</Text>
              </View>
              {p.evidenceTier && (
                <View
                  style={{
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: tierColor,
                    paddingVertical: 3,
                    paddingHorizontal: 10,
                  }}
                >
                  <Text style={{ fontFamily: font.bold, color: tierColor, fontSize: 10, letterSpacing: 0.4 }}>
                    {p.evidenceTier.label}
                  </Text>
                </View>
              )}
            </View>

            {isOpen && (
              <View style={{ marginTop: 14, gap: 12 }}>
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
                  <Text style={[type.label, { color: colors.signal }]}>Upsides</Text>
                  {p.upsides.map((u, i) => (
                    <Text key={i} style={[type.body, { fontSize: 13.5, marginTop: 4 }]}>· {u}</Text>
                  ))}
                </View>
                <View>
                  <Text style={[type.label, { color: colors.red }]}>Risks</Text>
                  {p.risks.map((r, i) => (
                    <Text key={i} style={[type.body, { fontSize: 13.5, marginTop: 4 }]}>· {r}</Text>
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
