const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
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
  threatDetection,
  securityMonitoring,
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
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
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
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};
app.use(cors(corsOptions));

// Session security
app.use(sessionSecurity);

// Request fingerprinting and security audit
app.use(requestFingerprint);
app.use(securityAudit);
app.use(threatDetection);
app.use(securityMonitoring);

// Body parsing middleware with security
app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE || '10mb',
  verify: (req, res, buf) => {
    // Additional security checks on request body
    if (buf.length > parseInt(process.env.MAX_FILE_SIZE || '10485760')) {
      throw new Error('Request body too large');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// MongoDB sanitization
app.use(mongoSanitize());

// HTTP Parameter Pollution protection
app.use(hpp());

// Blockchain middleware
if (process.env.BLOCKCHAIN_ENABLED === 'true') {
  app.use(blockchainMiddleware);
}

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

// Static files with security headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'connected',
      redis: 'connected',
      blockchain: process.env.BLOCKCHAIN_ENABLED === 'true' ? 'enabled' : 'disabled',
      ai: process.env.AI_ENABLED === 'true' ? 'enabled' : 'disabled'
    }
  };
  
  res.status(200).json(healthCheck);
});

// API documentation endpoint
if (process.env.ENABLE_SWAGGER === 'true') {
  app.get('/api-docs', (req, res) => {
    res.json({
      title: 'Jashoo API Documentation',
      version: '1.0.0',
      description: 'Advanced financial services API for gig economy workers',
      endpoints: {
        auth: '/api/auth',
        user: '/api/user',
        wallet: '/api/wallet',
        jobs: '/api/jobs',
        savings: '/api/savings',
        gamification: '/api/gamification',
        ai: '/api/ai',
        chatbot: '/api/chatbot',
        heatmap: '/api/heatmap',
        creditScore: '/api/credit-score'
      }
    });
  });
}

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
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date()
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error handler', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    timestamp: new Date()
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      code: 'VALIDATION_ERROR',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      code: 'INVALID_ID'
    });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      code: 'DUPLICATE_FIELD',
      field
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Database connection with retry logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

let server;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running on http://${HOST}:${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`📊 Health check: http://${HOST}:${PORT}/health`);
      logger.info(`📚 API docs: http://${HOST}:${PORT}/api-docs`);
      logger.info(`🔒 Security monitoring: ${process.env.SECURITY_MONITORING_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
      logger.info(`⛓️ Blockchain: ${process.env.BLOCKCHAIN_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
      logger.info(`🤖 AI features: ${process.env.AI_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      
      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
      
      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;