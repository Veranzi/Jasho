import { Router } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { env } from '../config/env.js';

export const heatmapRouter = Router();

heatmapRouter.get('/', async (req, res) => {
  const schema = z.object({ what: z.string().default('software'), where: z.string().default('kenya') });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { what, where } = parsed.data as any;
  // Adzuna Jobs API (geo distribution requires searches per region; return simplified heatpoints by location)
  const url = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(where)}/search/1?app_id=${env.ADZUNA_APP_ID}&app_key=${env.ADZUNA_APP_KEY}&what=${encodeURIComponent(what)}&content-type=application/json`;
  const resp = await axios.get(url);
  const points = (resp.data?.results || []).map((r: any) => ({
    lat: r.latitude,
    lng: r.longitude,
    value: 1,
    title: r.title,
  })).filter((p: any) => p.lat && p.lng);
  res.json({ points });
});
