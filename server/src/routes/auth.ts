import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";

export const authRouter = Router();

function serializeUser(user: {
  id: string;
  email: string;
  name: string | null;
  sex: string | null;
  experience: string | null;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  activityLevel: string | null;
  nutritionGoal: string | null;
  onboardedAt: Date | null;
  tourCompletedAt: Date | null;
  goals: string[];
  medications: string[];
  usedPeptidesBefore: boolean | null;
  priorExperienceNote: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    sex: user.sex,
    experience: user.experience,
    weightKg: user.weightKg,
    heightCm: user.heightCm,
    age: user.age,
    activityLevel: user.activityLevel,
    nutritionGoal: user.nutritionGoal,
    onboardedAt: user.onboardedAt ? user.onboardedAt.toISOString() : null,
    tourCompletedAt: user.tourCompletedAt ? user.tourCompletedAt.toISOString() : null,
    goals: user.goals,
    medications: user.medications,
    usedPeptidesBefore: user.usedPeptidesBefore,
    priorExperienceNote: user.priorExperienceNote,
  };
}

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(serializeUser(user));
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  sex: z.enum(["Male", "Female"]).optional(),
  experience: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  age: z.number().int().positive().optional(),
  activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]).optional(),
  nutritionGoal: z.enum(["CUT", "MAINTAIN", "BULK"]).optional(),

  // Onboarding. Dates come over as booleans — the client says "this is done"
  // and the server stamps the time, so a client clock can't set it.
  onboarded: z.boolean().optional(),
  tourCompleted: z.boolean().optional(),
  goals: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  usedPeptidesBefore: z.boolean().optional(),
  priorExperienceNote: z.string().optional(),
});

authRouter.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  // The client reports completion as a boolean and the server stamps the
  // time, so a wrong device clock can't write a bogus date — and re-sending
  // `onboarded: true` can't quietly move the original timestamp.
  const { onboarded, tourCompleted, ...rest } = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { onboardedAt: true, tourCompletedAt: true },
  });

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      ...rest,
      ...(onboarded !== undefined
        ? { onboardedAt: onboarded ? (existing?.onboardedAt ?? new Date()) : null }
        : {}),
      ...(tourCompleted !== undefined
        ? { tourCompletedAt: tourCompleted ? (existing?.tourCompletedAt ?? new Date()) : null }
        : {}),
    },
  });
  res.json(serializeUser(user));
});

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function issueTokens(userId: string) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return { accessToken, refreshToken };
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  const tokens = await issueTokens(user.id);
  res.status(201).json({
    user: serializeUser(user),
    ...tokens,
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const tokens = await issueTokens(user.id);
  res.json({ user: serializeUser(user), ...tokens });
});

const refreshSchema = z.object({ refreshToken: z.string() });

authRouter.post("/refresh", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { refreshToken } = parsed.data;

  let userId: string;
  try {
    userId = verifyRefreshToken(refreshToken).sub;
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { userId, tokenHash, expiresAt: { gt: new Date() } },
  });
  if (!stored) {
    return res.status(401).json({ error: "Refresh token revoked or unknown" });
  }

  // Rotate: delete the used token, issue a new pair.
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const tokens = await issueTokens(userId);
  res.json(tokens);
});

authRouter.post("/logout", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashToken(parsed.data.refreshToken) },
  });
  res.status(204).send();
});
