import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { firestore } from '../config/firebase.js';
import { plaid } from '../services/plaid.js';
import type { CountryCode, Products } from 'plaid';
import OpenAI from 'openai';
import { env } from '../config/env.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
export const creditRouter = Router();

creditRouter.post('/link-token', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.user!.uid;
  const tokenResp = await plaid.linkTokenCreate({
    user: { client_user_id: uid },
    client_name: 'Secure Finance',
    products: ['transactions' as Products],
    language: 'en',
    country_codes: ['US' as CountryCode],
  });
  res.json(tokenResp.data);
});

creditRouter.post('/public-token', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ publicToken: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const exchange = await plaid.itemPublicTokenExchange({ public_token: parsed.data.publicToken });
  const accessToken = exchange.data.access_token;
  const uid = req.user!.uid;
  await firestore.collection('plaid').doc(uid).set({ accessToken }, { merge: true });
  res.json({ ok: true });
});

creditRouter.get('/score', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.user!.uid;
  const doc = await firestore.collection('plaid').doc(uid).get();
  if (!doc.exists) return res.status(400).json({ error: 'plaid_not_linked' });
  const { accessToken } = doc.data() as any;
  const txs = await plaid.transactionsGet({ access_token: accessToken, start_date: '2023-01-01', end_date: '2030-01-01' });
  const accounts = await plaid.accountsGet({ access_token: accessToken });
  const features = buildFinancialFeatures(txs.data.transactions, accounts.data.accounts);
  const score = await aiCreditScore(features);
  await firestore.collection('credit').doc(uid).set({ score, features, updatedAt: Date.now() }, { merge: true });
  res.json({ score });
});

function buildFinancialFeatures(transactions: any[], accounts: any[]) {
  const income = transactions.filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);
  const spend = transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const balances = accounts.reduce((a, acc) => a + (acc.balances?.current || 0), 0);
  const recurring = detectRecurring(transactions);
  return { income, spend, balances, recurringCount: recurring.length };
}

function detectRecurring(transactions: any[]) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    const key = `${t.name}|${new Date(t.date).getDate()}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).filter(([, v]) => v >= 3);
}

async function aiCreditScore(features: any) {
  if (!openai) return 600;
  const prompt = `Given features ${JSON.stringify(features)}, estimate a FICO-like score 300-850 focusing on income stability, low utilization, and on-time patterns. Return only a number.`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0
  });
  const text = resp.choices[0]?.message?.content?.trim() || '600';
  const n = Number(text.match(/\d+/)?.[0] || 600);
  return Math.min(850, Math.max(300, n));
}
