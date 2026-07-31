import "dotenv/config";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { checkinsRouter } from "./routes/checkins.js";
import { injectionLogsRouter } from "./routes/injectionLogs.js";
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

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
