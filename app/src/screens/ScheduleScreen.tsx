import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MarkDue, MarkLogged, MarkMissed, MarkPartial, MarkScheduled } from "../components/icons";
import { mondayOfThisWeek, todayDow, weekDates } from "../lib/schedule";
import { formatDose } from "../lib/dose";
import { type StackItem, useInjectionLogs, useStackItems } from "../lib/queries";
import { tallyDay } from "../lib/doses";
import { AsyncBlock, Panel } from "../components/primitives";
import { ProtocolMatrix } from "../components/ProtocolMatrix";
import { buildMatrix } from "../lib/lanes";
import { TourTarget } from "../components/tour";
import { colors, font, panel, type, space } from "../theme";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_MS = 24 * 3600 * 1000;

const NAME_COL = 108;
const ROW_H = 44;

type CellState = "logged" | "partial" | "missed" | "due" | "scheduled" | "none";

/*
  A missed dose is drawn in the same muted edge colour as an unfilled cell on
  the home screen, not in amber.

  Amber is the app's warning colour and it has to keep meaning something that
  needs acting on. A dose that wasn't logged last Tuesday is not actionable —
  it is history — and on a week of two daily peptides it was most of the
  grid, which turned the one screen that shows the schedule into a wall of
  alerts. The glyph already separates the states by shape: a check inside a
  ring is logged, an empty ring is due, a barred ring is not logged, a dot is
  upcoming. Colour was doing no work that shape wasn't already doing better.
*/
function StateMark({ state }: { state: CellState }) {
  if (state === "logged") return <MarkLogged size={16} color={colors.signalInk} />;
  /*
    Partly done: the due ring with a filled core. Same logic as the matrix —
    an item due three times with two in is not the same event as one with
    none, and it is not a finished day either.
  */
  if (state === "partial") return <MarkPartial size={16} color={colors.signalInk} />;
  if (state === "missed") return <MarkMissed size={16} color={colors.edge} />;
  if (state === "due") return <MarkDue size={16} color={colors.signalInk} />;
  if (state === "scheduled") return <MarkScheduled size={16} color={colors.ink3} />;
  // Not scheduled — a rule, not a mark, so the eye skips it.
  return <View style={{ width: 9, height: 1.5, borderRadius: 1, backgroundColor: colors.hairline2 }} />;
}

