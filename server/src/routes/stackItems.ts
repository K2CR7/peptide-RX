import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const stackItemsRouter = Router();

stackItemsRouter.get("/", async (req, res) => {
  const includeArchived = req.query.includeArchived === "true";
  const items = await prisma.stackItem.findMany({
    where: {
      userId: req.userId!,
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

const createSchema = z.object({
  peptideName: z.string().min(1),
  dose: z.number().positive(),
  unit: z.string().min(1),
  frequency: z.string().min(1),
  scheduleDays: z.array(z.number().int().min(1).max(7)).default([]),
  route: z.string().nullable().optional(),
  cycleOnDays: z.number().int().positive().nullable().optional(),
  cycleOffDays: z.number().int().positive().nullable().optional(),
});

stackItemsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const item = await prisma.stackItem.create({
    data: { ...parsed.data, userId: req.userId! },
  });
  res.status(201).json(item);
});

const updateSchema = createSchema.partial().extend({
  archived: z.boolean().optional(),
});

stackItemsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const existing = await prisma.stackItem.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const { archived, ...rest } = parsed.data;
  const updated = await prisma.stackItem.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}),
    },
  });
  res.json(updated);
});

stackItemsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.stackItem.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });
  await prisma.stackItem.delete({ where: { id: existing.id } });
  res.status(204).send();
});
