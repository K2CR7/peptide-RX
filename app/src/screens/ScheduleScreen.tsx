import { ScrollView, Text, View } from "react-native";
import { buildWeekSchedule, formatShortDate, todayDow, weekDates } from "../lib/schedule";
import { useStackItems } from "../lib/queries";
import { colors, font, panel, type } from "../theme";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ScheduleScreen() {
  const { data: items } = useStackItems();
  const week = buildWeekSchedule(items ?? []);
  const dates = weekDates();
  const today = todayDow();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32 }}
    >
      <Text style={type.title}>This week</Text>

      <View style={[panel, { marginTop: 16, overflow: "hidden" }]}>
        {week.map((slots, i) => {
          const day = i + 1;
          const isToday = day === today;
          return (
            <View
              key={day}
              style={{
                flexDirection: "row",
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.hairline,
                backgroundColor: isToday ? colors.signalFaint : "transparent",
              }}
            >
              <View
                style={{
                  width: 64,
                  paddingVertical: 14,
                  alignItems: "center",
                  borderRightWidth: 1,
                  borderRightColor: colors.hairline,
                }}
              >
                <Text
                  style={{
                    fontFamily: font.semibold,
                    fontSize: 10.5,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: isToday ? colors.signal : colors.ink3,
                  }}
                >
                  {DAY_NAMES[i]}
                </Text>
                <Text
                  style={{
                    fontFamily: font.numeralMedium,
                    fontSize: 17,
                    color: isToday ? colors.ink : colors.ink2,
                    marginTop: 2,
                  }}
                >
                  {formatShortDate(dates[i]).replace(/[^0-9/]/g, "") || formatShortDate(dates[i])}
                </Text>
              </View>

              <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 14, justifyContent: "center" }}>
                {slots.length === 0 ? (
                  <Text style={[type.meta, { color: colors.ink3 }]}>—</Text>
                ) : (
                  <View style={{ gap: 5 }}>
                    {slots.map((slot, idx) => (
                      <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 3,
                            backgroundColor: isToday ? colors.signal : colors.ink3,
                          }}
                        />
                        <Text style={[type.heading, { fontSize: 14.5 }]}>{slot.peptideName}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
