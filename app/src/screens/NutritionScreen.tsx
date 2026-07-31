import { ScrollView, Text, View } from "react-native";
import { useNutritionPlans } from "../lib/queries";
import { colors, radii } from "../theme";

// MVP placeholder: plan generation logic doesn't exist yet (see plan doc,
// "New" section) — this screen just proves the nutrition API round-trip.
export function NutritionScreen() {
  const { data: plans, isLoading } = useNutritionPlans();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink }}>Nutrition</Text>
      {isLoading && <Text style={{ color: colors.ink3 }}>Loading…</Text>}
      {!isLoading && (!plans || (plans as unknown[]).length === 0) && (
        <View style={{ backgroundColor: colors.white, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.ink3 }}>No nutrition plan yet. Coming soon.</Text>
        </View>
      )}
    </ScrollView>
  );
}
