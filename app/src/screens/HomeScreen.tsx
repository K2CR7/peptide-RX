import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircularProgress } from "../components/CircularProgress";
import { ChevronRight, MarkLogged, SparkIcon } from "../components/icons";
import { AssistantSheet } from "../components/AssistantSheet";
import { InjectionSitePicker } from "../components/InjectionSitePicker";
import { getNextSite, getRouteKey, siteHistory, siteLabel } from "../lib/injectionSites";
import { type StackItem, useInjectionLogs, useLogInjection, useStackItems } from "../lib/queries";
import { type CycleState, cycleState, describeCycle, describeRemaining } from "../lib/cycle";
import { computeAdherence } from "../lib/adherence";
import { todayDow } from "../lib/schedule";
import { useAuthStore } from "../store/authStore";
import { AsyncBlock, ErrorText, Panel, SectionLabel } from "../components/primitives";
import { colors, font, panel, radii, space, type } from "../theme";

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function relativeDay(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  if (isSameDay(then, now)) return "Today";
  const days = Math.round((now.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
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

  // Rotation is the product's core differentiator, so the readout carries it:
  // where the last few injections landed, and which site is up next.
  const rotation = useMemo(() => {
    const injectable = (items ?? []).filter((i) => {
      const key = getRouteKey(i.route);
      return key !== "Oral" && key !== "Nasal spray";
    });
    if (injectable.length === 0) return null;
    const routeKey = getRouteKey(injectable[0].route);
    const injectableIds = new Set(injectable.map((i) => i.id));
    const logs = (allLogs ?? []).filter((l) => injectableIds.has(l.stackItemId));
    const recent = [...logs].sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
    const next = getNextSite(routeKey, siteHistory([...recent].reverse()));
    return { next, recent: recent.slice(0, 3) };
  }, [items, allLogs]);

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
            <Text style={type.title}>{user?.name ? `Hey, ${user.name}` : "Tonight's readout"}</Text>
            <Text style={[type.meta, { marginTop: 4 }]}>{dateStamp} · Day {dayCount}</Text>
          </View>
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
            <SparkIcon size={20} color={colors.signal} />
          </Pressable>
        </View>

        <View
          style={[
            panel,
            {
              padding: 24,
              alignItems: "center",
              backgroundColor: allDone ? colors.signalFaint : colors.panel,
              borderColor: allDone ? colors.signalDim : colors.hairline,
            },
          ]}
        >
          <CircularProgress
            progress={progress}
            label={dueToday.length > 0 ? `${doneCount}/${dueToday.length}` : "—"}
            sublabel={allDone ? "protocol complete" : "doses logged"}
          />
        </View>

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
                emptyText="Nothing due today. Add items to your stack to see them here."
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
                    <MarkLogged size={24} color={colors.signal} />
                  ) : (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: colors.hairline2,
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
                      color: done ? colors.signal : colors.ink2,
                      letterSpacing: 0.3,
                    }}
                  >
                    {item.dose}
                    <Text style={{ fontSize: 13, color: colors.ink3 }}> {item.unit}</Text>
                  </Text>

                  {done ? (
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 11,
                        color: colors.signal,
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
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.signalDim,
                        backgroundColor: colors.signalFaint,
                      }}
                    >
                      <Text style={{ fontFamily: font.bold, fontSize: 13, color: colors.signal, letterSpacing: 0.3 }}>
                        Log
                      </Text>
                      <ChevronRight size={13} color={colors.signal} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Shown as soon as there's a stack. A brand-new stack has no settled
            days behind it yet, so the percentage reads "—" rather than the
            whole panel vanishing — the streak still counts today, and a
            missing panel reads like a bug. */}
        {(items?.length ?? 0) > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={type.label}>Consistency</Text>
            <View style={[panel, { padding: 20 }]}>
              <View style={{ flexDirection: "row", gap: 24 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: font.numeral,
                      fontSize: 38,
                      color: adherence.pct !== null ? colors.ink : colors.ink3,
                      letterSpacing: -0.5,
                    }}
                  >
                    {adherence.pct ?? "—"}
                    {adherence.pct !== null && <Text style={{ fontSize: 17, color: colors.ink3 }}>%</Text>}
                  </Text>
                  <Text style={type.meta}>
                    {adherence.pct !== null ? "last 7 days" : "no full days yet"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: font.numeral,
                      fontSize: 38,
                      letterSpacing: -0.5,
                      color: adherence.streak > 0 ? colors.signal : colors.ink2,
                    }}
                  >
                    {adherence.streak}
                  </Text>
                  <Text style={type.meta}>
                    day{adherence.streak === 1 ? "" : "s"} in a row
                  </Text>
                </View>
              </View>

              {/* The same seven days the percentage covers, newest on the
                  right, ending yesterday. A day with nothing due
                  reads as a recessed rule, not a miss. */}
              <View style={{ flexDirection: "row", gap: 3, marginTop: 16, alignItems: "flex-end" }}>
                {adherence.days.map((d, i) => {
                  // Every day here is settled, so a miss is simply a miss.
                  const complete = d.due > 0 && d.done >= d.due;
                  const missed = d.due > 0 && d.done < d.due;
                  return (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        height: d.due === 0 ? 3 : 18,
                        borderRadius: 2,
                        backgroundColor: complete
                          ? colors.signal
                          : missed
                            ? colors.amber
                            : colors.hairline2,
                      }}
                    />
                  );
                })}
              </View>
              <Text style={[type.metaSm, { marginTop: 8 }]}>
                {adherence.pct !== null
                  ? "Last 7 days · thin marks are rest days"
                  : "Your first scheduled day will show here tomorrow"}
              </Text>
            </View>
          </View>
        )}

        {cycles.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={type.label}>Cycles</Text>
            <View style={[panel, { overflow: "hidden" }]}>
              {cycles.map(({ item, cycle }, i) => {
                const off = cycle.phase === "off";
                const tone = off ? colors.amber : colors.signal;
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
                {restingToday.map((i) => i.peptideName).join(", ")}{" "}
                {restingToday.length === 1 ? "is" : "are"} scheduled today but resting — not counted above.
              </Text>
            )}
          </View>
        )}

        {rotation?.next && (
          <View style={{ gap: 12 }}>
            <Text style={type.label}>Site rotation</Text>
            <View style={[panel, { padding: 16 }]}>
              <Text style={type.meta}>Next site up</Text>
              <Text style={[type.heading, { color: colors.signal, marginTop: 3 }]}>
                {rotation.next.label}
              </Text>

              {rotation.recent.length > 0 && (
                <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 12, gap: 8 }}>
                  {rotation.recent.filter((l) => l.site).map((log) => (
                    <View key={log.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.ink3 }} />
                        <Text style={type.bodySm}>{siteLabel(log.site!)}</Text>
                      </View>
                      <Text style={type.meta}>{relativeDay(log.takenAt)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

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
              { onError: () => setLogError("Couldn't log that dose — check your connection and try again.") },
            );
            setInjectFor(null);
          }}
        />
      )}
    </View>
  );
}
