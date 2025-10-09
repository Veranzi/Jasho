import { Router } from "express";
import { verifyFirebaseToken, AuthedRequest } from "../middleware/auth";
import { db } from "../lib/firebase";
import type * as Shared from "@app/shared";

export const userRouter = Router();

userRouter.use(verifyFirebaseToken);

userRouter.get("/me", async (req: AuthedRequest, res) => {
  const doc = await db().collection("users").doc(req.user!.uid).get();
  const profile = doc.exists ? (doc.data() as Shared.UserProfile) : null;
  return res.json({ profile });
});

userRouter.post("/profile", async (req: AuthedRequest, res) => {
  const profile = req.body as Partial<Shared.UserProfile>;
  const uid = req.user!.uid;
  const now = Date.now();
  const toSave: Shared.UserProfile = {
    uid,
    phoneNumber: profile.phoneNumber || req.user!.phoneNumber || "",
    displayName: profile.displayName || "",
    email: profile.email || "",
    createdAt: now,
    kycVerified: false,
    roles: ["user"],
    incomeMonthly: profile.incomeMonthly,
    occupation: profile.occupation,
    location: profile.location,
  };
  await db().collection("users").doc(uid).set(toSave, { merge: true });
  return res.json({ ok: true });
});
