import { Router } from "express";
import { z } from "zod";
import { getAnthropicClient } from "../lib/anthropic.js";

// Raw JSON schema instead of the SDK's zodOutputFormat helper — that helper
// requires Zod v4 internals, but the rest of this codebase is on Zod v3 for
// its own request validation, and mixing major versions isn't worth it here.
const MEAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          amount: { type: "string" },
        },
        required: ["item", "amount"],
        additionalProperties: false,
      },
    },
    estimatedMacros: {
      type: "object",
      properties: {
        calories: { type: "number" },
        protein: { type: "number" },
        carbs: { type: "number" },
        fat: { type: "number" },
      },
      required: ["calories", "protein", "carbs", "fat"],
      additionalProperties: false,
    },
    notes: { type: "string" },
  },
  required: ["title", "ingredients", "estimatedMacros", "notes"],
  additionalProperties: false,
} as const;

export const mealBuilderRouter = Router();

const ingredientSchema = z.object({
  item: z.string(),
  amount: z.string(),
});

const mealSchema = z.object({
  title: z.string(),
  ingredients: z.array(ingredientSchema),
  estimatedMacros: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
  notes: z.string(),
});

const previousMealSchema = z.object({
  title: z.string(),
  ingredients: z.array(ingredientSchema),
});

const constraintSchema = z.enum(["max", "min"]);

const generateSchema = z.object({
  calories: z.number().positive(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  caloriesConstraint: constraintSchema.default("max"),
  proteinConstraint: constraintSchema.default("max"),
  carbsConstraint: constraintSchema.default("max"),
  fatConstraint: constraintSchema.default("max"),
  priorityNutrients: z.array(z.string()).default([]),
  previousMeal: previousMealSchema.optional(),
  feedback: z.string().optional(),
});

function macroLine(name: string, value: number, unit: string, constraint: "max" | "min"): string {
  return constraint === "min"
    ? `${name}: at least ${value}${unit}`
    : `${name}: no more than ${value}${unit}`;
}

mealBuilderRouter.post("/generate", async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const {
    calories, proteinG, carbsG, fatG,
    caloriesConstraint, proteinConstraint, carbsConstraint, fatConstraint,
    priorityNutrients, previousMeal, feedback,
  } = parsed.data;

  const targetLines = [
    macroLine("Calories", calories, " kcal", caloriesConstraint),
    macroLine("Protein", proteinG, "g", proteinConstraint),
    macroLine("Carbs", carbsG, "g", carbsConstraint),
    macroLine("Fat", fatG, "g", fatConstraint),
  ];
  if (priorityNutrients.length > 0) {
    targetLines.push(`Prioritize these micronutrients where practical: ${priorityNutrients.join(", ")}`);
  }

  let prompt = `Design a single practical, home-cookable meal that fits these targets:\n${targetLines.join("\n")}\n\nUse ordinary grocery-store ingredients with realistic portions. This is one meal, not a full day of eating.`;

  if (previousMeal && feedback) {
    prompt += `\n\nThe user was previously given this meal:\nTitle: ${previousMeal.title}\nIngredients: ${previousMeal.ingredients.map((i) => `${i.amount} ${i.item}`).join(", ")}\n\nTheir feedback: "${feedback}"\n\nRevise the meal to address their feedback while still hitting the original targets as closely as possible.`;
  }

  const response = await getAnthropicClient().messages.create({
    model: "claude-opus-5",
    max_tokens: 2048,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: MEAL_JSON_SCHEMA },
    },
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (response.stop_reason === "refusal" || !textBlock || textBlock.type !== "text") {
    return res.status(502).json({ error: "Model declined or returned no content" });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(textBlock.text);
  } catch {
    return res.status(502).json({ error: "Model returned malformed JSON" });
  }

  const validated = mealSchema.safeParse(raw);
  if (!validated.success) {
    return res.status(502).json({ error: "Model output didn't match the expected meal shape" });
  }
  res.json(validated.data);
});
