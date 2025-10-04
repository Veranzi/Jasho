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
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: `${process.env.LOG_FILE_PATH || './logs'}/security.log`,
      maxsize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d'
    }),
    new winston.transports.File({ 
      filename: `${process.env.LOG_FILE_PATH || './logs'}/error.log`, 
      level: 'error',
      maxsize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d'
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
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

  static maskSensitiveData(data, fields = ['password', 'pin', 'token', 'secret']) {
    const masked = { ...data };
    
    fields.forEach(field => {
      if (masked[field]) {
        masked[field] = '*'.repeat(masked[field].length);
      }
    });
    
    return masked;
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
        'exploit', 'payload', 'injection', 'phishing'
      ];
      
      // Extract text from image (OCR simulation)
      const extractedText = await this.extractTextFromImage(imagePath);
      
      // Check for malicious content
      const isSafe = !suspiciousPatterns.some(pattern => 
        extractedText.toLowerCase().includes(pattern)
      );
      
      // Check image metadata for anomalies
      const metadataCheck = this.checkImageMetadata(metadata);
      
      return {
        isSafe: isSafe && metadataCheck.isSafe,
        extractedText,
        metadata,
        metadataCheck,
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

  static checkImageMetadata(metadata) {
    const checks = {
      isSafe: true,
      issues: []
    };

    // Check file size
    if (metadata.size > 10 * 1024 * 1024) { // 10MB
      checks.issues.push('File size too large');
      checks.isSafe = false;
    }

    // Check dimensions
    if (metadata.width > 8000 || metadata.height > 8000) {
      checks.issues.push('Image dimensions too large');
      checks.isSafe = false;
    }

    // Check for suspicious EXIF data
    if (metadata.exif && metadata.exif.includes('script')) {
      checks.issues.push('Suspicious EXIF data');
      checks.isSafe = false;
    }

    return checks;
  }

  static async validateQRCode(qrData) {
    try {
      // Check if QR code contains malicious URLs
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = qrData.match(urlRegex) || [];
      
      for (const url of urls) {
        const isSafe = await this.checkUrlSafety(url);
        if (!isSafe) {
          return { isSafe: false, reason: 'Malicious URL detected', url };
        }
      }
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        'javascript:', 'data:', 'vbscript:',
        'onload=', 'onerror=', 'onclick='
      ];
      
      const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
        qrData.toLowerCase().includes(pattern)
      );
      
      if (hasSuspiciousPattern) {
        return { isSafe: false, reason: 'Suspicious pattern detected' };
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
        'malware.com', 'virus.net', 'phishing.org',
        'scam.com', 'fake.net', 'suspicious.org'
      ];
      
      const domain = new URL(url).hostname;
      const isMalicious = maliciousDomains.includes(domain);
      
      if (isMalicious) {
        return false;
      }
      
      // Additional URL safety checks
      const suspiciousPatterns = [
        'bit.ly', 'tinyurl.com', 'shortened',
        'redirect', 'phishing', 'malware'
      ];
      
      const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
        url.toLowerCase().includes(pattern)
      );
      
      return !hasSuspiciousPattern;
    } catch (error) {
      return false;
    }
  }
}

// Advanced rate limiting
const createRateLimit = (windowMs, max, message, options = {}) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message, code: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        userId: req.user?.userId,
        timestamp: new Date()
      });
      
      res.status(429).json({
        success: false,
        message,
        code: 'RATE_LIMIT_EXCEEDED',
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
    userAgent: req.get('User-Agent'),
    timestamp: new Date()
  });
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i,
    /<script/i,
    /eval\(/i,
    /expression\(/i
  ];
  
  const bodyStr = JSON.stringify(req.body);
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
    pattern.test(bodyStr)
  );
  
  if (hasSuspiciousContent) {
    logger.warn('Suspicious content detected in transaction', {
      userId: req.user?.userId,
      content: bodyStr.substring(0, 500), // Limit logged content
      ip: req.ip,
      fingerprint: req.fingerprint,
      timestamp: new Date()
    });
    
    return res.status(400).json({
      success: false,
      message: 'Suspicious content detected',
      code: 'SUSPICIOUS_CONTENT'
    });
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /or\s+1\s*=\s*1/i,
    /'\s*or\s*'/i
  ];
  
  const hasSQLInjection = sqlPatterns.some(pattern => 
    pattern.test(bodyStr)
  );
  
  if (hasSQLInjection) {
    logger.warn('SQL injection attempt detected', {
      userId: req.user?.userId,
      content: bodyStr.substring(0, 500),
      ip: req.ip,
      fingerprint: req.fingerprint,
      timestamp: new Date()
    });
    
    return res.status(400).json({
      success: false,
      message: 'Invalid request format',
      code: 'INVALID_REQUEST'
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
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
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
    maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE) || 86400000, // 24 hours
    sameSite: 'strict'
  },
  name: 'jashoo.sid'
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
      timestamp: new Date(),
      success: res.statusCode < 400
    });
  });
  
  next();
};

