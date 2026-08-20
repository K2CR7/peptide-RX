import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircularProgress } from "../components/CircularProgress";
import { ChevronRight, MarkLogged } from "../components/icons";
import { InjectionSitePicker } from "../components/InjectionSitePicker";
import { getNextSite, getRouteKey, siteLabel } from "../lib/injectionSites";
import { useInjectionLogs, useLogInjection, useStackItems } from "../lib/queries";
import { todayDow } from "../lib/schedule";
import { useAuthStore } from "../store/authStore";
import { colors, font, panel, radii, type } from "../theme";

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
  const { data: items } = useStackItems();
  const { data: allLogs } = useInjectionLogs();
  const logInjection = useLogInjection();
  const user = useAuthStore((s) => s.user);
  const [injectFor, setInjectFor] = useState<{ id: string; route: string | null } | null>(null);

  const today = todayDow();
  const dueToday = useMemo(() => (items ?? []).filter((i) => i.scheduleDays.includes(today)), [items, today]);

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
    const next = getNextSite(routeKey, [...recent].reverse().map((l) => l.site));
    return { next, recent: recent.slice(0, 3) };
  }, [items, allLogs]);

  const dateStamp = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 32, gap: 20 }}>
        <View>
          <Text style={type.title}>{user?.name ? `Hey, ${user.name}` : "Tonight's readout"}</Text>
          <Text style={[type.meta, { marginTop: 4 }]}>{dateStamp} · Day {dayCount}</Text>
        </View>

        <View
          style={[
            panel,
            {
              padding: 26,
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

        <View style={{ gap: 10 }}>
          <Text style={type.label}>Due today</Text>

          {dueToday.length === 0 && (
            <View style={[panel, { padding: 18 }]}>
              <Text style={type.body}>Nothing due today. Add items to your stack to see them here.</Text>
            </View>
          )}

          <View style={{ gap: 8 }}>
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
                      gap: 13,
                      borderRadius: radii.lg,
                      paddingVertical: 14,
                      paddingLeft: 15,
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
                    <Text style={[type.heading, { fontSize: 15.5 }]}>{item.peptideName}</Text>
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
                    <Text style={{ fontSize: 12, color: colors.ink3 }}> {item.unit}</Text>
                  </Text>

                  {done ? (
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 10.5,
                        color: colors.signal,
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                        marginLeft: 6,
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
                        marginLeft: 6,
                        paddingVertical: 6,
                        paddingLeft: 10,
                        paddingRight: 7,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.signalDim,
                        backgroundColor: colors.signalFaint,
                      }}
                    >
                      <Text style={{ fontFamily: font.bold, fontSize: 12, color: colors.signal, letterSpacing: 0.3 }}>
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

        {rotation?.next && (
          <View style={{ gap: 10 }}>
            <Text style={type.label}>Site rotation</Text>
            <View style={[panel, { padding: 16 }]}>
              <Text style={[type.meta, { fontSize: 12 }]}>Next site up</Text>
              <Text style={[type.heading, { fontSize: 17, color: colors.signal, marginTop: 3 }]}>
                {rotation.next.label}
              </Text>

              {rotation.recent.length > 0 && (
                <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 12, gap: 9 }}>
                  {rotation.recent.map((log) => (
                    <View key={log.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 9, flex: 1 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.ink3 }} />
                        <Text style={[type.body, { fontSize: 13.5 }]}>{siteLabel(log.site)}</Text>
                      </View>
                      <Text style={[type.meta, { fontSize: 12 }]}>{relativeDay(log.takenAt)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {injectFor && (
        <InjectionSitePicker
          visible
          route={injectFor.route}
          history={(allLogs ?? []).filter((l) => l.stackItemId === injectFor.id).map((l) => l.site).reverse()}
          onClose={() => setInjectFor(null)}
          onConfirm={(site) => {
            if (site) logInjection.mutate({ stackItemId: injectFor.id, site });
            setInjectFor(null);
          }}
        />
      )}
    </View>
  );
}
