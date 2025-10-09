import { Router } from "express";
import { auth } from "../lib/firebase";

export const authRouter = Router();

// This backend trusts Firebase for SMS phone auth; client obtains ID token
// Endpoint for exchanging a custom token if needed (server-side flows)
authRouter.post("/custom-token", async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "uid_required" });
  try {
    const token = await auth().createCustomToken(uid);
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: "token_error" });
  }
});
