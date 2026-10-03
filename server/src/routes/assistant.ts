import { Router } from "express";
import { z } from "zod";
import { getAnthropicClient } from "../lib/anthropic.js";
import { prisma } from "../lib/prisma.js";

export const assistantRouter = Router();

const askSchema = z.object({
  question: z.string().min(1).max(500),
  /**
   * Figures the app already derived on screen (adherence, cycle phases,
   * rotation). Sent so the assistant's answers match what the user is looking
   * at rather than re-deriving date math and drifting from the UI. Raw records
   * below are still read server-side from the authenticated user's own rows.
   */
  context: z.string().max(4000).optional(),
  /** Prior turns, so "why?" and "what about last week?" resolve. */
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2000) }))
    .max(10)
    .optional(),
});

/**
 * The boundary this app's legal posture depends on. The product deliberately
 * dropped dose calculation; a free-text box is exactly where that would creep
 * back in, so the refusal is stated as a hard rule rather than a preference,
 * and the allowed list is closed rather than illustrative.
 */
const SYSTEM_PROMPT = `You are the in-app assistant for a peptide TRACKING app. The user already decided what they take; this app handles logistics — schedule, injection-site rotation, adherence, cycles, and nutrition targets.

Answer ONLY from the user's own data given below.

You may:
- describe what their recorded data shows
- do arithmetic on it (counts, averages, dates, how many days until something)
- explain how a number in the app was derived
- answer about their schedule, cycles, site rotation, adherence, check-ins, and calorie/macro targets

You must NOT, under any circumstances:
- recommend, suggest, validate, or adjust a dose or dosing schedule
- advise whether to start, stop, continue, combine, or change any compound
- comment on safety, side effects, interactions, risks, or legality
- interpret symptoms or give any medical, diagnostic, or health advice
- speculate about what a peptide does physiologically

If the question asks for any of the above, do not partially answer and do not hedge. Reply with one short sentence declining and pointing them to their prescriber or doctor. Never soften this by adding a "but generally..." clause.

Style — this is a chat bubble on a phone, not a report:
- At most 2 short sentences. One is usually better.
- Lead with the direct answer or the number. Put the "why" second, and only if it adds something.
- Never restate the question back.
- Plain text. No markdown, no bullet lists, no headings.
- Follow-up questions refer to what you just said — answer them in context, even more briefly.
- If their data doesn't contain the answer, say exactly that in one sentence rather than guessing.`;

assistantRouter.post("/ask", async (req, res) => {
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { question, context, history } = parsed.data;

  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000);

  const [user, items, logs, checkins] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.userId! },
      select: { name: true, sex: true, age: true, weightKg: true, heightCm: true, activityLevel: true, nutritionGoal: true },
    }),
    prisma.stackItem.findMany({
      where: { userId: req.userId!, archivedAt: null },
      select: {
        peptideName: true, dose: true, unit: true, frequency: true, route: true,
        scheduleDays: true, startedAt: true, cycleOnDays: true, cycleOffDays: true,
      },
    }),
    // InjectionLog has no userId of its own — it is scoped through its stack item.
    prisma.injectionLog.findMany({
      where: { stackItem: { userId: req.userId! }, takenAt: { gte: since } },
      select: { site: true, takenAt: true, stackItemId: true },
      orderBy: { takenAt: "desc" },
      take: 200,
    }),
    prisma.checkin.findMany({
      where: { userId: req.userId!, createdAt: { gte: since } },
      select: { weightKg: true, energy: true, mood: true, notes: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const data = {
    today: new Date().toISOString().slice(0, 10),
    profile: user,
    stack: items,
    recentInjections: logs,
    recentCheckins: checkins,
    onScreenSummary: context ?? null,
  };

  // The data rides in the system prompt rather than the latest user message so
  // a multi-turn conversation doesn't resend the whole record set every turn.
  const response = await getAnthropicClient().messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\n# The user's data\n\n${JSON.stringify(data, null, 2)}`,
    output_config: { effort: "low" },
    messages: [
      ...(history ?? []).map((turn) => ({
        role: turn.role,
        content: turn.text,
      })),
      { role: "user" as const, content: question },
    ],
  });

  if (response.stop_reason === "refusal") {
    return res.json({
      answer: "I can't help with that one — worth asking your prescriber.",
    });
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return res.status(502).json({ error: "No answer returned" });
  }

  res.json({ answer: textBlock.text.trim() });
});
