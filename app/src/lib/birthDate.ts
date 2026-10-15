/*
Birth date handling.

Asked instead of age because an age is only true for a year. Stored once, it
quietly drifts the calorie maths every birthday; a birth date never goes out
of date. The server derives age from it on read.
*/

/** Whole years since a birth date. Mirrors the server's derivation. */
export function ageFromBirthDate(dob: Date, now: Date = new Date()): number {
  let years = now.getFullYear() - dob.getFullYear();
  const beforeBirthdayThisYear =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthdayThisYear) years -= 1;
  return years;
}

export interface BirthDateParts {
  month: string;
  day: string;
  year: string;
}

export interface BirthDateResult {
  date: Date | null;
  /** Null when the parts are simply incomplete — not yet an error. */
  error: string | null;
  age: number | null;
}

const MIN_AGE = 18;
const MAX_AGE = 110;

/**
 * Validates month/day/year as an actual calendar date.
 *
 * Checks the round-trip rather than just the ranges, so 31 February is caught
 * instead of silently rolling into March — Date would otherwise accept it.
 */
export function parseBirthDate(
  { month, day, year }: BirthDateParts,
  now: Date = new Date(),
): BirthDateResult {
  const m = Number(month);
  const d = Number(day);
  const y = Number(year);

  if (!month || !day || !year) return { date: null, error: null, age: null };
  if (!Number.isInteger(m) || m < 1 || m > 12) {
    return { date: null, error: "Month should be 1–12.", age: null };
  }
  if (!Number.isInteger(d) || d < 1 || d > 31) {
    return { date: null, error: "Day should be 1–31.", age: null };
  }
  if (!Number.isInteger(y) || year.length !== 4) {
    return { date: null, error: "Enter the full year, like 1998.", age: null };
  }

  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return { date: null, error: "That date doesn't exist.", age: null };
  }
  if (date.getTime() > now.getTime()) {
    return { date: null, error: "That's in the future.", age: null };
  }

  const age = ageFromBirthDate(date, now);
  if (age > MAX_AGE) return { date: null, error: "Check the year.", age: null };
  // Not a gate on using the app — the app doesn't police who tracks what —
  // but a wrong year here produces nonsense calorie targets, so it's worth
  // catching as a typo.
  if (age < MIN_AGE) {
    return { date: null, error: "This app is intended for adults.", age };
  }

  return { date, error: null, age };
}
