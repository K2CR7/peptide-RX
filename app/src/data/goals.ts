/*
What someone is actually trying to get out of a protocol.

These are not invented for onboarding — they are the exact vocabulary every
entry in PEPTIDE_REFERENCE is already tagged with, and they line up with the
keys in GOAL_TO_NUTRIENTS. So a goal picked here reaches two places at once:
which peptides are relevant, and which nutrients the Fuel screen prioritises.

Lose / maintain / gain is deliberately NOT asked separately. It is derived
below, because asking someone to state the same intent twice in one survey is
the sort of thing that makes a form feel like paperwork.
*/

import type { NutritionGoal } from "../lib/nutrition";

export interface GoalOption {
  /** Matches the strings in PEPTIDE_REFERENCE[].goals exactly. */
  id: string;
  /** Matches a key in GOAL_TO_NUTRIENTS, where one exists. */
  nutrientKey?: string;
  blurb: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  { id: "Recovery & Healing", nutrientKey: "recovery", blurb: "Soft tissue, joints, training recovery" },
  { id: "Muscle / Bulk", nutrientKey: "muscle", blurb: "Lean mass and strength" },
  { id: "Fat Loss / Lean Out", nutrientKey: "fatloss", blurb: "Body composition and appetite" },
  { id: "Sleep & GH Optimization", nutrientKey: "sleep", blurb: "Sleep quality and growth hormone" },
  { id: "Skin & Anti-Aging", nutrientKey: "skin", blurb: "Skin, hair and collagen" },
  { id: "Longevity", nutrientKey: "longevity", blurb: "Healthspan and cellular ageing" },
  { id: "Cognitive / Nootropic", nutrientKey: "cognitive", blurb: "Focus, memory and mood" },
  { id: "Immune Support", nutrientKey: "immune", blurb: "Immune resilience" },
  { id: "Gut Health", nutrientKey: "gut", blurb: "Digestion and gut lining" },
  { id: "Libido & Hormones", nutrientKey: "libido", blurb: "Libido and hormonal balance" },
];

/**
 * The macro calculator still needs a single cut/maintain/bulk axis. Rather
 * than ask for it, read it off the goals already chosen: wanting to lean out
 * and wanting to put on mass are statements about energy balance, and if
 * someone picks both, neither wins — that's a maintain.
 */
export function deriveNutritionGoal(goals: string[]): NutritionGoal {
  const cutting = goals.includes("Fat Loss / Lean Out");
  const bulking = goals.includes("Muscle / Bulk");
  if (cutting && !bulking) return "CUT";
  if (bulking && !cutting) return "BULK";
  return "MAINTAIN";
}
