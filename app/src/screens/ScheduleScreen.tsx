import { ScrollView, Text, View } from "react-native";
import { buildWeekSchedule, formatShortDate, todayDow, weekDates } from "../lib/schedule";
import { useStackItems } from "../lib/queries";
import { colors, radii } from "../theme";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ScheduleScreen() {
  const { data: items } = useStackItems();
  const week = buildWeekSchedule(items ?? []);
  const dates = weekDates();
  const today = todayDow();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 10 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, marginBottom: 8 }}>This Week</Text>
      {week.map((slots, i) => {
        const day = i + 1;
        const isToday = day === today;
        return (
          <View
            key={day}
            style={{
              backgroundColor: colors.white,
              borderRadius: radii.lg,
              borderWidth: 1.5,
              borderColor: isToday ? colors.teal : colors.border,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: isToday ? colors.teal : colors.ink3, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {DAY_NAMES[i]} · {formatShortDate(dates[i])}
            </Text>
            {slots.length === 0 ? (
              <Text style={{ color: colors.ink3, marginTop: 6, fontSize: 13 }}>Nothing scheduled</Text>
            ) : (
              <View style={{ marginTop: 8, gap: 6 }}>
                {slots.map((slot, idx) => (
                  <Text key={idx} style={{ color: colors.ink, fontWeight: "600" }}>• {slot.peptideName}</Text>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
