import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MarkDue, MarkLogged, MarkMissed, MarkScheduled } from "../components/icons";
import { buildWeekSchedule, mondayOfThisWeek, todayDow, weekDates } from "../lib/schedule";
import { useInjectionLogs, useStackItems } from "../lib/queries";
import { colors, font, panel, type } from "../theme";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_MS = 24 * 3600 * 1000;

type SlotState = "logged" | "missed" | "due" | "scheduled";

const STATE_COLOR: Record<SlotState, string> = {
  logged: colors.signal,
  missed: colors.amber,
  due: colors.signal,
  scheduled: colors.ink3,
};

function StateMark({ state }: { state: SlotState }) {
  const color = STATE_COLOR[state];
  if (state === "logged") return <MarkLogged size={15} color={color} />;
  if (state === "missed") return <MarkMissed size={15} color={color} />;
  if (state === "due") return <MarkDue size={15} color={color} />;
  return <MarkScheduled size={15} color={color} />;
}

export function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { data: items } = useStackItems();
  const { data: allLogs } = useInjectionLogs();
  const week = buildWeekSchedule(items ?? []);
  const dates = weekDates();
  const today = todayDow();

  // Which stack items were actually logged on each day of the visible week —
  // this is what separates "logged" from "missed" on a day already past.
  const loggedByDay = useMemo(() => {
    const start = mondayOfThisWeek().setHours(0, 0, 0, 0);
    const days: Set<string>[] = Array.from({ length: 7 }, () => new Set<string>());
    (allLogs ?? []).forEach((log) => {
      const idx = Math.floor((new Date(log.takenAt).setHours(0, 0, 0, 0) - start) / DAY_MS);
      if (idx >= 0 && idx < 7) days[idx].add(log.stackItemId);
    });
    return days;
  }, [allLogs]);

  const counts = useMemo(() => {
    let logged = 0;
    let due = 0;
    week.forEach((slots, i) => {
      const day = i + 1;
      slots.forEach((slot) => {
        if (loggedByDay[i].has(slot.stackItemId)) logged += 1;
        if (day <= today) due += 1;
      });
    });
    return { logged, due };
  }, [week, loggedByDay, today]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 32 }}
    >
      <Text style={type.title}>This week</Text>
      <Text style={[type.meta, { marginTop: 4 }]}>
        <Text style={{ fontFamily: font.numeralMedium, fontSize: 14, color: colors.ink }}>
          {counts.logged}/{counts.due}
        </Text>
        {"  logged so far this week"}
      </Text>

      <View style={[panel, { marginTop: 16, overflow: "hidden" }]}>
        {week.map((slots, i) => {
          const day = i + 1;
          const isToday = day === today;
          const isPast = day < today;
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
                  width: 62,
                  paddingVertical: 13,
                  alignItems: "center",
                  borderRightWidth: 1,
                  borderRightColor: colors.hairline,
                }}
              >
                <Text
                  style={{
                    fontFamily: font.semibold,
                    fontSize: 11,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    color: isToday ? colors.signal : colors.ink3,
                  }}
                >
                  {DAY_NAMES[i]}
                </Text>
                <Text
                  style={{
                    fontFamily: font.numeralMedium,
                    fontSize: 18,
                    color: isToday ? colors.ink : colors.ink2,
                    marginTop: 1,
                  }}
                >
                  {dates[i].getDate()}
                </Text>
                {isToday && (
                  <View style={{ width: 16, height: 2, borderRadius: 1, backgroundColor: colors.signal, marginTop: 4 }} />
                )}
              </View>

              <View style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 13, justifyContent: "center" }}>
                {slots.length === 0 ? (
                  <Text style={[type.meta, { color: colors.ink3 }]}>Rest day</Text>
                ) : (
                  <View style={{ gap: 7 }}>
                    {slots.map((slot, idx) => {
                      const logged = loggedByDay[i].has(slot.stackItemId);
                      const state: SlotState = logged
                        ? "logged"
                        : isPast
                          ? "missed"
                          : isToday
                            ? "due"
                            : "scheduled";
                      return (
                        <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                          <StateMark state={state} />
                          <Text
                            style={[
                              type.heading,
                              { fontSize: 14.5, flex: 1, color: state === "scheduled" ? colors.ink2 : colors.ink },
                            ]}
                          >
                            {slot.peptideName}
                          </Text>
                          <Text style={{ fontFamily: font.numeralMedium, fontSize: 14, color: colors.ink3 }}>
                            {slot.dose}
                            <Text style={{ fontSize: 11 }}> {slot.unit}</Text>
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 14, paddingHorizontal: 2 }}>
        <LegendItem state="logged" label="Logged" />
        <LegendItem state="due" label="Due" />
        <LegendItem state="missed" label="Not logged" />
        <LegendItem state="scheduled" label="Upcoming" />
      </View>
    </ScrollView>
  );
}

function LegendItem({ state, label }: { state: SlotState; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <StateMark state={state} />
      <Text style={[type.meta, { fontSize: 12 }]}>{label}</Text>
    </View>
  );
}
