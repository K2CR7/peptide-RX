// Cycling — "8 weeks on, 4 weeks off" and friends. The schema has carried
// cycleOnDays/cycleOffDays since the first migration but nothing ever read
// them; this is the math that makes them mean something.

const DAY_MS = 24 * 3600 * 1000;

export type CyclePhase = "on" | "off";

export interface CycleState {
  phase: CyclePhase;
  /** 1-indexed day within the current phase. */
  dayInPhase: number;
  phaseLength: number;
  /** Days left in this phase, counting today. */
  daysRemaining: number;
  weekInPhase: number;
  weeksInPhase: number;
  /** 1-indexed: which repeat of the on/off period we're in. */
  cycleNumber: number;
  /** 0-1 progress through the current phase. */
  progress: number;
}

function startOfDay(d: Date): number {
  return new Date(d).setHours(0, 0, 0, 0);
}

/**
 * Where a cycling item sits right now, or null when it isn't cycling.
 * Both on and off days are required: an item with no off period is simply
 * continuous, which is the absence of a cycle rather than a cycle of one phase.
 */
export function cycleState(
  startedAt: string | Date,
  cycleOnDays: number | null,
  cycleOffDays: number | null,
  now: Date = new Date(),
): CycleState | null {
  if (!cycleOnDays || cycleOnDays <= 0) return null;
  if (!cycleOffDays || cycleOffDays <= 0) return null;

  const elapsed = Math.floor((startOfDay(now) - startOfDay(new Date(startedAt))) / DAY_MS);
  if (elapsed < 0) return null; // starts in the future

  const period = cycleOnDays + cycleOffDays;
  const posInPeriod = elapsed % period;
  const isOn = posInPeriod < cycleOnDays;

  const phaseLength = isOn ? cycleOnDays : cycleOffDays;
  const dayInPhase = (isOn ? posInPeriod : posInPeriod - cycleOnDays) + 1;

  return {
    phase: isOn ? "on" : "off",
    dayInPhase,
    phaseLength,
    daysRemaining: phaseLength - dayInPhase + 1,
    weekInPhase: Math.floor((dayInPhase - 1) / 7) + 1,
    weeksInPhase: Math.ceil(phaseLength / 7),
    cycleNumber: Math.floor(elapsed / period) + 1,
    progress: dayInPhase / phaseLength,
  };
}

/** "Week 3 of 8" / "Week 1 of 4 off" — the headline line for a cycling item. */
export function describeCycle(state: CycleState): string {
  const w = `Week ${state.weekInPhase} of ${state.weeksInPhase}`;
  return state.phase === "on" ? w : `${w} off`;
}

/** "5 days left" / "ends today" — the countdown to the next phase flip. */
export function describeRemaining(state: CycleState): string {
  if (state.daysRemaining <= 1) {
    return state.phase === "on" ? "last day on" : "last day off";
  }
  return `${state.daysRemaining} days left`;
}

export interface CycleOption {
  label: string;
  onDays: number | null;
  offDays: number | null;
}

export const NO_CYCLE_LABEL = "No cycle — continuous";
export const CUSTOM_CYCLE_LABEL = "Custom…";

export const CYCLE_OPTIONS: CycleOption[] = [
  { label: NO_CYCLE_LABEL, onDays: null, offDays: null },
  { label: "4 weeks on / 4 off", onDays: 28, offDays: 28 },
  { label: "6 weeks on / 2 off", onDays: 42, offDays: 14 },
  { label: "8 weeks on / 4 off", onDays: 56, offDays: 28 },
  { label: "12 weeks on / 4 off", onDays: 84, offDays: 28 },
];

export function cycleOptionLabels(): string[] {
  return [...CYCLE_OPTIONS.map((o) => o.label), CUSTOM_CYCLE_LABEL];
}

export function findCycleOption(label: string): CycleOption | undefined {
  return CYCLE_OPTIONS.find((o) => o.label === label);
}
