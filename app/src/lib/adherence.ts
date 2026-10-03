import { cycleState } from "./cycle";

const DAY_MS = 24 * 3600 * 1000;
const LOOKBACK_DAYS = 240;

function startOfDay(d: Date | number): number {
  return new Date(d).setHours(0, 0, 0, 0);
}

function dayOfWeek(d: Date): number {
  const x = d.getDay();
  return x === 0 ? 7 : x;
}

export interface DayRecord {
  date: Date;
  /** Doses the schedule called for that day, cycle-aware. */
  due: number;
  done: number;
}

export interface AdherenceSummary {
  /** Oldest to newest, `windowDays` long, ending today. */
  days: DayRecord[];
  due: number;
  done: number;
  /** null when nothing was ever due in the window — don't show 0%. */
  pct: number | null;
  streak: number;
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

/**
 * Adherence over a trailing window, and the current streak.
 *
 * Three rules make the numbers honest rather than flattering:
 *  - A day before an item existed can't be a missed dose for it.
 *  - A day in an item's off phase was never due, so it neither counts
 *    against adherence nor breaks a streak.
 *  - Today is excluded from the percentage and cannot break a streak: the
 *    day isn't over, and a half-finished day is not a miss.
 */
export function computeAdherence(
  items: ScheduledItem[],
  logs: LoggedDose[],
  windowDays = 30,
  now: Date = new Date(),
): AdherenceSummary {
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

  const todayKey = startOfDay(now);
  const span = Math.max(windowDays, LOOKBACK_DAYS);
  const all: DayRecord[] = [];

  for (let i = span - 1; i >= 0; i--) {
    const key = todayKey - i * DAY_MS;
    const date = new Date(key);
    const dow = dayOfWeek(date);
    const logged = loggedByDay.get(key) ?? new Set<string>();

    let due = 0;
    let done = 0;
    items.forEach((item) => {
      if (!item.scheduleDays.includes(dow)) return;
      if (startOfDay(new Date(item.startedAt)) > key) return;
      const cycle = cycleState(item.startedAt, item.cycleOnDays, item.cycleOffDays, date);
      if (cycle?.phase === "off") return;
      due += 1;
      if (logged.has(item.id)) done += 1;
    });

    all.push({ date, due, done });
  }

  const days = all.slice(-windowDays);

  // Percentage over completed days only.
  const settled = days.slice(0, -1);
  const due = settled.reduce((n, d) => n + d.due, 0);
  const done = settled.reduce((n, d) => n + d.done, 0);

  let streak = 0;
  for (let i = all.length - 1; i >= 0; i--) {
    const d = all[i];
    const isToday = i === all.length - 1;
    if (d.due === 0) continue; // rest or off-cycle day: neutral
    if (d.done >= d.due) {
      streak += 1;
      continue;
    }
    if (isToday) continue; // today isn't over yet
    break;
  }

  return {
    days,
    due,
    done,
    pct: due > 0 ? Math.round((done / due) * 100) : null,
    streak,
  };
}
