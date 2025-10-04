const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import security middleware
const {
  securityHeaders,
  requestFingerprint,
  transactionSecurity,
  sanitizeInput,
  sessionSecurity,
  securityAudit,
  createRateLimit,
  bruteForce,
  logger
} = require('./middleware/cybersecurity');

// Import blockchain middleware
const { blockchainMiddleware } = require('./middleware/blockchain');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const walletRoutes = require('./routes/wallet');
const jobsRoutes = require('./routes/jobs');
const savingsRoutes = require('./routes/savings');
const gamificationRoutes = require('./routes/gamification');
const aiRoutes = require('./routes/ai');
const chatbotRoutes = require('./routes/chatbot');
const heatmapRoutes = require('./routes/heatmap');
const creditScoreRoutes = require('./routes/credit-score');

const app = express();

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

// Advanced rate limiting with different tiers
app.use('/api/auth/', createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts'));
app.use('/api/wallet/', createRateLimit(5 * 60 * 1000, 10, 'Too many wallet operations'));
app.use('/api/', createRateLimit(15 * 60 * 1000, 100, 'Too many requests'));

// Brute force protection for auth endpoints
app.use('/api/auth/login', bruteForce.prevent);
app.use('/api/auth/register', bruteForce.prevent);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Session security
app.use(sessionSecurity);

// Request fingerprinting and security audit
app.use(requestFingerprint);
app.use(securityAudit);

// Body parsing middleware with security
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Additional security checks on request body
    if (buf.length > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Request body too large');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Blockchain middleware
app.use(blockchainMiddleware);

// Enhanced logging with security context
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      }
    }
  }));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      }
    }
  }));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes with enhanced security
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', transactionSecurity, walletRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/credit-score', creditScoreRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;