export function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { data: items, isLoading, isError, refetch } = useStackItems();
  const { data: allLogs } = useInjectionLogs();
  const dates = weekDates();
  const today = todayDow();

  /*
    Doses logged per item, per day of this week. Counts rather than a Set of
    ids, so an item running more than once a day can be partly done.
  */
  const loggedByDay = useMemo(() => {
    const start = mondayOfThisWeek().setHours(0, 0, 0, 0);
    const days: Map<string, number>[] = Array.from({ length: 7 }, () => new Map<string, number>());
    (allLogs ?? []).forEach((log) => {
      const idx = Math.floor((new Date(log.takenAt).setHours(0, 0, 0, 0) - start) / DAY_MS);
      if (idx < 0 || idx >= 7) return;
      const day = days[idx];
      day.set(log.stackItemId, (day.get(log.stackItemId) ?? 0) + 1);
    });
    return days;
  }, [allLogs]);

  const stateFor = (item: StackItem, day: number): CellState => {
    if (!item.scheduleDays.includes(day)) return "none";
    const tally = tallyDay(item, loggedByDay[day - 1].get(item.id) ?? 0);
    if (tally.done >= tally.due) return "logged";
    if (tally.done > 0) return "partial";
    if (day < today) return "missed";
    if (day === today) return "due";
    return "scheduled";
  };

  const rows = items ?? [];

  /*
    Both of these count DOSES, not items.

    They used to add one per item per day, reading the cell state: a twice
    daily peptide contributed one to the denominator and scored one for a
    single dose. The header then printed "4/6 logged" for a week that owed
    nine. Counting the slots directly is both correct and simpler than
    inferring a number back out of a cell state.

    The future is still excluded from the header's denominator — Thursday's
    dose is not owed on Monday — which is why `owed` skips "scheduled" while
    the per-day foot, which labels each column, does not.
  */
  const totals = useMemo(() => {
    let logged = 0;
    let owed = 0;
    rows.forEach((item) => {
      for (let day = 1; day <= 7; day++) {
        if (!item.scheduleDays.includes(day)) continue;
        const tally = tallyDay(item, loggedByDay[day - 1].get(item.id) ?? 0);
        logged += tally.done;
        if (day <= today) owed += tally.due;
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
          if (!item.scheduleDays.includes(day)) return;
          const tally = tallyDay(item, loggedByDay[day - 1].get(item.id) ?? 0);
          due += tally.due;
          done += tally.done;
        });
        return { done, due };
      }),
    [rows, loggedByDay, today],
  );

  /*
    The grid used to be sized from a hardcoded 390, which is one specific
    iPhone. Everything narrower silently lost days off the right edge: the
    row is clipped by overflow:"hidden", so on a 393pt iPhone Sunday was cut
    off and on a 360pt Android both weekend days were. It looked correct only
    in the web dev frame, which happens to be 430 wide.

    Measured from the panel itself rather than from the window, because on
    web this app renders inside a fixed-width phone frame — the window is the
    whole browser and is nothing to do with how much room this grid has.
    onLayout is the only number that is true on both platforms.
  */
  const [gridW, setGridW] = useState(0);
  const cellW = gridW > 0 ? (gridW - NAME_COL) / 7 : 0;

  /*
    Three weeks, under this week, on the tab whose subject is the schedule.

    It was on Today, where it was the second-largest graphic on a screen
    about one day — and it was the same encoding as the grid above, at a
    different window length, on a different tab. Two charts of the same thing
    in two places is one chart too many; the one with the longer window
    belongs next to the shorter one, where the comparison is free.

    Three weeks, not four. The window is set by how big a cell can be and
    still be a cell: 28 columns across a phone is 10px each, which renders as
    a texture rather than as marks you can count. See the geometry note in
    ProtocolMatrix.
  */
  const matrix = useMemo(() => buildMatrix(rows, allLogs ?? [], 21), [rows, allLogs]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + space.xl, paddingBottom: space.section }}
    >
      <Text style={type.title}>This week</Text>
      <Text style={[type.meta, { marginTop: 4 }]}>
        <Text style={{ fontFamily: font.numeralMedium, fontSize: 15, color: colors.ink }}>
          {totals.logged}/{totals.owed}
        </Text>
        {"  logged"}
      </Text>

      {isLoading || isError || rows.length === 0 ? (
        <View style={{ marginTop: space.lg }}>
          <Panel pad={space.lg}>
            <AsyncBlock
              loading={isLoading}
              error={isError}
              isEmpty={rows.length === 0}
              emptyText="Nothing scheduled yet. Add items in Stack."
              onRetry={refetch}
            >
              <View />
            </AsyncBlock>
          </Panel>
        </View>
      ) : (
        <TourTarget id="week-grid" style={{ marginTop: 16 }}>
        <View
          style={[panel, { paddingVertical: 4, overflow: "hidden" }]}
          onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
        >
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
                      fontSize: 11,
                      letterSpacing: 0.8,
                      color: isToday ? colors.signalInk : colors.ink3,
                    }}
                  >
                    {DAY_LETTERS[i]}
                  </Text>
                  <Text
                    style={{
                      fontFamily: font.numeralMedium,
                      fontSize: 15,
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
                        backgroundColor: colors.signalInk,
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
              <View style={{ width: NAME_COL, paddingRight: 8, paddingLeft: 16 }}>
                <Text style={{ fontFamily: font.semibold, fontSize: 13, color: colors.ink }} numberOfLines={1}>
                  {item.peptideName}
                </Text>
                <Text style={{ fontFamily: font.numeralMedium, fontSize: 11, color: colors.ink3, marginTop: 1 }}>
                  {formatDose(item.dose, item.unit)}
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
                    <StateMark state={stateFor(item, day)} />
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
              paddingVertical: 8,
            }}
          >
            <View style={{ width: NAME_COL, paddingLeft: 16 }}>
              <Text style={[type.label, { letterSpacing: 1 }]}>Logged</Text>
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
                      fontSize: 13,
                      color: d.due === 0 ? colors.ink3 : complete ? colors.signalInk : colors.ink2,
                    }}
                  >
                    {d.due === 0 ? "—" : `${d.done}/${d.due}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        </TourTarget>
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 8, marginTop: 16, paddingHorizontal: 2 }}>
        <LegendItem state="logged" label="Logged" />
        <LegendItem state="due" label="Due" />
        <LegendItem state="missed" label="Not logged" />
        <LegendItem state="scheduled" label="Upcoming" />
        <LegendItem state="none" label="Off day" />
      </View>

      {matrix.lanes.length > 0 && (
        <View style={{ marginTop: space.xxl }}>
          <Panel pad={space.lg}>
            <ProtocolMatrix matrix={matrix} />
          </Panel>
        </View>
      )}
    </ScrollView>
  );
}

function LegendItem({ state, label }: { state: CellState; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <StateMark state={state} />
      <Text style={type.meta}>{label}</Text>
    </View>
  );
}
