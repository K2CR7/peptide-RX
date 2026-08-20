import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CircularProgress } from "../components/CircularProgress";
import { CheckMark } from "../components/icons";
import { InjectionSitePicker } from "../components/InjectionSitePicker";
import { useInjectionLogs, useLogInjection, useStackItems } from "../lib/queries";
import { todayDow } from "../lib/schedule";
import { useAuthStore } from "../store/authStore";
import { colors, font, panel, radii, type } from "../theme";

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function HomeScreen() {
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

  const dateStamp = new Date()
    .toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32, gap: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View>
            <Text style={type.label}>{dateStamp} · DAY {dayCount}</Text>
            <Text style={[type.title, { marginTop: 4 }]}>
              {user?.name ? user.name : "Tonight's readout"}
            </Text>
          </View>
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
                  style={({ pressed }) => [
                    panel,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      borderRadius: radii.lg,
                      padding: 15,
                      backgroundColor: done ? colors.signalFaint : colors.panel,
                      borderColor: done ? colors.signalDim : colors.hairline,
                      opacity: pressed && !done ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: done ? colors.signal : "transparent",
                      borderWidth: done ? 0 : 1.5,
                      borderColor: colors.hairline2,
                    }}
                  >
                    {done && <CheckMark size={13} color={colors.onSignal} />}
                  </View>
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
                </Pressable>
              );
            })}
          </View>
        </View>
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
