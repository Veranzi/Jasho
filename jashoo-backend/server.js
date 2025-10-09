// server.js — Firestore only, no MongoDB
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import morgan from 'morgan';
import xss from 'xss';
import { v4 as uuidv4 } from 'uuid';
import admin from './firebaseAdmin.js';

// Import your route files
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import walletRoutes from './routes/wallet.js';
import transactionRoutes from './routes/transaction.js';
import aiRoutes from './routes/ai.js';
import blockchainRoutes from './routes/blockchain.js';
import cybersecurityRoutes from './routes/cybersecurity.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Security and performance middlewares
app.use(helmet());
app.use(hpp());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// ✅ Basic rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
});
app.use(limiter);

// ✅ Slow down excessive requests (basic DoS protection)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50, // allow 50 requests per 15 minutes, then start slowing down responses
  delayMs: 500, // add 0.5s delay per request above 50
});
app.use(speedLimiter);

// ✅ Sanitize and validate input manually (no Mongo)
app.use((req, res, next) => {
  // XSS protection for string inputs
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/cybersecurity', cybersecurityRoutes);

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'running',
    time: new Date(),
    server_id: uuidv4(),
  });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
