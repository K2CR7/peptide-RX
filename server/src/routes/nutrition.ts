import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const nutritionRouter = Router();

nutritionRouter.get("/plans", async (req, res) => {
  const plans = await prisma.nutritionPlan.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  res.json(plans);
});

const createPlanSchema = z.object({
  goal: z.string().min(1),
  title: z.string().min(1),
  content: z.unknown(),
});

nutritionRouter.post("/plans", async (req, res) => {
  const parsed = createPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const plan = await prisma.nutritionPlan.create({
    data: {
      ...parsed.data,
      content: parsed.data.content as Prisma.InputJsonValue,
      userId: req.userId!,
    },
  });
  res.status(201).json(plan);
});

nutritionRouter.get("/logs", async (req, res) => {
  const logs = await prisma.nutritionLog.findMany({
    where: { userId: req.userId! },
    orderBy: { loggedAt: "desc" },
  });
  res.json(logs);
});

const createLogSchema = z.object({
  meal: z.string().min(1),
  notes: z.string().optional(),
  loggedAt: z.string().datetime().optional(),
});

nutritionRouter.post("/logs", async (req, res) => {
  const parsed = createLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { loggedAt, ...rest } = parsed.data;
  const log = await prisma.nutritionLog.create({
    data: {
      ...rest,
      userId: req.userId!,
      ...(loggedAt ? { loggedAt: new Date(loggedAt) } : {}),
    },
  });
  res.status(201).json(log);
});
