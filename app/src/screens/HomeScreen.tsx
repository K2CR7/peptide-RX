import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BodyToday, type PendingDose } from "../components/BodyToday";
import { ChevronRight, GearIcon, MarkLogged, MarkPartial, SparkIcon } from "../components/icons";
import { AssistantSheet } from "../components/AssistantSheet";
import { SettingsSheet } from "../components/SettingsSheet";
import { StreakHeader } from "../components/StreakCard";
import { InjectionSitePicker } from "../components/InjectionSitePicker";
import { doseSlotsForDay, dosesPerDay } from "../lib/doses";
import {
  type InjectionSite,
  ROUTE_SITES,
  daysSinceBySite,
  fixedSiteFor,
  getNextSite,
  getRouteKey,
  rotationHistory,
} from "../lib/injectionSites";
import { doseParts } from "../lib/dose";
import {
  type StackItem,
  useAppOpens,
  useInjectionLogs,
  useLogInjection,
  useStackItems,
} from "../lib/queries";
import { type CycleState, cycleState, describeCycle, describeRemaining } from "../lib/cycle";
import { computeAdherence } from "../lib/adherence";
import { computeStreak } from "../lib/streak";
import { todayDow } from "../lib/schedule";
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

  /*
    Today, one entry per expected DOSE.

    This was a Set of item ids and a count of items, which is why an item
    running twice a day could not be logged twice: the first log put its id
    in the set, the row went disabled, and the second dose had nowhere to go.
    See lib/doses.ts.
  */
  const slots = useMemo(() => doseSlotsForDay(items ?? [], allLogs ?? []), [items, allLogs]);

  const doneCount = slots.filter((s) => s.log !== null).length;

  /** Outstanding doses, in schedule order, for the list and the hero. */
  const openSlots = useMemo(() => slots.filter((s) => s.log === null), [slots]);

  /*
    Doses logged today per item, so a row can say "1 of 2" rather than
    flipping to done on the first one.
  */
  const doneByItem = useMemo(() => {
    const counts = new Map<string, number>();
    slots.forEach((s) => {
      if (s.log) counts.set(s.item.id, (counts.get(s.item.id) ?? 0) + 1);
    });
    return counts;
  }, [slots]);

  const dayCount = useMemo(() => {
    if (!items || items.length === 0) return 1;
    const earliest = Math.min(...items.map((i) => new Date(i.startedAt).getTime()));
    return Math.max(1, Math.floor((Date.now() - earliest) / (24 * 3600 * 1000)) + 1);
  }, [items]);

  /*
    The figure, which is now the screen rather than a panel at the bottom of
    it: which sites exist, what went where today, and how long each spot has
    been resting.

    ONE ROTATING ROUTE, PLUS EVERY FIXED SITE. A stack running one SubQ and
    one IM peptide genuinely has two rotations over two different site sets,
    and overlaying them would draw abdominal sites and glutes on one figure
    as though they were one cycle — so the rotating set still comes from a
    single route, the first in the stack.

    Fixed sites are a different case and are always added. The mouth and the
    nose take part in no rotation, so putting them on a SubQ figure cannot
    corrupt one, and leaving them off is what used to make an oral peptide
    vanish from its own body diagram.
  */
  const body = useMemo(() => {
    const routeKeys = (items ?? []).map((i) => getRouteKey(i.route));
    if (routeKeys.length === 0) return null;

    const rotatingKey = routeKeys.find((k) => fixedSiteFor(k) === null) ?? null;
    const rotatingSites = rotatingKey ? ROUTE_SITES[rotatingKey] : [];

    const fixed = [...new Set(routeKeys)]
      .map((k) => fixedSiteFor(k))
      .filter((s): s is InjectionSite => s !== null);

    const sites = [...rotatingSites, ...fixed];
    if (sites.length === 0) return null;

    /*
      Every dose that pinned a site, not just this route's peptides — see
      rotationHistory in lib/injectionSites.ts. The picker is handed the same
      history, and the two MUST agree: the figure announces where the
      rotation goes next, and opening the list has to land on that same site
      rather than on a second opinion.
    */
    const next = rotatingKey
      ? getNextSite(rotatingKey, rotationHistory(allLogs ?? [], rotatingKey))
      : null;

    /*
      Today only. The figure could carry the week, which is the better
      rotation picture in the abstract and is also exactly what the Week tab
      draws; on this screen the question is what happened today.

      Counted against the sites this figure actually draws: a dose into a
      glute while the map shows a SubQ route has nowhere to be drawn, and a
      count printed over marks that do not include it is a header calling its
      own diagram a liar.
    */
    const drawable = new Set(sites.map((s) => s.id));
    const now = new Date();
    const usedToday: Record<string, number> = {};
    (allLogs ?? []).forEach((log) => {
      if (!log.site || !drawable.has(log.site)) return;
      if (!isSameDay(new Date(log.takenAt), now)) return;
      usedToday[log.site] = (usedToday[log.site] ?? 0) + 1;
    });

    return { sites, next, usedToday, daysSince: daysSinceBySite(allLogs ?? []) };
  }, [items, allLogs]);

  /*
    Outstanding doses, one entry per item, for the buttons in the figure's
    confirm bar. Deduped because three outstanding doses of one peptide is
    one button, not three — the bar logs one dose per press and the count
    line above it is what says how many are left.
  */
  const pending = useMemo(() => {
    const seen = new Set<string>();
    const out: PendingDose[] = [];
    openSlots.forEach((s) => {
      if (seen.has(s.item.id)) return;
      seen.add(s.item.id);
      out.push({
        stackItemId: s.item.id,
        name: s.item.peptideName,
        routeKey: getRouteKey(s.item.route),
      });
    });
    return out;
  }, [openSlots]);

  /*
    One writer for both paths into the log, so the body figure and the picker
    cannot drift on error handling. A failure used to be invisible on the
    picker path: the sheet closed either way and the row just never flipped.
  */
  function logDose(stackItemId: string, site: string | null) {
    setLogError(null);
    logInjection.mutate(
      { stackItemId, site },
      { onError: () => setLogError("Couldn't log that dose. Check your connection and try again.") },
    );
  }

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
      `Today: ${doneCount} of ${slots.length} due doses logged.`,
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
    if (body?.next) {
      lines.push(`Next injection site in rotation: ${body.next.label}.`);
    }
    return lines.join("\n");
  }, [doneCount, slots, adherence, cycles, restingToday, body]);

  const assistantSuggestions = useMemo(() => {
    const out: string[] = [];
    if (adherence.pct !== null) out.push(`Why is my adherence ${adherence.pct}%?`);
    if (cycles.length > 0) out.push(`When does my ${cycles[0].item.peptideName} cycle end?`);
    if (body?.next) out.push("Which site should I use next, and why that one?");
    out.push("What does the rest of my week look like?");
    return out;
  }, [adherence, cycles, body]);

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

        {body && (
          <TourTarget id="today-ring">
            <Panel pad={space.lg}>
              <BodyToday
                sites={body.sites}
                usedToday={body.usedToday}
                daysSince={body.daysSince}
                next={body.next}
                done={doneCount}
                due={slots.length}
                pending={pending}
                onLog={logDose}
                /* The accessibility path out of the diagram, and the way to
                   override the recommendation. It opens on the first
                   outstanding dose; the rows below are how you reach a
                   specific one. */
                onOpenList={() =>
                  pending.length > 0 &&
                  setInjectFor({
                    id: pending[0].stackItemId,
                    route: items?.find((i) => i.id === pending[0].stackItemId)?.route ?? null,
                  })
                }
              />
            </Panel>
          </TourTarget>
        )}

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
            {/*
              One row per item, not per dose.

              An item due three times a day would otherwise draw three
              identical rows, which reads as three different things to do.
              The row carries its own progress instead and stays tappable
              until the last dose is in.
            */}
            {dueToday.map((item) => {
              const want = dosesPerDay(item);
              const got = doneByItem.get(item.id) ?? 0;
              const done = got >= want;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => !done && setInjectFor({ id: item.id, route: item.route })}
                  disabled={done}
                  accessibilityRole="button"
                  accessibilityLabel={
                    done
                      ? `${item.peptideName} logged`
                      : want > 1
                        ? `Log ${item.peptideName}, ${got} of ${want} doses logged`
                        : `Log ${item.peptideName}`
                  }
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
                  ) : got > 0 ? (
                    /* Started, not finished. Same mark the week grid and the
                       matrix use for a partly-logged day. */
                    <MarkPartial size={24} color={colors.signalInk} />
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
                    <Text style={[type.meta, { marginTop: 1 }]}>
                      {/* The free-text frequency is what the user wrote and
                          stays the subtitle; the count is what the app
                          actually tracked, so it is appended rather than
                          replacing it. */}
                      {want > 1 ? `${item.frequency} · ${got} of ${want}` : item.frequency}
                    </Text>
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
          history={rotationHistory(allLogs ?? [], getRouteKey(injectFor.route))}
          onClose={() => setInjectFor(null)}
          onConfirm={(site) => {
            // An oral or nasal route returns its FIXED site id rather than
            // null now, so the dose lands on the body diagram at the mouth
            // or the nose instead of being recorded nowhere. null is still
            // possible for a route with no site at all.
            logDose(injectFor.id, site);
            setInjectFor(null);
          }}
        />
      )}
    </View>
  );
}
