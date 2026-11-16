/*
Medications a user can declare at onboarding.

This is NOT a drug database and does not try to be. It is a short list of the
classes that are actually implicated in documented cautions with the peptides
and GLP-1s this app tracks — mostly glycaemic agents, and oral drugs with a
narrow therapeutic margin whose absorption is affected by delayed gastric
emptying. Anything outside it goes in as free text.

Keeping the list this small is deliberate. A longer list would imply the app
is screening comprehensively, which it is not.
*/

export interface MedicationOption {
  /** Stable id, used to match against PeptideInteraction.substance. */
  id: string;
  label: string;
  /** Examples, shown as the secondary line so people recognise their own. */
  examples?: string;
}

export const MEDICATION_OPTIONS: MedicationOption[] = [
  { id: "insulin", label: "Insulin", examples: "any basal or bolus insulin" },
  {
    id: "sulfonylurea",
    label: "Sulfonylureas",
    examples: "glipizide, glyburide, glimepiride",
  },
  {
    id: "glp1",
    label: "Another GLP-1 or GIP/GLP-1",
    examples: "semaglutide, tirzepatide, liraglutide, dulaglutide",
  },
  { id: "metformin", label: "Metformin", examples: "Glucophage" },
  {
    id: "sglt2",
    label: "SGLT2 inhibitors",
    examples: "empagliflozin, dapagliflozin",
  },
  { id: "levothyroxine", label: "Levothyroxine", examples: "Synthroid, thyroid hormone" },
  { id: "warfarin", label: "Warfarin", examples: "Coumadin" },
  {
    id: "antiepileptic",
    label: "Anti-seizure medication",
    examples: "levetiracetam, lamotrigine, phenytoin",
  },
  {
    id: "corticosteroid",
    label: "Corticosteroids",
    examples: "prednisone, dexamethasone",
  },
  {
    id: "immunosuppressant",
    label: "Immunosuppressants",
    examples: "ciclosporin, tacrolimus, methotrexate",
  },
  {
    id: "oral_contraceptive",
    label: "Oral contraceptives",
    examples: "combined or progestogen-only pill",
  },
  {
    id: "antihypertensive",
    label: "Blood pressure medication",
    examples: "lisinopril, amlodipine, losartan",
  },
  { id: "nitrate", label: "Nitrates", examples: "nitroglycerin, isosorbide" },
  {
    id: "pde5",
    label: "PDE5 inhibitors",
    examples: "sildenafil, tadalafil",
  },
  {
    id: "antidepressant",
    label: "Antidepressants",
    examples: "SSRIs, SNRIs, MAOIs",
  },
  { id: "gh_therapy", label: "Prescription growth hormone", examples: "somatropin" },
  {
    id: "testosterone",
    label: "Testosterone / TRT",
    examples: "cypionate, enanthate, gel",
  },
];

export function medicationLabel(id: string): string {
  return MEDICATION_OPTIONS.find((m) => m.id === id)?.label ?? id;
}

/** True for anything the user typed in rather than picked. */
export function isCustomMedication(id: string): boolean {
  return !MEDICATION_OPTIONS.some((m) => m.id === id);
}
