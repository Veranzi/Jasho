import { Router } from "express";
import { verifyFirebaseToken, AuthedRequest } from "../middleware/auth";
import { db } from "../lib/firebase";
import { computeCreditScore, deriveAiInsights } from "@app/shared";
import type * as Shared from "@app/shared";

export const aiRouter = Router();

aiRouter.use(verifyFirebaseToken);

aiRouter.post("/score", async (req: AuthedRequest, res) => {
  const uid = req.user!.uid;
  const userDoc = await db().collection("users").doc(uid).get();
  const profile = userDoc.data() as Shared.UserProfile;
  const snap = await db().collection("transactions").where("uid", "==", uid).get();
  const transactions = snap.docs.map((d) => d.data() as Shared.Transaction);
  const score = computeCreditScore(profile, transactions, 0);
  await db().collection("credit_scores").doc(uid).set(score);
  return res.json({ score });
});

aiRouter.post("/insights", async (req: AuthedRequest, res) => {
  const uid = req.user!.uid;
  const userDoc = await db().collection("users").doc(uid).get();
  const profile = userDoc.data() as Shared.UserProfile;
  const snap = await db().collection("transactions").where("uid", "==", uid).get();
  const transactions = snap.docs.map((d) => d.data() as Shared.Transaction);
  const insights = deriveAiInsights(profile, transactions);
  await db().collection("ai_insights").doc(uid).set(insights);
  return res.json({ insights });
});
