import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/firebase";

export interface AuthedRequest extends Request {
  user?: { uid: string; phoneNumber?: string; roles?: string[] };
}

export async function verifyFirebaseToken(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });
  try {
    const decoded = await auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, phoneNumber: decoded.phone_number || undefined };
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid_token" });
  }
}
