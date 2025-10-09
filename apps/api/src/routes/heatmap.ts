import { Router } from "express";
import { verifyFirebaseToken, AuthedRequest } from "../middleware/auth";
import { db } from "../lib/firebase";

export const heatmapRouter = Router();

// Public read; write requires auth
heatmapRouter.get("/jobs", async (_req, res) => {
  const snap = await db().collection("jobs_heatmap").get();
  const data = snap.docs.map((d) => d.data());
  return res.json({ data });
});

heatmapRouter.post("/jobs", verifyFirebaseToken, async (req: AuthedRequest, res) => {
  const entry = req.body as { country: string; job: string; weight?: number };
  if (!entry?.country || !entry?.job) return res.status(400).json({ error: "country_and_job_required" });
  const docId = `${entry.country}_${entry.job}`;
  await db().collection("jobs_heatmap").doc(docId).set({ ...entry, weight: entry.weight ?? 1, updatedAt: Date.now() }, { merge: true });
  return res.json({ ok: true });
});
