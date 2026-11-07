import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const appOpensRouter = Router();

/** Midnight UTC for a given instant, matching the @db.Date column. */
function dayOf(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** How far back the streak can possibly reach. */
const WINDOW_DAYS = 400;

/**
 * Record that the app was opened today, and hand back the days it has been
 * opened on.
 *
 * One call does both jobs deliberately: the client needs the history to draw
 * the streak anyway, so making it a separate GET would mean two round trips
 * on every launch for one piece of state.
 *
 * The upsert is idempotent against the (userId, day) unique constraint —
 * relaunching the app twenty times on one day is still one day, so the
 * streak can't be farmed by closing and reopening.
 */
appOpensRouter.post("/", async (req, res) => {
  const userId = req.userId!;
  const today = dayOf(new Date());

  await prisma.appOpen.upsert({
    where: { userId_day: { userId, day: today } },
    create: { userId, day: today },
    update: {},
  });

  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - WINDOW_DAYS);

  const rows = await prisma.appOpen.findMany({
    where: { userId, day: { gte: since } },
    orderBy: { day: "asc" },
    select: { day: true },
  });

  res.json({ days: rows.map((r) => r.day.toISOString().slice(0, 10)) });
});
