import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { scanDocument } from '../services/safety.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
export const chatbotRouter = Router();

const moderationFirst = async (text?: string) => {
  if (!text) return { allowed: true } as const;
  if (!openai) return { allowed: true } as const;
  try {
    const resp = await openai.moderations.create({ model: 'omni-moderation-latest', input: text });
    const results: any = (resp as any).results || [];
    const flagged = results.some((r: any) => r.flagged);
    return { allowed: !flagged, results } as const;
  } catch {
    return { allowed: true } as const;
  }
};

chatbotRouter.post('/text', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ message: z.string().min(1).max(2000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const mod = await moderationFirst(parsed.data.message);
  if (!mod.allowed) return res.status(400).json({ error: 'unsafe_content' });
  if (!openai) return res.status(500).json({ error: 'LLM not configured' });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a responsible finance assistant. Do not provide disallowed content.' },
      { role: 'user', content: parsed.data.message }
    ]
  });
  res.json({ reply: completion.choices[0]?.message?.content || '' });
});

chatbotRouter.post('/voice', requireAuth, async (req: AuthedRequest, res) => {
  // expecting base64 audio and return base64 audio reply
  const schema = z.object({ audioBase64: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (!openai) return res.status(500).json({ error: 'LLM not configured' });
  const audioBuffer = Buffer.from(parsed.data.audioBase64, 'base64');
  // Speech-to-Text (OpenAI Whisper). Use toFile helper to create a File-like object
  // @ts-ignore - toFile exists in SDK runtime
  const file = await OpenAI.toFile(audioBuffer, 'audio.wav');
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1'
  } as any);
  const text = (transcription as any).text || '';
  const mod = await moderationFirst(text);
  if (!mod.allowed) return res.status(400).json({ error: 'unsafe_content' });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a responsible finance assistant.' },
      { role: 'user', content: text }
    ]
  });
  const replyText = completion.choices[0]?.message?.content || '';
  // TTS
  const speech = await openai.audio.speech.create({ model: 'gpt-4o-mini-tts', voice: 'alloy', input: replyText });
  const arrayBuffer = await speech.arrayBuffer();
  const replyAudioBase64 = Buffer.from(arrayBuffer).toString('base64');
  res.json({ replyText, replyAudioBase64 });
});

chatbotRouter.post('/moderate-file', requireAuth, async (req: AuthedRequest, res) => {
  // This endpoint expects the client to upload a file in a separate endpoint; here we only accept raw base64 for quick safety check
  const schema = z.object({ base64: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const buffer = Buffer.from(parsed.data.base64, 'base64');
  const result = await scanDocument(buffer);
  if (!result.safe) return res.status(400).json(result);
  res.json({ ok: true });
});
