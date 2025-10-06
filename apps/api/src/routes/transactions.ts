import { Router } from "express";
import { verifyFirebaseToken, AuthedRequest } from "../middleware/auth";
import { db } from "../lib/firebase";
import axios from "axios";
import { clampAmountCents, isValidCurrency, maskBalance } from "@app/shared";
import type * as Shared from "@app/shared";

export const txRouter = Router();

txRouter.use(verifyFirebaseToken);

async function getBalance(uid: string, currency: string): Promise<Shared.AccountBalance> {
  const ref = db().collection("balances").doc(`${uid}_${currency}`);
  const doc = await ref.get();
  if (!doc.exists) {
    const bal: Shared.AccountBalance = { uid, available: 0, ledger: 0, currency, updatedAt: Date.now() };
    await ref.set(bal);
    return bal;
  }
  return doc.data() as Shared.AccountBalance;
}

async function saveBalance(bal: Shared.AccountBalance) {
  await db().collection("balances").doc(`${bal.uid}_${bal.currency}`).set(bal);
}

async function recordTransaction(tx: Shared.Transaction) {
  await db().collection("transactions").doc(tx.id).set(tx);
}

// Display masked balance for UI safety
// GET /transactions/balance?currency=USD
// includeMask=true returns masked string along with numeric values only for owner

// Balance endpoint with masking option
txRouter.get("/balance", async (req: AuthedRequest, res) => {
  const uid = req.user!.uid;
  const currency = (req.query.currency as string) || "USD";
  const includeMask = String(req.query.includeMask || "true") === "true";
  if (!isValidCurrency(currency)) return res.status(400).json({ error: "invalid_currency" });
  const bal = await getBalance(uid, currency);
  return res.json({
    balance: bal,
    masked: includeMask ? maskBalance(bal.available) : undefined,
  });
});

// Create transaction (deposit/withdrawal/payment/transfer)
txRouter.post("/create", async (req: AuthedRequest, res) => {
  const uid = req.user!.uid;
  const { type, amount, currency, metadata } = req.body as Partial<Shared.Transaction> & { amount: number };
  if (!type || !["deposit", "withdrawal", "payment", "transfer"].includes(type)) return res.status(400).json({ error: "invalid_type" });
  if (!isValidCurrency(currency || "")) return res.status(400).json({ error: "invalid_currency" });
  const amt = clampAmountCents(Number(amount));
  if (amt <= 0) return res.status(400).json({ error: "invalid_amount" });

  const bal = await getBalance(uid, currency!);
  let newAvailable = bal.available;
  if (type === "deposit") newAvailable += amt;
  else newAvailable -= amt;
  if (newAvailable < 0) return res.status(400).json({ error: "insufficient_funds" });

  const tx: Shared.Transaction = {
    id: `${uid}_${Date.now()}`,
    uid,
    type: type as Shared.Transaction["type"],
    amount: amt,
    currency: currency!,
    createdAt: Date.now(),
    metadata: metadata || {},
  };

  await recordTransaction(tx);
  // Anchor to blockchain (best-effort)
  try {
    const base = process.env.INTERNAL_API_BASE || `http://localhost:${process.env.PORT || 4000}`;
    await axios.post(`${base}/blockchain/anchor`, { id: tx.id, amount: type === "deposit" ? amt : -amt, currency }, { headers: { Authorization: req.headers.authorization || "" } });
  } catch {
    // ignore anchor failures
  }
  const updated: Shared.AccountBalance = { ...bal, available: newAvailable, ledger: newAvailable, updatedAt: Date.now() };
  await saveBalance(updated);

  return res.json({ ok: true, tx });
});

// History export lock - require explicit confirmation token
// POST /transactions/export -> returns signed URL or data after confirming lock

txRouter.post("/export", async (req: AuthedRequest, res) => {
  const { confirm } = req.body as { confirm?: string };
  if (confirm !== "I_UNDERSTAND_SENSITIVE") return res.status(400).json({ error: "confirmation_required" });
  const uid = req.user!.uid;
  const snap = await db().collection("transactions").where("uid", "==", uid).orderBy("createdAt", "desc").limit(1000).get();
  const rows = snap.docs.map((d) => d.data());
  return res.json({ csv: toCsv(rows) });
});

function toCsv(rows: any[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => JSON.stringify(r[h] ?? "")).join(","));
  }
  return lines.join("\n");
}
