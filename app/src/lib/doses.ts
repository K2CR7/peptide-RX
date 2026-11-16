/*
The unit of work is a DOSE, not an item.

Five places in this app used to collapse a day into a Set of stack item ids:
the matrix, adherence, the streak, the week grid and the Today screen. A Set
answers "did this item happen today" with a boolean, which is the wrong
question for anything running more than once a day. Someone on BPC-157 at
"2-3x daily" logged one dose, the row went disabled, and there was nowhere to
put the rest of their day. The database was never the problem -- InjectionLog
has no per-day constraint and happily stores three -- the readers were.

So a day scheduled for an item produces `item.dosesPerDay` SLOTS, and a slot is
either filled by a log or outstanding. Everything above counts slots.

WHY A SLOT IS NOT JUST A NUMBER. The Today screen needs to draw one mark per
expected dose and pair each one with the log that filled it, so it can say
where that particular dose went. A count cannot carry that. The aggregate
readers that only need totals use loggedCountsByDay instead, which is the same
data without the pairing.

The pairing is positional, by time. There is no column on InjectionLog saying
"this was the second dose of the day" and there should not be: a dose is an
event with a timestamp, and which slot it fills is a question about the
schedule that asked for it, not a property of the event. Sorting the day's
logs by takenAt and dealing them into the slots in order is the whole rule.

OVER-LOGGING IS KEPT, NOT DISCARDED. Four doses on a three-dose day produces
three filled slots and one extra, and `extra` reports it rather than dropping
it on the floor. A log that exists is a dose that happened, and a reader that
silently hides one is lying about a medical record. Adherence clamps it so a
heavy day cannot push a week over 100%; the Today screen shows it.
*/
import { cycleState } from "./cycle";
import type { InjectionLog, StackItem } from "./queries";
import { dowOf } from "./schedule";

/** Midnight of the day a timestamp falls in, as a number, for use as a key. */
export function dayKey(d: Date | string): number {
  return new Date(d).setHours(0, 0, 0, 0);
}

export interface DoseSlot {
  item: StackItem;
  /** 1-based position within the day. */
  index: number;
  /** The log that filled it, or null while it is outstanding. */
  log: InjectionLog | null;
}

/**
 * Doses this item asks for on a scheduled day. Always at least one, because a
 * scheduled item that asks for nothing is not a schedule.
 *
 * Guards the field rather than trusting it: a row written before the column
 * existed reads as undefined through an older cached response, and a zero or a
 * negative would silently erase the item from every readout below.
 */
export function dosesPerDay(item: { dosesPerDay?: number }): number {
  const n = Math.floor(item.dosesPerDay ?? 1);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 12) : 1;
}

/** True when the item is scheduled for this weekday and not in an off phase. */
export function isDueOn(item: StackItem, date: Date): boolean {
  if (!item.scheduleDays.includes(dowOf(date))) return false;
  // The cycle outranks the weekly pattern: an item in its off phase is not due
  // however its weekday schedule reads.
  const cycle = cycleState(item.startedAt, item.cycleOnDays, item.cycleOffDays);
  return cycle === null || cycle.phase !== "off";
}

/**
 * Every dose expected on `date`, in schedule order, each paired with the log
 * that filled it. Items not due that day contribute nothing.
 */
export function doseSlotsForDay(
  items: StackItem[],
  logs: InjectionLog[],
  date: Date = new Date(),
): DoseSlot[] {
  const key = dayKey(date);

  // One pass, so a long history does not get re-scanned per item.
  const byItem = new Map<string, InjectionLog[]>();
  logs.forEach((log) => {
    if (dayKey(log.takenAt) !== key) return;
    const list = byItem.get(log.stackItemId);
    if (list) list.push(log);
    else byItem.set(log.stackItemId, [log]);
  });
  byItem.forEach((list) =>
    list.sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()),
  );

  const slots: DoseSlot[] = [];
  items.forEach((item) => {
    if (!isDueOn(item, date)) return;
    const taken = byItem.get(item.id) ?? [];
    const want = dosesPerDay(item);
    for (let i = 0; i < want; i += 1) {
      slots.push({ item, index: i + 1, log: taken[i] ?? null });
    }
  });
  return slots;
}

/**
 * Doses logged per item per day, across the whole history.
 *
 * What the aggregate readers want. Returns counts rather than slots because
 * none of them needs to know which log filled which position, and building
 * slots for every day of a year to then count them would be absurd.
 */
export function loggedCountsByDay(
  /* Structural, not InjectionLog, because lanes/adherence/streak each declare
     their own narrow view of a dose and none of them needs the site or the
     notes to count one. */
  logs: { stackItemId: string; takenAt: string }[],
): Map<number, Map<string, number>> {
  const days = new Map<number, Map<string, number>>();
  logs.forEach((log) => {
    const key = dayKey(log.takenAt);
    let perItem = days.get(key);
    if (!perItem) {
      perItem = new Map<string, number>();
      days.set(key, perItem);
    }
    perItem.set(log.stackItemId, (perItem.get(log.stackItemId) ?? 0) + 1);
  });
  return days;
}

export interface DayTally {
  /** Doses asked for. */
  due: number;
  /** Doses logged, clamped to `due`. */
  done: number;
  /** Doses logged beyond what was asked for. Usually 0. */
  extra: number;
}

/**
 * How one item's day went.
 *
 * Clamped, with the overflow reported separately, so a caller summing `done`
 * across a week cannot produce more doses than were due — which is how an
 * adherence percentage ends up above 100 and stops being believable.
 */
export function tallyDay(item: { dosesPerDay?: number }, logged: number): DayTally {
  const due = dosesPerDay(item);
  return { due, done: Math.min(logged, due), extra: Math.max(0, logged - due) };
}
