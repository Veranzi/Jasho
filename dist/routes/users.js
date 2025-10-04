import { Router } from 'express';
import { z } from 'zod';
import { auth, firestore } from '../config/firebase.js';
import { env } from '../config/env.js';
import twilio from 'twilio';
import { requireAuth } from '../middleware/auth.js';
export const authRouter = Router();
const client = env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
    ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    : null;
authRouter.post('/sms/start', async (req, res) => {
    if (!client || !env.TWILIO_VERIFY_SERVICE_SID)
        return res.status(500).json({ error: 'Verify not configured' });
    const schema = z.object({ phone: z.string().min(8) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { phone } = parsed.data;
    await client.verify.v2.services(env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: phone, channel: 'sms' });
    res.json({ ok: true });
});
authRouter.post('/sms/verify', async (req, res) => {
    if (!client || !env.TWILIO_VERIFY_SERVICE_SID)
        return res.status(500).json({ error: 'Verify not configured' });
    const schema = z.object({ phone: z.string().min(8), code: z.string().min(4) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { phone, code } = parsed.data;
    const check = await client.verify.v2.services(env.TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({ to: phone, code });
    if (check.status !== 'approved')
        return res.status(401).json({ error: 'Invalid code' });
    // For signup use-cases, simply confirm approval
    res.json({ ok: true });
});
// Step-up verification for sensitive actions (requires auth)
authRouter.post('/stepup/verify', requireAuth, async (req, res) => {
    if (!client || !env.TWILIO_VERIFY_SERVICE_SID)
        return res.status(500).json({ error: 'Verify not configured' });
    const schema = z.object({ phone: z.string().min(8), code: z.string().min(4) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { phone, code } = parsed.data;
    const check = await client.verify.v2.services(env.TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({ to: phone, code });
    if (check.status !== 'approved')
        return res.status(401).json({ error: 'Invalid code' });
    const { v4: uuidv4 } = await import('uuid');
    const token = uuidv4();
    await firestore.collection('stepup').doc(token).set({ phone, expiresAt: Date.now() + 2 * 60 * 1000, uid: req.user.uid });
    res.json({ ok: true, stepUpToken: token, expiresInSeconds: 120 });
});
authRouter.post('/custom-token', async (req, res) => {
    const schema = z.object({ uid: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const token = await auth.createCustomToken(parsed.data.uid);
    res.json({ token });
});
