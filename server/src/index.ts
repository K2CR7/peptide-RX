import "dotenv/config";
// Side-effect import: patches Express routers so a rejected promise in an
// async handler is forwarded to error-handling middleware instead of
// crashing the whole process (Express 4 doesn't do this natively).
import "express-async-errors";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { authRouter } from "./routes/auth.js";
import { checkinsRouter } from "./routes/checkins.js";
import { injectionLogsRouter } from "./routes/injectionLogs.js";
import { mealBuilderRouter } from "./routes/mealBuilder.js";
import { nutritionRouter } from "./routes/nutrition.js";
import { stackItemsRouter } from "./routes/stackItems.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/stack-items", requireAuth, stackItemsRouter);
app.use("/injection-logs", requireAuth, injectionLogsRouter);
app.use("/checkins", requireAuth, checkinsRouter);
app.use("/nutrition", requireAuth, nutritionRouter);
app.use("/meal-builder", requireAuth, mealBuilderRouter);

// Must be registered after all routes. Catches anything thrown/rejected in a
// route handler (e.g. a dropped DB connection) so it returns a 500 instead
// of taking down the whole server.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
