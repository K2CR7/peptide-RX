import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const injectionLogsRouter = Router();

injectionLogsRouter.get("/", async (req, res) => {
  const stackItemId = typeof req.query.stackItemId === "string" ? req.query.stackItemId : undefined;
  const logs = await prisma.injectionLog.findMany({
    where: {
      stackItem: { userId: req.userId! },
      ...(stackItemId ? { stackItemId } : {}),
    },
    orderBy: { takenAt: "desc" },
  });
  res.json(logs);
});

const createSchema = z.object({
  stackItemId: z.string(),
  site: z.string().min(1),
  notes: z.string().optional(),
  takenAt: z.string().datetime().optional(),
});

injectionLogsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { stackItemId, takenAt, ...rest } = parsed.data;

  // Ownership check: a StackItem's userId must match the caller before we
  // let them attach a log to it.
  const owned = await prisma.stackItem.findFirst({
    where: { id: stackItemId, userId: req.userId! },
  });
  if (!owned) return res.status(404).json({ error: "Stack item not found" });

  const log = await prisma.injectionLog.create({
    data: {
      stackItemId,
      ...rest,
      ...(takenAt ? { takenAt: new Date(takenAt) } : {}),
    },
  });
  res.status(201).json(log);
});

injectionLogsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.injectionLog.findFirst({
    where: { id: req.params.id, stackItem: { userId: req.userId! } },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });
  await prisma.injectionLog.delete({ where: { id: existing.id } });
  res.status(204).send();
});
