/*
Days on protocol.

The rule, stated once so the UI never has to guess:

  a day the protocol asked for a dose  →  kept if that dose was logged
  a day it asked for nothing           →  kept if the app was opened
  a day a dose was due and not logged  →  breaks the run

The second line is the one worth defending. On a rest day there is no dose,
so there is nothing a user could do to prove the day was kept — opening the
app is the only signal that exists. That is also why the number is labelled
"days on protocol" and never "adherence": it is a run of days the protocol
was followed, and on a rest day following it means doing nothing.

Today is a third state, neither kept nor broken, and that distinction is the
whole shape of this file. A day with a dose still outstanding must not break
the run — telling someone at 9am that they have lost a fortnight because
tonight's injection isn't logged yet is simply wrong. But it must not count
either, because the ticker going up is the reward for finishing the day. So
an unresolved today is skipped: the run is whatever it was last night, and
logging the dose is what pushes it over.
*/
import { cycleState } from "./cycle";

const DAY_MS = 24 * 3600 * 1000;
const LOOKBACK_DAYS = 400;

function startOfDay(d: Date | number): number {
  return new Date(d).setHours(0, 0, 0, 0);
}

function dayOfWeek(d: Date): number {
  const x = d.getDay();
  return x === 0 ? 7 : x;
}

/** "2026-11-07" in local time, to compare against the server's day list. */
function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** What kept a day — the celebration says different things for each. */
export type KeptBy = "dose" | "rest";

export interface StreakSummary {
  /** The run of consecutive kept days, including today once today is kept. */
  current: number;
  /** The best run anywhere in the window. */
  longest: number;
  /** True once today counts — the dose is logged, or it's a rest day. */
  todayKept: boolean;
  /** What kept today, for the copy. Null while today is still outstanding. */
  todayKind: KeptBy | null;
  /** True when a dose is due today and not yet logged. */
  todayPending: boolean;
}

interface ScheduledItem {
  id: string;
  scheduleDays: number[];
  startedAt: string;
  cycleOnDays: number | null;
  cycleOffDays: number | null;
}

interface LoggedDose {
  stackItemId: string;
  takenAt: string;
}

export function computeStreak(
  items: ScheduledItem[],
  logs: LoggedDose[],
  openedDays: string[],
  now: Date = new Date(),
): StreakSummary {
  const loggedByDay = new Map<number, Set<string>>();
  logs.forEach((log) => {
    const key = startOfDay(new Date(log.takenAt));
    let set = loggedByDay.get(key);
    if (!set) {
      set = new Set<string>();
      loggedByDay.set(key, set);
    }
    set.add(log.stackItemId);
  });

  const opened = new Set(openedDays);
  const todayKey = startOfDay(now);

  /** null means unresolved — only ever today. */
  function evaluate(key: number): { kept: boolean; by: KeptBy | null } | null {
    const date = new Date(key);
    const dow = dayOfWeek(date);
    const logged = loggedByDay.get(key) ?? new Set<string>();

    let due = 0;
    let done = 0;
    items.forEach((item) => {
      if (!item.scheduleDays.includes(dow)) return;
      // A day before an item existed can't be a miss for it.
      if (startOfDay(new Date(item.startedAt)) > key) return;
      // An off-phase day was never due, however the weekday schedule reads.
      const cycle = cycleState(item.startedAt, item.cycleOnDays, item.cycleOffDays, date);
      if (cycle?.phase === "off") return;
      due += 1;
      if (logged.has(item.id)) done += 1;
    });

    if (due > 0) {
      if (done >= due) return { kept: true, by: "dose" };
      // Still time left on the clock: neither earned nor lost.
      if (key === todayKey) return null;
      return { kept: false, by: null };
    }

    // No dose asked for. Today is open by definition — they are looking at
    // the app right now — so it doesn't wait on the server round-trip.
    if (key === todayKey || opened.has(isoDay(date))) return { kept: true, by: "rest" };
    return { kept: false, by: null };
  }

  const today = evaluate(todayKey);

  // The run of finished days behind today.
  let completed = 0;
  for (let i = 1; i < LOOKBACK_DAYS; i++) {
    const day = evaluate(todayKey - i * DAY_MS);
    if (!day?.kept) break;
    completed += 1;
  }

  // Longest run anywhere in the window. An unresolved today is a gap rather
  // than a break, so it neither extends nor cuts a historic best.
  let longest = 0;
  let run = 0;
  for (let i = LOOKBACK_DAYS - 1; i >= 0; i--) {
    const day = evaluate(todayKey - i * DAY_MS);
    if (!day) continue;
    run = day.kept ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  const todayKept = today?.kept === true;

  return {
    current: completed + (todayKept ? 1 : 0),
    longest,
    todayKept,
    todayKind: today?.by ?? null,
    todayPending: today === null,
  };
}
