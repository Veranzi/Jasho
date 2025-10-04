const crypto = require('crypto');
const forge = require('node-forge');
const sharp = require('sharp');
const QRCode = require('qrcode');
const axios = require('axios');
const validator = require('validator');
const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const ExpressBrute = require('express-brute');
const MongoStore = require('express-brute-mongo');
const session = require('express-session');
const MongoStoreSession = require('connect-mongo');
const winston = require('winston');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

// Advanced logging configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

// Balance masking utility
class BalanceMasker {
  static maskBalance(amount, userId) {
    // Create a deterministic mask based on user ID and amount
    const hash = crypto.createHash('sha256')
      .update(`${userId}-${amount}-${Date.now()}`)
      .digest('hex');
    
    // Show only first 2 digits and last 2 digits
    const amountStr = amount.toString();
    if (amountStr.length <= 4) {
      return '*'.repeat(amountStr.length);
    }
    
    return `${amountStr.substring(0, 2)}${'*'.repeat(amountStr.length - 4)}${amountStr.substring(amountStr.length - 2)}`;
  }

  static encryptBalance(amount, userId) {
    const key = crypto.createHash('sha256')
      .update(`${userId}-${process.env.BALANCE_ENCRYPTION_KEY}`)
      .digest();
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    let encrypted = cipher.update(amount.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  static decryptBalance(encryptedData, userId) {
    const key = crypto.createHash('sha256')
      .update(`${userId}-${process.env.BALANCE_ENCRYPTION_KEY}`)
      .digest();
    
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return parseFloat(decrypted);
  }
}

// Document scanning and validation
class DocumentScanner {
  static async scanImage(imagePath) {
    try {
      const image = await sharp(imagePath);
      const metadata = await image.metadata();
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        'malware', 'virus', 'trojan', 'backdoor',
        'exploit', 'payload', 'injection'
      ];
      
      // Extract text from image (OCR simulation)
      const extractedText = await this.extractTextFromImage(imagePath);
      
      // Check for malicious content
      const isSafe = !suspiciousPatterns.some(pattern => 
        extractedText.toLowerCase().includes(pattern)
      );
      
      return {
        isSafe,
        extractedText,
        metadata,
        scanTimestamp: new Date()
      };
    } catch (error) {
      logger.error('Document scan error:', error);
      return { isSafe: false, error: error.message };
    }
  }

  static async extractTextFromImage(imagePath) {
    // Simulate OCR extraction
    // In production, use Tesseract.js or Google Vision API
    return 'Sample extracted text from document';
  }

  static async validateQRCode(qrData) {
    try {
      // Check if QR code contains malicious URLs
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = qrData.match(urlRegex) || [];
      
      for (const url of urls) {
        const isSafe = await this.checkUrlSafety(url);
        if (!isSafe) {
          return { isSafe: false, reason: 'Malicious URL detected' };
        }
      }
      
      return { isSafe: true };
    } catch (error) {
      logger.error('QR code validation error:', error);
      return { isSafe: false, error: error.message };
    }
  }

  static async checkUrlSafety(url) {
    try {
      // Check against known malicious domains
      const maliciousDomains = [
        'malware.com', 'virus.net', 'phishing.org'
      ];
      
      const domain = new URL(url).hostname;
      return !maliciousDomains.includes(domain);
    } catch (error) {
      return false;
    }
  }
}

// Advanced rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        timestamp: new Date()
      });
      
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Brute force protection
const bruteForceStore = new MongoStore({
  host: process.env.MONGODB_URI,
  collection: 'bruteforce'
});

const bruteForce = new ExpressBrute(bruteForceStore, {
  freeRetries: 5,
  minWait: 5 * 60 * 1000, // 5 minutes
  maxWait: 15 * 60 * 1000, // 15 minutes
  lifetime: 24 * 60 * 60 * 1000, // 24 hours
  refreshTimeoutOnRequest: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  attachResetToRequest: false,
  refreshTimeoutOnRequest: false
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none';"
  );
  
  next();
};

// Request fingerprinting
const requestFingerprint = (req, res, next) => {
  const parser = new UAParser(req.get('User-Agent'));
  const ua = parser.getResult();
  
  const fingerprint = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    acceptLanguage: req.get('Accept-Language'),
    acceptEncoding: req.get('Accept-Encoding'),
    browser: ua.browser,
    os: ua.os,
    device: ua.device,
    timestamp: new Date(),
    geo: geoip.lookup(req.ip)
  };
  
  req.fingerprint = crypto.createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex');
  
  req.fingerprintData = fingerprint;
  
  next();
};

// Transaction security middleware
const transactionSecurity = (req, res, next) => {
  // Log all transaction attempts
  logger.info('Transaction attempt', {
    userId: req.user?.userId,
    ip: req.ip,
    fingerprint: req.fingerprint,
    endpoint: req.path,
    method: req.method,
    timestamp: new Date()
  });
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i
  ];
  
  const bodyStr = JSON.stringify(req.body);
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
    pattern.test(bodyStr)
  );
  
  if (hasSuspiciousContent) {
    logger.warn('Suspicious content detected in transaction', {
      userId: req.user?.userId,
      content: bodyStr,
      timestamp: new Date()
    });
    
    return res.status(400).json({
      success: false,
      message: 'Suspicious content detected'
    });
  }
  
  next();
};

// Input sanitization
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return xss(validator.escape(obj));
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
};

// Session security
const sessionSecurity = session({
  secret: process.env.SESSION_SECRET || 'jashoo-session-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStoreSession.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
});

// Security audit logging
const securityAudit = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Security audit log', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
      fingerprint: req.fingerprint,
      timestamp: new Date()
    });
  });
  
  next();
};

module.exports = {
  BalanceMasker,
  DocumentScanner,
  createRateLimit,
  bruteForce,
  securityHeaders,
  requestFingerprint,
  transactionSecurity,
  sanitizeInput,
  sessionSecurity,
  securityAudit,
  logger
};