/*
How often the user means to check in.

Asked once during onboarding and changeable in settings, because the honest
answer differs by an order of magnitude between users and the app has no way
to guess it. Somebody eight weeks into a cut wants a weekly weight and a
photo; somebody two years into a maintenance dose wants to be left alone
until something changes. An app that asks daily of the second person is
teaching them that its prompts are noise.

The cadence is a statement of intent, not a rule. Nothing here blocks an
early check-in, marks a late one, or counts a missed one — the app has no
business scoring somebody against a number they picked for themselves in
their first five minutes. It decides one thing: whether the check-in screen
says "due today" or tells you when the next one comes round.
*/
export type CheckinCadence = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export const CADENCE_DAYS: Record<CheckinCadence, number> = {
  DAILY: 1,
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30,
};

export const CADENCE_LABELS: Record<CheckinCadence, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every two weeks",
  MONTHLY: "Monthly",
};

/** The short form, for places that are already saying something else. */
export const CADENCE_SHORT: Record<CheckinCadence, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Fortnightly",
  MONTHLY: "Monthly",
};

export const CADENCE_OPTIONS: { id: CheckinCadence; label: string; blurb: string }[] = [
  {
    id: "DAILY",
    label: "Daily",
    blurb: "Every day. Worth it on a short, aggressive run where things move week to week.",
  },
  {
    id: "WEEKLY",
    label: "Weekly",
    blurb: "Once a week. Enough to see a trend without recording the noise.",
  },
  {
    id: "BIWEEKLY",
    label: "Every two weeks",
    blurb: "A step back. Long enough that a change is probably real.",
  },
  {
    id: "MONTHLY",
    label: "Monthly",
    blurb: "A light touch, for a protocol you expect to be on for a long time.",
  },
];

export const DEFAULT_CADENCE: CheckinCadence = "WEEKLY";

export interface CadenceState {
  /** True when the interval has elapsed, or when nothing has been logged yet. */
  due: boolean;
  /** When the next one comes round. Null when one is due now. */
  nextAt: Date | null;
}

/*
  Measured in whole days from the last check-in, not in clock time.

  Someone who checks in at 9pm on Sunday and opens the app at 8am the
  following Sunday has, as far as they are concerned, let a week go by. An
  hours-based comparison would tell them they had thirteen hours to wait,
  which is pedantically true and useless.
*/
export function cadenceState(lastAt: string | null, cadence: CheckinCadence): CadenceState {
  if (lastAt == null) return { due: true, nextAt: null };

  const last = new Date(lastAt);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const elapsed = Math.round((today - lastDay) / 86400000);
  const interval = CADENCE_DAYS[cadence];
  if (elapsed >= interval) return { due: true, nextAt: null };

  const next = new Date(lastDay);
  next.setDate(next.getDate() + interval);
  return { due: false, nextAt: next };
}

/** "due today" / "next on Sat 22" — the tail of a sentence, never the whole one. */
export function cadenceTail(state: CadenceState): string {
  if (state.due) return "due today";
  const next = state.nextAt as Date;
  const days = Math.round((next.getTime() - Date.now()) / 86400000);
  if (days <= 1) return "next tomorrow";
  // Inside a week a weekday name is the fastest thing to read; past that it
  // stops being a date you can place and wants the number.
  if (days < 7) return `next ${next.toLocaleDateString(undefined, { weekday: "long" })}`;
  return `next on ${next.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
