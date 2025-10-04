const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('./cybersecurity');

// Generate JWT token
const generateToken = (userId, expiresIn = null) => {
  const expiry = expiresIn || process.env.JWT_EXPIRE || '7d';
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: expiry }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findOne({ 
      userId: decoded.userId, 
      isActive: true,
      isBlocked: false
    }).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.security.lockUntil
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid JWT token', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.warn('Expired JWT token', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ 
        userId: decoded.userId, 
        isActive: true,
        isBlocked: false
      }).select('-password');
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user is verified (KYC completed)
const requireVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required',
      code: 'VERIFICATION_REQUIRED',
      verificationLevel: req.user.verificationLevel
    });
  }
  next();
};

// Check if user has wallet PIN set
const requireWalletPin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // This will be checked in the wallet routes
  next();
};

// Check if user has completed KYC
const requireKYC = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.verificationLevel !== 'kyc_verified' && req.user.verificationLevel !== 'fully_verified') {
    return res.status(403).json({
      success: false,
      message: 'KYC verification required',
      code: 'KYC_REQUIRED',
      verificationLevel: req.user.verificationLevel
    });
  }
  next();
};

// Check if user has email verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.verificationLevel === 'unverified' || req.user.verificationLevel === 'phone_verified') {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED',
      verificationLevel: req.user.verificationLevel
    });
  }
  next();
};

// Check if user has phone verified
const requirePhoneVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.verificationLevel === 'unverified' || req.user.verificationLevel === 'email_verified') {
    return res.status(403).json({
      success: false,
      message: 'Phone verification required',
      code: 'PHONE_VERIFICATION_REQUIRED',
      verificationLevel: req.user.verificationLevel
    });
  }
  next();
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (req, res, next) => {
  // This would integrate with Redis-based rate limiting
  // For now, we'll just pass through
  next();
};

// Check user permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has the required permission
    // This would be implemented based on your permission system
    const hasPermission = checkUserPermission(req.user, permission);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission
      });
    }

    next();
  };
};

// Check user permission helper
const checkUserPermission = (user, permission) => {
  // Implement your permission checking logic here
  // For now, return true for all authenticated users
  return true;
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

// Validate token without setting user
const validateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.tokenData = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Token validation error',
      code: 'TOKEN_VALIDATION_ERROR'
    });
  }
};

// Middleware to check if user is the owner of a resource
const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (resourceUserId && resourceUserId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    next();
  };
};

// Middleware to check if user can access a resource
const requireResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Implement resource access checking logic
      const hasAccess = await checkResourceAccess(req.user, resourceType, req.params);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to resource',
          code: 'RESOURCE_ACCESS_DENIED',
          resourceType
        });
      }

      next();
    } catch (error) {
      logger.error('Resource access check error', {
        error: error.message,
        userId: req.user?.userId,
        resourceType
      });

      res.status(500).json({
        success: false,
        message: 'Resource access check failed',
        code: 'RESOURCE_ACCESS_ERROR'
      });
    }
  };
};

// Check resource access helper
const checkResourceAccess = async (user, resourceType, params) => {
  // Implement your resource access checking logic here
  // For now, return true for all authenticated users
  return true;
};

// Middleware to log authentication events
const logAuthEvent = (eventType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the authentication event
      logger.info(`Auth event: ${eventType}`, {
        userId: req.user?.userId,
        email: req.user?.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: res.statusCode < 400,
        statusCode: res.statusCode,
        timestamp: new Date()
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware to check session validity
const checkSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Check if user session is still valid
    const user = await User.findById(req.user.userId);
    
    if (!user || !user.isActive || user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'Session invalid',
        code: 'INVALID_SESSION'
      });
    }

    // Check if user is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is locked',
        code: 'ACCOUNT_LOCKED'
      });
    }

    next();
  } catch (error) {
    logger.error('Session check error', {
      error: error.message,
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      message: 'Session check failed',
      code: 'SESSION_CHECK_ERROR'
    });
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  authenticateToken,
  optionalAuth,
  requireVerification,
  requireWalletPin,
  requireKYC,
  requireEmailVerification,
  requirePhoneVerification,
  sensitiveOperationLimit,
  requirePermission,
  requireAdmin,
  validateToken,
  requireOwnership,
  requireResourceAccess,
  logAuthEvent,
  checkSession
};