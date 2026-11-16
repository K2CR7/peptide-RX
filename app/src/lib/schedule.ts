// Ported from legacy/peptide_rx.jsx (bSched, cycleWk, monStart, fD, fDF,
// todayDow), re-keyed to a user-entered StackItem instead of a calculated
// recommendation. date-fns replaces the old hand-rolled date formatting.
import { addDays, format, startOfWeek } from "date-fns";

export interface ScheduleableItem {
  id: string;
  peptideName: string;
  scheduleDays: number[]; // 1 = Monday ... 7 = Sunday
  dose: number;
  unit: string;
}

export interface ScheduleSlot {
  stackItemId: string;
  peptideName: string;
  dose: number;
  unit: string;
}

/** Builds a Mon-Sun grid of which stack items are due each day. */
export function buildWeekSchedule(items: ScheduleableItem[]): ScheduleSlot[][] {
  const week: ScheduleSlot[][] = Array.from({ length: 7 }, () => []);
  for (const item of items) {
    for (const day of item.scheduleDays) {
      week[day - 1]?.push({
        stackItemId: item.id,
        peptideName: item.peptideName,
        dose: item.dose,
        unit: item.unit,
      });
    }
  }
  return week;
}

/*
  ISO weekday: Monday is 1, Sunday is 7.

  Every schedule in this app is stored that way, and JavaScript's getDay()
  returns Sunday as 0, so the conversion has to happen somewhere. It was
  happening in three somewheres — here, in lanes.ts and in doses.ts — which is
  two too many for a line that is wrong in a way nobody notices until a Sunday.
*/
export function dowOf(d: Date): number {
  const x = d.getDay();
  return x === 0 ? 7 : x;
}

export function todayDow(): number {
  return dowOf(new Date());
}

export function mondayOfThisWeek(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

/** Which week number of a cycle `startedAt` currently falls in (1-indexed). */
export function cycleWeek(startedAt: string | Date): number {
  const start = new Date(startedAt).getTime();
  const weeks = Math.floor((Date.now() - start) / (7 * 24 * 3600 * 1000));
  return Math.max(1, weeks + 1);
}

export function formatShortDate(iso: string | Date): string {
  return format(new Date(iso), "MMM d");
}

export function formatFullDate(iso: string | Date): string {
  return format(new Date(iso), "EEEE, MMM d");
}

export function weekDates(from: Date = mondayOfThisWeek()): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(from, i));
}
