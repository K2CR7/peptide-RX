/*
Documented cautions between tracked peptides and declared medications.

READ THIS BEFORE EDITING.

Scope and honesty rules this file is held to:

 1. Nothing here is invented. Every `caution` and `avoid` entry reflects a
    documented, label-level or trial-level pharmacological effect. Where a
    mechanism is plausible but not established, it is marked `info` and the
    text says it is theoretical.
 2. Absence of an entry is NOT a safety claim. Most of the research peptides
    here have no human interaction literature at all, so they carry an
    explicit NO_DATA entry — silence would read as "cleared", which is the
    opposite of true.
 3. This list is not exhaustive and is not a screen. It surfaces well-known
    pairings so the user can raise them with whoever prescribes for them.
 4. Nothing here ever blocks an action. The product is a tracker, not a
    gatekeeper, and `PRODUCT.md` principle 1 forbids crossing into medical
    advice. Phrasing routes to a prescriber; it never instructs.

`substance` matches an id in `medications.ts`, or the literal "*" for an
entry that applies regardless of what the user declared.
*/

export type InteractionSeverity = "avoid" | "caution" | "info";

export interface PeptideMedInteraction {
  /** A medication id from MEDICATION_OPTIONS, or "*" for an always-shown note. */
  substance: string;
  severity: InteractionSeverity;
  note: string;
}

/** Shown for peptides with no human interaction literature. */
const NO_DATA: PeptideMedInteraction = {
  substance: "*",
  severity: "info",
  note:
    "No established human interaction data. That means it hasn't been studied, " +
    "not that it has been shown to be safe alongside other medication.",
};

/** GLP-1 receptor agonist cautions, shared by the incretin drugs below. */
const GLP1_CAUTIONS: PeptideMedInteraction[] = [
  {
    substance: "insulin",
    severity: "caution",
    note:
      "Combining with insulin raises the risk of hypoglycaemia. Prescribers " +
      "routinely reduce insulin doses when starting a GLP-1 — worth confirming yours has.",
  },
  {
    substance: "sulfonylurea",
    severity: "caution",
    note:
      "Sulfonylureas plus a GLP-1 raise the risk of hypoglycaemia, and dose " +
      "reduction is commonly advised. One to raise with your prescriber.",
  },
  {
    substance: "glp1",
    severity: "avoid",
    note:
      "Two GLP-1 receptor agonists are not intended to be taken together — " +
      "they act on the same receptor and the side effects stack.",
  },
  {
    substance: "levothyroxine",
    severity: "caution",
    note:
      "GLP-1s slow gastric emptying, which can change how much levothyroxine " +
      "you absorb. Thyroid levels are usually worth re-checking after starting or dose-escalating.",
  },
  {
    substance: "warfarin",
    severity: "caution",
    note:
      "Warfarin has a narrow margin and delayed gastric emptying can shift its " +
      "absorption. INR monitoring is the usual precaution.",
  },
  {
    substance: "antiepileptic",
    severity: "info",
    note:
      "Anti-seizure medications depend on steady blood levels, and slowed " +
      "gastric emptying can affect absorption. Worth mentioning to your prescriber.",
  },
  {
    substance: "oral_contraceptive",
    severity: "info",
    note:
      "Delayed gastric emptying can affect absorption of oral medication, " +
      "including the pill. Guidance varies by drug — check yours.",
  },
];

/** Growth-hormone axis cautions, shared by the secretagogues and GHRH analogues. */
const GH_AXIS_CAUTIONS: PeptideMedInteraction[] = [
  {
    substance: "insulin",
    severity: "caution",
    note:
      "Raising growth hormone tends to reduce insulin sensitivity and can push " +
      "blood glucose up, which may change how much insulin you need.",
  },
  {
    substance: "sulfonylurea",
    severity: "caution",
    note:
      "Growth hormone raises blood glucose, which can work against a " +
      "glucose-lowering medication. Worth monitoring.",
  },
  {
    substance: "metformin",
    severity: "info",
    note:
      "Growth hormone reduces insulin sensitivity, so glycaemic control may " +
      "shift while you're on this.",
  },
  {
    substance: "gh_therapy",
    severity: "caution",
    note:
      "This stimulates your own growth hormone on top of prescribed " +
      "somatropin. The effects are additive — your prescriber should know.",
  },
  {
    substance: "corticosteroid",
    severity: "info",
    note:
      "Corticosteroids blunt the growth hormone response, so the two work " +
      "against each other.",
  },
];

