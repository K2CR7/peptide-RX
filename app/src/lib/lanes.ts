/*
The protocol as a matrix: one lane per peptide, one column per day.

The app already computed all of this and threw it away. `computeAdherence`
walks 240 days, cycle-aware, and returns a single percentage; the per-day,
per-item detail it built on the way is discarded. A percentage answers "how
am I doing" and nothing else. The same data drawn as lanes answers the
question a protocol actually raises — *where* do I slip. Always Thursdays?
Always the second peptide? Always the week the cycle turns?

That is also why this is a matrix and not a calendar. A 7-wide calendar grid
spends a phone's whole width on one week and can only show one state per day
for the whole stack. Twenty-eight narrow columns against a handful of lanes
fits the same screen and holds far more.

A day that was never scheduled draws NOTHING. Not a grey cell, not a faint
one — nothing. "No dose was due" and "a dose was due and missed" are
different facts, and giving the first one a mark is the zero-versus-null
error that makes a chart lie.

The same rule, applied once more, is why this takes a record start.

The first build drew every scheduled day before the user's first log as a
miss, because the schedule said a dose was due and no log existed. On a real
account that meant four weeks of amber on the day the app was installed: the
protocol had been running for months, the tracking had not. "Not recorded"
and "not taken" are as different as zero and null, and an app that cannot
tell them apart will accuse its user of 57 missed doses it has no evidence
for. Nothing before the first log is drawn at all.
*/
import { cycleState } from "./cycle";

const DAY_MS = 24 * 3600 * 1000;

function startOfDay(d: Date | number): number {
  return new Date(d).setHours(0, 0, 0, 0);
}

function dayOfWeek(d: Date): number {
  const x = d.getDay();
  return x === 0 ? 7 : x;
}

export type CellState =
  /** Due, and logged. */
  | "logged"
  /** Due, not logged, and the day is over. */
  | "missed"
  /** Due today, still outstanding — not a miss yet. */
  | "pending"
  /** The item's cycle was off-phase. Never due; not a failure. */
  | "off"
  /** Not scheduled, or before the item existed. Draws nothing. */
  | "none";

export interface Lane {
  id: string;
  name: string;
  /** Oldest to newest, ending today. */
  cells: CellState[];
}

export interface Matrix {
  lanes: Lane[];
  /** Oldest to newest, ending today — one per column. */
  dates: Date[];
  /** Totals across the window, for the caption. Counts only days on record. */
  logged: number;
  due: number;
  offDays: number;
  /** Days of the window that fall inside the record. Null if nothing logged. */
  recordDays: number | null;
}

interface ScheduledItem {
  id: string;
  peptideName: string;
  scheduleDays: number[];
  startedAt: string;
  cycleOnDays: number | null;
  cycleOffDays: number | null;
}

interface LoggedDose {
  stackItemId: string;
  takenAt: string;
}

export function buildMatrix(
  items: ScheduledItem[],
  logs: LoggedDose[],
  windowDays = 28,
  now: Date = new Date(),
): Matrix {
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

  /*
    The day the record begins: the first dose ever logged, on any item.

    Per-item would be gentler still, but it has a hole — an item added and
    never once logged would never show a miss, which is precisely the case
    worth surfacing. Once the user has logged anything, the tracker is in use
    and a scheduled dose with no log is a real gap.
  */
  const recordFrom = logs.reduce<number | null>((earliest, log) => {
    const key = startOfDay(new Date(log.takenAt));
    return earliest === null || key < earliest ? key : earliest;
  }, null);

  const dates: Date[] = [];
  for (let i = windowDays - 1; i >= 0; i--) dates.push(new Date(todayKey - i * DAY_MS));

  let logged = 0;
  let due = 0;
  let offDays = 0;

  const lanes: Lane[] = items.map((item) => {
    const startKey = startOfDay(new Date(item.startedAt));

    const cells = dates.map((date): CellState => {
      const key = startOfDay(date);
      // Before the item existed, nothing was ever owed for it.
      if (startKey > key) return "none";

      const cycle = cycleState(item.startedAt, item.cycleOnDays, item.cycleOffDays, date);
      if (cycle?.phase === "off") {
        offDays += 1;
        return "off";
      }

      if (!item.scheduleDays.includes(dayOfWeek(date))) return "none";

      if (loggedByDay.get(key)?.has(item.id)) {
        due += 1;
        logged += 1;
        return "logged";
      }

      // Today's dose has not failed; the day isn't over.
      if (key === todayKey) {
        due += 1;
        return "pending";
      }

      // Before the first log there is no record, so there is nothing to say.
      // Not a miss, and not counted in the denominator either — a ratio built
      // on days the app wasn't watching is not a ratio of anything.
      if (recordFrom === null || key < recordFrom) return "none";

      due += 1;
      return "missed";
    });

    return { id: item.id, name: item.peptideName, cells };
  });

  const firstColumn = startOfDay(dates[0]);
  const recordDays =
    recordFrom === null
      ? null
      : Math.round((todayKey - Math.max(recordFrom, firstColumn)) / DAY_MS) + 1;

  return { lanes, dates, logged, due, offDays, recordDays };
}
