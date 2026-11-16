import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TodayHero } from "../components/TodayHero";
import { ChevronRight, GearIcon, MarkLogged, SparkIcon } from "../components/icons";
import { AssistantSheet } from "../components/AssistantSheet";
import { SettingsSheet } from "../components/SettingsSheet";
import { StreakHeader } from "../components/StreakCard";
import { InjectionSitePicker } from "../components/InjectionSitePicker";
import { SiteMap } from "../components/SiteMap";
import { ROUTE_SITES, getNextSite, getRouteKey, siteHistory } from "../lib/injectionSites";
import { doseParts, speakDose } from "../lib/dose";
import { type StackItem, useAppOpens, useInjectionLogs, useLogInjection, useStackItems } from "../lib/queries";
import { type CycleState, cycleState, describeCycle, describeRemaining } from "../lib/cycle";
import { computeAdherence } from "../lib/adherence";
import { computeStreak } from "../lib/streak";
import { mondayOfThisWeek, todayDow } from "../lib/schedule";
import { useAuthStore } from "../store/authStore";
import { AsyncBlock, ErrorText, Panel, SectionLabel } from "../components/primitives";
import { TourTarget } from "../components/tour";
import { colors, font, panel, radii, space, type } from "../theme";

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: items, isLoading, isError, refetch } = useStackItems();
  const { data: allLogs } = useInjectionLogs();
  const logInjection = useLogInjection();
  const [logError, setLogError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const [injectFor, setInjectFor] = useState<{ id: string; route: string | null } | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const today = todayDow();

  // An item in its off phase isn't due, however its weekday schedule reads —
  // the cycle outranks the weekly pattern.
  const cycles = useMemo(
    () =>
      (items ?? [])
        .map((i) => ({ item: i, cycle: cycleState(i.startedAt, i.cycleOnDays, i.cycleOffDays) }))
        .filter((c): c is { item: StackItem; cycle: CycleState } => c.cycle !== null),
    [items],
  );

  const offIds = useMemo(
    () => new Set(cycles.filter((c) => c.cycle.phase === "off").map((c) => c.item.id)),
    [cycles],
  );

  const dueToday = useMemo(
    () => (items ?? []).filter((i) => i.scheduleDays.includes(today) && !offIds.has(i.id)),
    [items, today, offIds],
  );

  const restingToday = useMemo(
    () => (items ?? []).filter((i) => i.scheduleDays.includes(today) && offIds.has(i.id)),
    [items, today, offIds],
  );

  const loggedTodayIds = useMemo(() => {
    const now = new Date();
    const ids = new Set<string>();
    (allLogs ?? []).forEach((log) => {
      if (isSameDay(new Date(log.takenAt), now)) ids.add(log.stackItemId);
    });
    return ids;
  }, [allLogs]);

  const doneCount = dueToday.filter((i) => loggedTodayIds.has(i.id)).length;
  const progress = dueToday.length > 0 ? doneCount / dueToday.length : 0;
  const allDone = dueToday.length > 0 && doneCount === dueToday.length;

  const dayCount = useMemo(() => {
    if (!items || items.length === 0) return 1;
    const earliest = Math.min(...items.map((i) => new Date(i.startedAt).getTime()));
    return Math.max(1, Math.floor((Date.now() - earliest) / (24 * 3600 * 1000)) + 1);
  }, [items]);

  /*
    Rotation is the product's core differentiator, so the readout carries it:
    where this week's injections landed on the body, and which site is next.

    The window is Monday to now, which is the same week the Week tab draws.
    A rolling seven days would be defensible and is worse here, because it
    puts a boundary in the middle of the grid the user just looked at: a dose
    could be inside this panel's window and outside that one's.

    The site LIST comes from the first injectable item's route rather than
    from the union of every route in the stack. A stack running one SubQ and
    one IM peptide genuinely has two rotations over two different site sets,
    and overlaying them would draw abdominal sites and glutes on one figure
    as though they were one cycle. One route, drawn correctly, beats two
    merged into a diagram that is true of neither.
  */
  const rotation = useMemo(() => {
    const injectable = (items ?? []).filter((i) => {
      const key = getRouteKey(i.route);
      return key !== "Oral" && key !== "Nasal spray";
    });
    if (injectable.length === 0) return null;

    const routeKey = getRouteKey(injectable[0].route);
    const sites = ROUTE_SITES[routeKey];
    if (sites.length === 0) return null;

    const injectableIds = new Set(injectable.map((i) => i.id));
    const logs = (allLogs ?? [])
      .filter((l) => injectableIds.has(l.stackItemId))
      .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());

    // getNextSite reads the tail of the history, so it has to arrive oldest
    // first. Handed the reverse it recommends the site just used.
    const next = getNextSite(routeKey, siteHistory(logs));

    const weekStart = mondayOfThisWeek().setHours(0, 0, 0, 0);
    const usedThisWeek: Record<string, number> = {};
    let count = 0;
    logs.forEach((log) => {
      if (!log.site) return;
      if (new Date(log.takenAt).getTime() < weekStart) return;
      usedThisWeek[log.site] = (usedThisWeek[log.site] ?? 0) + 1;
      count += 1;
    });

    return { sites, next, usedThisWeek, count };
  }, [items, allLogs]);

  // Opening the app is what a rest day is counted from, so this fires on
  // mount and seeds the streak.
  const { data: openDays } = useAppOpens();

  const streak = useMemo(
    () => computeStreak(items ?? [], allLogs ?? [], openDays ?? []),
    [items, allLogs, openDays],
  );

  const adherence = useMemo(
    () => computeAdherence(items ?? [], allLogs ?? [], 7),
    [items, allLogs],
  );


  // The assistant answers against what is actually on screen, so it reports the
  // same numbers the user is looking at instead of re-deriving date math.
  const assistantContext = useMemo(() => {
    const lines: string[] = [
      `Today: ${doneCount} of ${dueToday.length} due doses logged.`,
    ];
    if (adherence.pct !== null) {
      lines.push(
        `Adherence last 7 days: ${adherence.pct}% (${adherence.done} of ${adherence.due} doses). Current streak: ${adherence.streak} days.`,
      );
    }
    cycles.forEach(({ item, cycle }) => {
      lines.push(
        `${item.peptideName} cycle: ${cycle.phase} phase, ${describeCycle(cycle)}, ${describeRemaining(cycle)}.`,
      );
    });
    if (restingToday.length > 0) {
      lines.push(
        `Resting today (off cycle): ${restingToday.map((i) => i.peptideName).join(", ")}.`,
      );
    }
    if (rotation?.next) {
      lines.push(`Next injection site in rotation: ${rotation.next.label}.`);
    }
    return lines.join("\n");
  }, [doneCount, dueToday, adherence, cycles, restingToday, rotation]);

  const assistantSuggestions = useMemo(() => {
    const out: string[] = [];
    if (adherence.pct !== null) out.push(`Why is my adherence ${adherence.pct}%?`);
    if (cycles.length > 0) out.push(`When does my ${cycles[0].item.peptideName} cycle end?`);
    if (rotation?.next) out.push("Which site should I use next, and why that one?");
    out.push("What does the rest of my week look like?");
    return out;
  }, [adherence, cycles, rotation]);

  const dateStamp = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 32, gap: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            {/*
              The corner carries the streak, not the word "Today".

              A tab title restating the tab you just tapped is the one thing
              on a screen guaranteed to tell the reader nothing, and it was
              sitting in the position that costs the most to spend: first
              thing, top left, where the eye lands before it has decided
              where to look. The run of days goes there instead and the date
              drops to the line underneath, which is where a date belongs.

              With an empty stack the streak is 0, and "0 days on protocol"
              as the first thing in a new account reads as a scolding before
              anything has been asked of the user. That case keeps the title.
            */}
            {(items?.length ?? 0) > 0 ? (
              <StreakHeader streak={streak} settled={allLogs !== undefined && openDays !== undefined} />
            ) : (
              <Text style={type.title}>Today</Text>
            )}
            <Text style={[type.meta, { marginTop: 4 }]}>{dateStamp} · Day {dayCount}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            {/* Quiet, bordered only — settings should never compete with the
                assistant, which is the one thing up here worth reaching for. */}
            <Pressable
              onPress={() => setSettingsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.edge,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <GearIcon size={19} color={colors.ink2} />
            </Pressable>
            <Pressable
              onPress={() => setAskOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Ask about your data"
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.signalDim,
                backgroundColor: colors.signalFaint,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <SparkIcon size={20} color={colors.signalInk} />
            </Pressable>
          </View>
        </View>

        <TourTarget id="today-ring">
          <TodayHero
            done={doneCount}
            due={dueToday.length}
            dueNames={dueToday.filter((i) => !loggedTodayIds.has(i.id)).map((i) => i.peptideName)}
            restingToday={restingToday.length > 0}
          />
        </TourTarget>

        {/*
          The three-week matrix used to sit here, between the ring and the
          dose list. It has moved to the Week tab, which is the screen whose
          whole subject is the schedule drawn as a grid — the two were the
          same graphic at two window lengths on two tabs, and the longer one
          was pushing the thing you came to this screen to do below the fold.
          Today is for today.
        */}

        <View style={{ gap: space.md }}>
          <SectionLabel>Due today</SectionLabel>

          {/* "Nothing due today" is a claim about the data, so it must wait for
              the data. Previously this read only `data`, which meant an offline
              user with a full stack was told their stack was empty. */}
          {(isLoading || isError || dueToday.length === 0) && (
            <Panel pad={space.lg}>
              <AsyncBlock
                loading={isLoading}
                error={isError}
                isEmpty={dueToday.length === 0}
                emptyText="Nothing due today. Add items in Stack."
                onRetry={refetch}
              >
                <View />
              </AsyncBlock>
            </Panel>
          )}

          <ErrorText>{logError}</ErrorText>

          <View style={{ gap: space.sm }}>
            {dueToday.map((item) => {
              const done = loggedTodayIds.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => !done && setInjectFor({ id: item.id, route: item.route })}
                  disabled={done}
                  accessibilityRole="button"
                  accessibilityLabel={done ? `${item.peptideName} logged` : `Log ${item.peptideName}`}
                  style={({ pressed }) => [
                    panel,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      borderRadius: radii.lg,
                      paddingVertical: 16,
                      paddingLeft: 16,
                      paddingRight: 12,
                      minHeight: 64,
                      backgroundColor: done ? colors.signalFaint : colors.panel,
                      borderColor: done ? colors.signalDim : colors.hairline,
                      opacity: pressed && !done ? 0.72 : 1,
                    },
                  ]}
                >
                  {done ? (
                    <MarkLogged size={24} color={colors.signalInk} />
                  ) : (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: colors.edge,
                      }}
                    />
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={type.headingSm}>{item.peptideName}</Text>
                    <Text style={[type.meta, { marginTop: 1 }]}>{item.frequency}</Text>
                  </View>

                  <Text
                    style={{
                      fontFamily: font.numeralMedium,
                      fontSize: 17,
                      color: done ? colors.signalInk : colors.ink2,
                      letterSpacing: 0.3,
                    }}
                  >
                    {doseParts(item.dose, item.unit).value}
                    <Text style={type.unit}> {doseParts(item.dose, item.unit).unit}</Text>
                  </Text>

                  {done ? (
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 11,
                        color: colors.signalInk,
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                        marginLeft: 8,
                      }}
                    >
                      Logged
                    </Text>
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 2,
                        marginLeft: 8,
                        paddingVertical: 8,
                        paddingLeft: 12,
                        paddingRight: 8,
                        borderRadius: radii.md,
                        borderWidth: 1,
                        borderColor: colors.edge,
                        backgroundColor: colors.signalFaint,
                      }}
                    >
                      <Text style={{ fontFamily: font.bold, fontSize: 13, color: colors.signalInk, letterSpacing: 0.3 }}>
                        Log
                      </Text>
                      <ChevronRight size={13} color={colors.signalInk} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {cycles.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={type.label}>Cycles</Text>
            <View style={[panel, { overflow: "hidden" }]}>
              {cycles.map(({ item, cycle }, i) => {
                const off = cycle.phase === "off";
                const tone = off ? colors.amber : colors.signalInk;
                return (
                  <View
                    key={item.id}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colors.hairline,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                      <Text style={type.headingSm}>{item.peptideName}</Text>
                      <Text style={{ fontFamily: font.semibold, fontSize: 13, color: tone, letterSpacing: 0.4 }}>
                        {off ? "OFF" : "ON"}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 3 }}>
                      <Text style={type.meta}>{describeCycle(cycle)}</Text>
                      <Text style={type.meta}>{describeRemaining(cycle)}</Text>
                    </View>

                    <View
                      style={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: colors.panelRaised,
                        marginTop: 8,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.round(cycle.progress * 100)}%`,
                          height: "100%",
                          borderRadius: 2,
                          backgroundColor: tone,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {restingToday.length > 0 && (
              <Text style={type.meta}>
                Resting today, not counted above: {restingToday.map((i) => i.peptideName).join(", ")}
              </Text>
            )}
          </View>
        )}

        {rotation && (
          <Panel pad={space.lg}>
            <SiteMap
              sites={rotation.sites}
              usedThisWeek={rotation.usedThisWeek}
              nextId={rotation.next?.id ?? null}
              nextLabel={rotation.next?.label ?? null}
              count={rotation.count}
            />
          </Panel>
        )}
      </ScrollView>

      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <AssistantSheet
        visible={askOpen}
        onClose={() => setAskOpen(false)}
        context={assistantContext}
        suggestions={assistantSuggestions}
      />

      {injectFor && (
        <InjectionSitePicker
          visible
          route={injectFor.route}
          history={siteHistory((allLogs ?? []).filter((l) => l.stackItemId === injectFor.id)).reverse()}
          onClose={() => setInjectFor(null)}
          onConfirm={(site) => {
            // site is null for oral and nasal routes — there is nowhere to pin,
            // but the dose still happened, so it still gets logged.
            // A failure used to be invisible: the sheet closed either way and
            // the row just never flipped to Logged.
            setLogError(null);
            logInjection.mutate(
              { stackItemId: injectFor.id, site },
              { onError: () => setLogError("Couldn't log that dose. Check your connection and try again.") },
            );
            setInjectFor(null);
          }}
        />
      )}
    </View>
  );
}