// Threat detection middleware
const threatDetection = (req, res, next) => {
  const threats = [];
  
  // Check for suspicious IP patterns
  const ip = req.ip;
  if (ip) {
    // Check against known malicious IPs (simplified)
    const maliciousIPs = ['127.0.0.1']; // Add your malicious IP list
    if (maliciousIPs.includes(ip)) {
      threats.push('Malicious IP detected');
    }
  }
  
  // Check for suspicious user agent
  const userAgent = req.get('User-Agent');
  if (userAgent) {
    const suspiciousAgents = ['bot', 'crawler', 'scanner', 'hack'];
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      threats.push('Suspicious user agent');
    }
  }
  
  // Check for rapid requests
  const now = Date.now();
  if (!req.session.requestTimes) {
    req.session.requestTimes = [];
  }
  
  req.session.requestTimes = req.session.requestTimes.filter(time => now - time < 60000); // Last minute
  req.session.requestTimes.push(now);
  
  if (req.session.requestTimes.length > 100) { // More than 100 requests per minute
    threats.push('Rapid requests detected');
  }
  
  if (threats.length > 0) {
    logger.warn('Threat detected', {
      threats,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
      fingerprint: req.fingerprint,
      timestamp: new Date()
    });
    
    return res.status(429).json({
      success: false,
      message: 'Suspicious activity detected',
      code: 'THREAT_DETECTED'
    });
  }
  
  next();
};

// Data encryption middleware
const encryptSensitiveData = (fields = []) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach(field => {
        if (req.body[field]) {
          const encrypted = BalanceMasker.encryptBalance(req.body[field], req.user?.userId || 'anonymous');
          req.body[`${field}_encrypted`] = encrypted;
          delete req.body[field];
        }
      });
    }
    next();
  };
};

// Decrypt sensitive data middleware
const decryptSensitiveData = (fields = []) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach(field => {
        const encryptedField = `${field}_encrypted`;
        if (req.body[encryptedField]) {
          try {
            const decrypted = BalanceMasker.decryptBalance(req.body[encryptedField], req.user?.userId || 'anonymous');
            req.body[field] = decrypted;
            delete req.body[encryptedField];
          } catch (error) {
            logger.error('Decryption error', {
              field,
              error: error.message,
              userId: req.user?.userId
            });
          }
        }
      });
    }
    next();
  };
};

// Security monitoring middleware
const securityMonitoring = (req, res, next) => {
  if (process.env.SECURITY_MONITORING_ENABLED === 'true') {
    // Monitor for security events
    const securityEvents = [];
    
    // Check for failed authentication attempts
    if (req.path.includes('/login') && req.method === 'POST') {
      // This will be handled in the login route
    }
    
    // Check for suspicious file uploads
    if (req.path.includes('/upload') && req.files) {
      securityEvents.push('File upload detected');
    }
    
    // Log security events
    if (securityEvents.length > 0) {
      logger.info('Security event detected', {
        events: securityEvents,
        userId: req.user?.userId,
        ip: req.ip,
        endpoint: req.path,
        timestamp: new Date()
      });
    }
  }
  
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
  threatDetection,
  encryptSensitiveData,
  decryptSensitiveData,
  securityMonitoring,
  logger
};