import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { env } from './config/env.js';
import { authRouter } from './routes/users.js';
import { transactionsRouter } from './routes/transactions.js';
import { safetyRouter } from './routes/safety.js';
import { chatbotRouter } from './routes/chatbot.js';
import { creditRouter } from './routes/credit.js';
import { heatmapRouter } from './routes/heatmap.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: env.CORS_ORIGINS.split(',').map(o => o.trim()), credentials: true }));
app.use(compression());
app.use(hpp());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/transactions', transactionsRouter);
app.use('/safety', safetyRouter);
app.use('/chat', chatbotRouter);
app.use('/credit', creditRouter);
app.use('/jobs', heatmapRouter);

const port = env.PORT;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
