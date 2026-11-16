/*
Dose formatting, in one place.

Every dose in the app goes through here. That is the whole point: before this
existed, four screens each interpolated `${dose} ${unit}` by hand, which meant
four chances to render something ISMP lists as error-prone, and no single
place to fix it.

The rules below are not style preferences. Each one has documented tenfold
human overdoses behind it, and they come from the ISMP List of Error-Prone
Abbreviations, Symbols, and Dose Designations:

  .5 mg   →  0.5 mg    a missing leading zero reads as 5 mg          10x
  1.0 mg  →  1 mg      a trailing zero reads as 10 mg                10x
  10 U    →  10 units  U is misread as 0 or 4, giving 100 or 104
  10 IU   →  10 units  IU is misread as IV, or as the number 10
  10 ug   →  10 mcg    the mu is misread as m, giving milligrams   1000x
  0.5 cc  →  0.5 mL    cc is misread as u
  250mcg  →  250 mcg   a number and unit run together get misread

The users of this app arrive speaking exactly that dialect — "250mcg EOD",
"5iu", "2ml bac water". Normalising on the way in and formatting on the way
out is the cheapest safety work available to us.
*/

/**
 * Units the app will store. `units` rather than `IU`, deliberately — see the
 * table above. Anything the user picks is constrained to this list, because
 * a free-text unit field is how `u` and `ug` get into a database.
 */
export const DOSE_UNITS = ["mcg", "mg", "units", "mL", "mg/mL"] as const;

export type DoseUnit = (typeof DOSE_UNITS)[number];

/**
 * Legacy and user-typed spellings mapped to the safe form. Applied when
 * reading a stored unit, so rows written before this existed still render
 * correctly rather than needing a migration to be readable.
 */
const UNIT_ALIASES: Record<string, DoseUnit> = {
  iu: "units",
  u: "units",
  unit: "units",
  ius: "units",
  ug: "mcg",
  mcg: "mcg",
  µg: "mcg",
  μg: "mcg", // U+03BC, the other mu — they are different codepoints
  mg: "mg",
  ml: "mL",
  cc: "mL",
  "mg/ml": "mg/mL",
};

/** Maps any stored or typed unit onto the safe display form. */
export function normalizeUnit(unit: string): string {
  const key = unit.trim().toLowerCase();
  return UNIT_ALIASES[key] ?? unit.trim();
}

/**
 * The numeric half of a dose.
 *
 * Doses are stored as a float, which is the wrong type for a quantity — it
 * will hand us 0.30000000000000004 sooner or later. Rounding to four decimal
 * places absorbs that; the real fix is a numeric column, which is noted in
 * the schema. Four places is well past any dose this app sees (0.0625 mg is
 * the smallest realistic one) without being enough to show float noise.
 */
export function formatDoseValue(value: number): string {
  if (!Number.isFinite(value)) return "—";

  const rounded = Number(value.toFixed(4));
  // toString() already drops trailing zeros ("1.50" never appears) and always
  // writes the leading zero ("0.5", never ".5"), which is both rules at once.
  // It is spelled out here because it is load-bearing, not incidental.
  return String(rounded);
}

/**
 * A dose as one string: "250 mcg", "0.5 mg", "10 units".
 *
 * The space is a non-breaking space so a dose never wraps between the number
 * and its unit — a line break there produces exactly the ambiguity the unit
 * rules exist to prevent.
 */
export function formatDose(value: number, unit: string): string {
  return `${formatDoseValue(value)} ${normalizeUnit(unit)}`;
}

/**
 * The two halves separately, for rendering the unit smaller and lighter than
 * the number. The unit should always be visually subordinate: a bare number
 * reads as a score, a number with a unit reads as a measurement, and a unit
 * at equal weight reads as neither.
 */
export function doseParts(value: number, unit: string): { value: string; unit: string } {
  return { value: formatDoseValue(value), unit: normalizeUnit(unit) };
}

/**
 * How a screen reader should say a dose.
 *
 * "mcg" is read aloud as "em cee gee" and "mL" as "em ell", so the visual
 * abbreviation — which exists because `µg` is dangerous in print — becomes
 * nonsense in speech. Spell it out for the accessible name only.
 */
const SPOKEN: Record<string, string> = {
  mcg: "micrograms",
  mg: "milligrams",
  units: "units",
  mL: "millilitres",
  "mg/mL": "milligrams per millilitre",
};

export function speakDose(value: number, unit: string): string {
  const safe = normalizeUnit(unit);
  return `${formatDoseValue(value)} ${SPOKEN[safe] ?? safe}`;
}