/**
 * Keyed by the peptide name exactly as it appears in PEPTIDE_REFERENCE.
 * A peptide absent from this map falls back to NO_DATA.
 */
export const PEPTIDE_MED_INTERACTIONS: Record<string, PeptideMedInteraction[]> = {
  Semaglutide: GLP1_CAUTIONS,

  Retatrutide: [
    ...GLP1_CAUTIONS,
    {
      substance: "*",
      severity: "info",
      note:
        "Retatrutide is still investigational — it is not an approved medicine, " +
        "so its interaction profile is less established than the approved GLP-1s.",
    },
  ],

  "MK-677": [
    ...GH_AXIS_CAUTIONS,
    {
      substance: "*",
      severity: "info",
      note:
        "Trials consistently show raised fasting glucose and reduced insulin " +
        "sensitivity on MK-677, which matters most if you already manage blood sugar.",
    },
  ],

  "CJC-1295": GH_AXIS_CAUTIONS,
  Ipamorelin: GH_AXIS_CAUTIONS,
  Tesamorelin: [
    ...GH_AXIS_CAUTIONS,
    {
      substance: "*",
      severity: "info",
      note:
        "Tesamorelin's labelling notes effects on glucose tolerance; periodic " +
        "glucose monitoring is the usual advice.",
    },
  ],

  "PT-141": [
    {
      substance: "antihypertensive",
      severity: "caution",
      note:
        "Bremelanotide causes a transient rise in blood pressure and a fall in " +
        "heart rate after each dose. It isn't advised where blood pressure is uncontrolled.",
    },
    {
      substance: "nitrate",
      severity: "caution",
      note:
        "Both affect blood pressure, in opposite directions and on different " +
        "timings. Worth raising with your prescriber before combining.",
    },
    {
      substance: "*",
      severity: "info",
      note:
        "It can slow gastric emptying, which may reduce absorption of oral " +
        "medication taken around the same time.",
    },
  ],

  "Thymosin Alpha-1": [
    {
      substance: "immunosuppressant",
      severity: "caution",
      note:
        "Thymosin alpha-1 is an immune stimulant, so in principle it works " +
        "against immunosuppressive therapy. This is a theoretical opposition rather " +
        "than a measured interaction, but it's a real one to raise.",
    },
    NO_DATA,
  ],

  // Everything below has no human interaction literature worth reporting.
  // They are listed explicitly rather than omitted so the UI can say so.
  "BPC-157": [NO_DATA],
  "TB-500": [NO_DATA],
  Epithalon: [NO_DATA],
  Selank: [NO_DATA],
  Semax: [NO_DATA],
  "AOD-9604": [NO_DATA],
  "GHK-Cu": [NO_DATA],
  "MOTS-c": [NO_DATA],
  KPV: [NO_DATA],
  "SS-31": [NO_DATA],
};

/**
 * The cautions worth showing for one peptide given what the user declared.
 *
 * Returns only entries that actually apply: matched medications, plus any "*"
 * notes that stand on their own. NO_DATA is suppressed when a real caution
 * matched, since "no data" alongside a specific warning is just noise.
 */
export function cautionsFor(
  peptideName: string,
  declaredMedications: string[],
): PeptideMedInteraction[] {
  const all = PEPTIDE_MED_INTERACTIONS[peptideName] ?? [NO_DATA];
  const declared = new Set(declaredMedications);

  const matched = all.filter((i) => i.substance !== "*" && declared.has(i.substance));
  const general = all.filter((i) => i.substance === "*");

  if (matched.length > 0) {
    return [...matched, ...general.filter((g) => g !== NO_DATA)];
  }
  return general;
}

export const INTERACTION_DISCLAIMER =
  "This is a short list of well-known pairings, not a complete interaction " +
  "screen, and not medical advice. Nothing here stops you tracking what you " +
  "take — check anything that matters with whoever prescribes for you.";
