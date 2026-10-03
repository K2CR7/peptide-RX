import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MarkDue, MarkLogged, MarkMissed, MarkScheduled } from "../components/icons";
import { mondayOfThisWeek, todayDow, weekDates } from "../lib/schedule";
import { useInjectionLogs, useStackItems } from "../lib/queries";
import { colors, font, panel, type } from "../theme";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_MS = 24 * 3600 * 1000;

const NAME_COL = 108;
const ROW_H = 44;

type CellState = "logged" | "missed" | "due" | "scheduled" | "none";

function StateMark({ state }: { state: CellState }) {
  if (state === "logged") return <MarkLogged size={16} color={colors.signal} />;
  if (state === "missed") return <MarkMissed size={16} color={colors.amber} />;
  if (state === "due") return <MarkDue size={16} color={colors.signal} />;
  if (state === "scheduled") return <MarkScheduled size={16} color={colors.ink3} />;
  // Not scheduled — a rule, not a mark, so the eye skips it.
  return <View style={{ width: 9, height: 1.5, borderRadius: 1, backgroundColor: colors.hairline2 }} />;
}

export function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { data: items } = useStackItems();
  const { data: allLogs } = useInjectionLogs();
  const dates = weekDates();
  const today = todayDow();

  const loggedByDay = useMemo(() => {
    const start = mondayOfThisWeek().setHours(0, 0, 0, 0);
    const days: Set<string>[] = Array.from({ length: 7 }, () => new Set<string>());
    (allLogs ?? []).forEach((log) => {
      const idx = Math.floor((new Date(log.takenAt).setHours(0, 0, 0, 0) - start) / DAY_MS);
      if (idx >= 0 && idx < 7) days[idx].add(log.stackItemId);
    });
    return days;
  }, [allLogs]);

  const stateFor = (itemId: string, scheduleDays: number[], day: number): CellState => {
    if (!scheduleDays.includes(day)) return "none";
    if (loggedByDay[day - 1].has(itemId)) return "logged";
    if (day < today) return "missed";
    if (day === today) return "due";
    return "scheduled";
  };

  const rows = items ?? [];

  const totals = useMemo(() => {
    let logged = 0;
    let owed = 0;
    rows.forEach((item) => {
      for (let day = 1; day <= 7; day++) {
        const s = stateFor(item.id, item.scheduleDays, day);
        if (s === "logged") logged += 1;
        if (s === "logged" || s === "missed" || s === "due") owed += 1;
      }
    });
    return { logged, owed };
  }, [rows, loggedByDay, today]);

  const perDay = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const day = i + 1;
        let done = 0;
        let due = 0;
        rows.forEach((item) => {
          const s = stateFor(item.id, item.scheduleDays, day);
          if (s === "none") return;
          due += 1;
          if (s === "logged") done += 1;
        });
        return { done, due };
      }),
    [rows, loggedByDay, today],
  );

  const cellW = (390 - NAME_COL) / 7;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 32 }}
    >
      <Text style={type.title}>This week</Text>
      <Text style={[type.meta, { marginTop: 4 }]}>
        <Text style={{ fontFamily: font.numeralMedium, fontSize: 14, color: colors.ink }}>
          {totals.logged}/{totals.owed}
        </Text>
        {"  logged so far"}
      </Text>

      {rows.length === 0 ? (
        <View style={[panel, { padding: 18, marginTop: 16 }]}>
          <Text style={type.body}>Nothing scheduled yet. Add items to your stack to build a week.</Text>
        </View>
      ) : (
        <View style={[panel, { marginTop: 16, paddingVertical: 4, overflow: "hidden" }]}>
          {/* Day header */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", paddingBottom: 8, paddingTop: 8 }}>
            <View style={{ width: NAME_COL }} />
            {dates.map((d, i) => {
              const isToday = i + 1 === today;
              return (
                <View key={i} style={{ width: cellW, alignItems: "center" }}>
                  <Text
                    style={{
                      fontFamily: font.semibold,
                      fontSize: 10.5,
                      letterSpacing: 0.8,
                      color: isToday ? colors.signal : colors.ink3,
                    }}
                  >
                    {DAY_LETTERS[i]}
                  </Text>
                  <Text
                    style={{
                      fontFamily: font.numeralMedium,
                      fontSize: 14,
                      color: isToday ? colors.ink : colors.ink3,
                      marginTop: 1,
                    }}
                  >
                    {d.getDate()}
                  </Text>
                  {isToday && (
                    <View
                      style={{
                        width: 18,
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: colors.signal,
                        marginTop: 3,
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* One row per peptide, one cell per day */}
          {rows.map((item, r) => (
            <View
              key={item.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                minHeight: ROW_H,
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
              }}
            >
              <View style={{ width: NAME_COL, paddingRight: 8, paddingLeft: 14 }}>
                <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: colors.ink }} numberOfLines={1}>
                  {item.peptideName}
                </Text>
                <Text style={{ fontFamily: font.numeralMedium, fontSize: 11.5, color: colors.ink3, marginTop: 1 }}>
                  {item.dose} {item.unit}
                </Text>
              </View>

              {dates.map((_, i) => {
                const day = i + 1;
                const isToday = day === today;
                return (
                  <View
                    key={i}
                    style={{
                      width: cellW,
                      height: ROW_H,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isToday ? colors.signalFaint : "transparent",
                    }}
                  >
                    <StateMark state={stateFor(item.id, item.scheduleDays, day)} />
                  </View>
                );
              })}
            </View>
          ))}

          {/* Per-day completion foot */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderTopWidth: 1,
              borderTopColor: colors.hairline2,
              paddingVertical: 9,
            }}
          >
            <View style={{ width: NAME_COL, paddingLeft: 14 }}>
              <Text style={[type.label, { fontSize: 9.5, letterSpacing: 1 }]}>Logged</Text>
            </View>
            {perDay.map((d, i) => {
              const isToday = i + 1 === today;
              const complete = d.due > 0 && d.done === d.due;
              return (
                <View
                  key={i}
                  style={{
                    width: cellW,
                    alignItems: "center",
                    backgroundColor: isToday ? colors.signalFaint : "transparent",
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: font.numeralMedium,
                      fontSize: 12.5,
                      color: d.due === 0 ? colors.ink3 : complete ? colors.signal : colors.ink2,
                    }}
                  >
                    {d.due === 0 ? "—" : `${d.done}/${d.due}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 13, rowGap: 8, marginTop: 14, paddingHorizontal: 2 }}>
        <LegendItem state="logged" label="Logged" />
        <LegendItem state="due" label="Due today" />
        <LegendItem state="missed" label="Not logged" />
        <LegendItem state="scheduled" label="Upcoming" />
        <LegendItem state="none" label="Off day" />
      </View>
    </ScrollView>
  );
}

function LegendItem({ state, label }: { state: CellState; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <StateMark state={state} />
      <Text style={[type.meta, { fontSize: 12 }]}>{label}</Text>
    </View>
  );
}
