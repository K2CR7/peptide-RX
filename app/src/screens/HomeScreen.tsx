import { ScrollView, Text, View } from "react-native";
import { todayDow } from "../lib/schedule";
import { useStackItems } from "../lib/queries";
import { useAuthStore } from "../store/authStore";
import { colors, radii } from "../theme";

export function HomeScreen() {
  const { data: items } = useStackItems();
  const user = useAuthStore((s) => s.user);
  const today = todayDow();
  const dueToday = (items ?? []).filter((i) => i.scheduleDays.includes(today));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink }}>
        Hey{user?.name ? `, ${user.name}` : ""}
      </Text>
      <Text style={{ color: colors.ink3, marginBottom: 8 }}>Here's what's due today.</Text>

      {dueToday.length === 0 && (
        <View style={{ backgroundColor: colors.white, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.ink3 }}>Nothing due today. Add items to your stack to get started.</Text>
        </View>
      )}

      {dueToday.map((item) => (
        <View key={item.id} style={{ backgroundColor: colors.white, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontWeight: "800", color: colors.ink, fontSize: 16 }}>{item.peptideName}</Text>
            <Text style={{ color: colors.ink3, fontSize: 12 }}>{item.frequency}</Text>
          </View>
          <View style={{ backgroundColor: colors.teal, borderRadius: radii.sm, paddingVertical: 6, paddingHorizontal: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "800" }}>{item.dose} {item.unit}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
