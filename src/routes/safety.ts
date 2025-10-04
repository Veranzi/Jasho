import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { checkUrlSafety, scanDocument } from '../services/safety.js';

export const safetyRouter = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

safetyRouter.post('/url', async (req, res) => {
  const schema = z.object({ url: z.string().url() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await checkUrlSafety(parsed.data.url);
  res.json(result);
});

safetyRouter.post('/scan', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const result = await scanDocument(req.file.buffer);
  res.json(result);
});
