import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { getSignedUploadUrl } from "../lib/r2.js";
import { prisma } from "../lib/prisma.js";

export const checkinsRouter = Router();

checkinsRouter.get("/", async (req, res) => {
  const checkins = await prisma.checkin.findMany({
    where: { userId: req.userId! },
    include: { photos: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(checkins);
});

// Client asks for a presigned URL, uploads the compressed photo directly to
// R2, then includes the returned publicUrl when it POSTs the checkin below.
const uploadUrlSchema = z.object({
  angle: z.enum(["front", "side", "back"]),
  contentType: z.string().default("image/jpeg"),
});

checkinsRouter.post("/upload-url", async (req, res) => {
  const parsed = uploadUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const key = `checkins/${req.userId}/${randomUUID()}-${parsed.data.angle}.jpg`;
  const urls = await getSignedUploadUrl(key, parsed.data.contentType);
  res.json(urls);
});

const createSchema = z.object({
  weightKg: z.number().positive().optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  energy: z.number().int().min(1).max(10).optional(),
  mood: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
  photos: z
    .array(z.object({ angle: z.enum(["front", "side", "back"]), url: z.string().url() }))
    .default([]),
});

checkinsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { photos, ...rest } = parsed.data;
  const checkin = await prisma.checkin.create({
    data: {
      ...rest,
      userId: req.userId!,
      photos: { create: photos },
    },
    include: { photos: true },
  });
  res.status(201).json(checkin);
});

checkinsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.checkin.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });
  await prisma.checkin.delete({ where: { id: existing.id } });
  res.status(204).send();
});
