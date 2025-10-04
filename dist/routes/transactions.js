import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { logTransactionToChain } from '../services/blockchain.js';
import { firestore } from '../config/firebase.js';
import { generateSignedUrl } from '../services/storage.js';
import { v4 as uuidv4 } from 'uuid';
export const transactionsRouter = Router();
const balanceMask = (balanceMinor) => {
    const masked = Math.floor(balanceMinor / 100).toString();
    const keep = masked.slice(-2);
    return `****${keep}`;
};
transactionsRouter.get('/balance', requireAuth, async (req, res) => {
    const uid = req.user.uid;
    const doc = await firestore.collection('accounts').doc(uid).get();
    const data = doc.exists ? doc.data() : { balanceMinor: 0 };
    const masked = balanceMask(data.balanceMinor || 0);
    res.json({ balance: masked, masked: true });
});
transactionsRouter.post('/balance/unmask', requireAuth, async (req, res) => {
    // Require a recent step-up token from Firestore created by /auth/sms/verify
    const schema = z.object({ stepUpToken: z.string().uuid() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const uid = req.user.uid;
    const tokenDoc = await firestore.collection('stepup').doc(parsed.data.stepUpToken).get();
    const valid = tokenDoc.exists && tokenDoc.data().uid === uid && tokenDoc.data().expiresAt > Date.now();
    if (!valid)
        return res.status(403).json({ error: 'step_up_required' });
    const doc = await firestore.collection('accounts').doc(uid).get();
    const data = doc.exists ? doc.data() : { balanceMinor: 0 };
    // consume token (one-time)
    await tokenDoc.ref.delete();
    res.json({ balanceMinor: data.balanceMinor || 0, masked: false });
});
transactionsRouter.post('/', requireAuth, async (req, res) => {
    const schema = z.object({
        type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT']),
        amountMinor: z.number().int().positive(),
        currency: z.string().length(3),
        metadata: z.string().optional().default('')
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const uid = req.user.uid;
    const txId = uuidv4();
    const record = { ...parsed.data, userId: uid, txId, createdAt: Date.now() };
    await firestore.collection('transactions').doc(txId).set(record);
    await logTransactionToChain({
        txId,
        userId: uid,
        type: parsed.data.type,
        amountMinor: parsed.data.amountMinor,
        currency: parsed.data.currency,
        metadata: parsed.data.metadata || ''
    });
    res.json({ ok: true, txId });
});
transactionsRouter.post('/export', requireAuth, async (req, res) => {
    // lock links via signed URLs and short expiry; generate CSV in GCS
    const schema = z.object({ format: z.enum(['csv']).default('csv') });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const uid = req.user.uid;
    const snap = await firestore.collection('transactions').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(1000).get();
    const rows = [['txId', 'type', 'amountMinor', 'currency', 'createdAt', 'metadata']];
    for (const doc of snap.docs) {
        const d = doc.data();
        rows.push([d.txId, d.type, d.amountMinor, d.currency, new Date(d.createdAt).toISOString(), (d.metadata || '').replace(/\n/g, ' ')].map(String));
    }
    const csv = rows.map(r => r.map(f => '"' + f.replace(/"/g, '""') + '"').join(',')).join('\n');
    const path = `exports/${uid}/${Date.now()}.csv`;
    const bucket = (await import('../config/firebase.js')).storage.bucket();
    const file = bucket.file(path);
    await file.save(Buffer.from(csv, 'utf-8'), { contentType: 'text/csv' });
    const url = await generateSignedUrl(path, 60, `attachment; filename=transactions.csv`);
    res.json({ url, expiresInSeconds: 60 });
});
