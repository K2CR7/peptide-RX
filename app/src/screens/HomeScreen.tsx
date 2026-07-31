import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CircularProgress } from "../components/CircularProgress";
import { InjectionSitePicker } from "../components/InjectionSitePicker";
import { useInjectionLogs, useLogInjection, useStackItems } from "../lib/queries";
import { todayDow } from "../lib/schedule";
import { useAuthStore } from "../store/authStore";
import { colors, radii } from "../theme";

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

  const dayCount = useMemo(() => {
    if (!items || items.length === 0) return 1;
    const earliest = Math.min(...items.map((i) => new Date(i.startedAt).getTime()));
    return Math.max(1, Math.floor((Date.now() - earliest) / (24 * 3600 * 1000)) + 1);
  }, [items]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 16 }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>
            Hey{user?.name ? `, ${user.name}` : ""}
          </Text>
          <Text style={{ color: colors.ink3, marginTop: 2 }}>Day {dayCount} of your stack</Text>
        </View>

        <View style={{ backgroundColor: colors.white, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: "center" }}>
          <CircularProgress
            progress={progress}
            label={dueToday.length > 0 ? `${doneCount}/${dueToday.length}` : "—"}
            sublabel="logged today"
          />
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink3, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
            Today
          </Text>

          {dueToday.length === 0 && (
            <View style={{ backgroundColor: colors.white, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.ink3 }}>Nothing due today. Add items to your stack to get started.</Text>
            </View>
          )}

          <View style={{ gap: 8 }}>
            {dueToday.map((item) => {
              const done = loggedTodayIds.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => !done && setInjectFor({ id: item.id, route: item.route })}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    backgroundColor: done ? colors.tealLight : colors.white,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: done ? colors.tealMid : colors.border,
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: done ? colors.teal : colors.bg,
                      borderWidth: done ? 0 : 1.5,
                      borderColor: colors.border2,
                    }}
                  >
                    {done && <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13 }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "800", color: colors.ink, fontSize: 15 }}>{item.peptideName}</Text>
                    <Text style={{ color: colors.ink3, fontSize: 12, marginTop: 1 }}>{item.frequency}</Text>
                  </View>
                  <View style={{ backgroundColor: done ? colors.teal : colors.bg, borderRadius: radii.sm, paddingVertical: 5, paddingHorizontal: 10 }}>
                    <Text style={{ color: done ? "#fff" : colors.ink2, fontWeight: "700", fontSize: 12 }}>
                      {item.dose} {item.unit}
                    </Text>
                  </View>
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
