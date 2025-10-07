const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { Wallet } = require('../models/Wallet');
const { Gamification } = require('../models/Gamification');
const { CreditScore } = require('../models/CreditScore');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin, validateEmailVerification, validatePhoneVerification } = require('../middleware/validation');
const { logger } = require('../middleware/cybersecurity');
const { sendEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');
const { auth: firebaseAuth } = require('../firebaseAdmin');

const router = express.Router();

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { 
      email, 
      phoneNumber, 
      password, 
      fullName, 
      location, 
      skills = [],
      dateOfBirth,
      gender,
      coordinates
    } = req.body;

    // Check if user already exists
    const existingByEmail = await User.findByEmail(email);
    const existingByPhone = await User.findByPhone(phoneNumber);
    const existingUser = existingByEmail || existingByPhone;

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase() ? 'Email already registered' : 'Phone number already registered',
        code: 'USER_EXISTS'
      });
    }

    // Generate unique userId
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new user
    const user = new User({
      userId,
      email: email.toLowerCase(),
      phoneNumber,
      password,
      fullName,
      location,
      skills,
      dateOfBirth,
      gender,
      coordinates,
      verificationLevel: 'unverified'
    });

    await user.save();

    // Initialize wallet
    let wallet = await Wallet.findByUserId(user.userId);
    if (!wallet) {
      wallet = await Wallet.createWallet(user.userId);
    }

    // Initialize gamification profile
    const gamification = new Gamification({
      userId: user.userId,
      points: 0,
      level: 1,
      loginStreakDays: 0
    });
    await gamification.save();

    // Initialize credit score
    const creditScore = new CreditScore({
      userId: user.userId,
      currentScore: 300, // Starting score
      financialProfile: {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        savingsRate: 0,
        debtToIncomeRatio: 0,
        employmentStability: 0,
        gigWorkConsistency: 0
      },
      paymentPatterns: {
        onTimePayments: 0,
        latePayments: 0,
        missedPayments: 0,
        averagePaymentDelay: 0
      }
    });
    await creditScore.save();

    // Optional: create starter savings goal
    try {
      if (String(process.env.STARTER_GOAL_AUTO_CREATE || 'true').toLowerCase() === 'true') {
        const { SavingsGoal } = require('../models/Savings');
        const starter = new SavingsGoal({
          userId: user.userId,
          name: 'Starter Emergency Fund',
          target: 10000,
          saved: 0,
          category: 'Personal',
          metadata: { starter: true }
        });
        await starter.save();
      }
    } catch (e) {
      logger.warn('Starter goal creation skipped', { error: e.message });
    }

    // Generate email verification token
    const emailToken = user.generateEmailVerificationToken();
    await user.save();

    // Generate phone verification code
    const phoneCode = user.generatePhoneVerificationCode();
    await user.save();

    // Send verification emails/SMS
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Jashoo - Verify Your Email',
        template: 'email-verification',
        data: {
          fullName: user.fullName,
          verificationToken: emailToken,
          userId: user.userId
        }
      });

      await sendSMS({
        to: user.phoneNumber,
        message: `Welcome to Jashoo! Your verification code is: ${phoneCode}. Valid for 10 minutes.`
      });
    } catch (emailError) {
      logger.warn('Failed to send verification email/SMS', {
        userId: user.userId,
        error: emailError.message
      });
    }

    // Generate JWT token
    const token = generateToken(user.userId);

    // Log successful registration
    logger.info('User registered successfully', {
      userId: user.userId,
      email: user.email,
      phoneNumber: user.phoneNumber,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email and phone number.',
      data: {
        token,
        user: user.getPublicProfile(),
        verificationRequired: {
          email: true,
          phone: true
        }
      }
    });
  } catch (error) {
    logger.error('Registration error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, phoneNumber, password, rememberMe = false } = req.body;

    // Find user by email or phone
    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    } else if (phoneNumber) {
      user = await User.findOne({ phoneNumber, isActive: true });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.security.lockUntil
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    await user.updateLastLogin();

    // Update gamification login streak
    const gamification = await Gamification.findOne({ userId: user.userId });
    if (gamification) {
      await gamification.recordLogin();
    }

    // Generate JWT token with appropriate expiration
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Log successful login
    logger.info('User logged in successfully', {
      userId: user.userId,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      rememberMe
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.getPublicProfile(),
        expiresIn: tokenExpiry
      }
    });
  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'LOGIN_ERROR'
    });
  }
});

// Verify email
router.post('/verify-email', validateEmailVerification, async (req, res) => {
  try {
    const { token } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ 'security.emailVerificationToken': hashedToken });

    if (!user || !user.security?.emailVerificationExpires || new Date(user.security.emailVerificationExpires) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }

    // Update user verification status
    user.security.emailVerificationToken = null;
    user.security.emailVerificationExpires = null;
    
    if (user.verificationLevel === 'unverified') {
      user.verificationLevel = 'email_verified';
    } else if (user.verificationLevel === 'phone_verified') {
      user.verificationLevel = 'fully_verified';
    }

    await user.save();

    // Log email verification
    logger.info('Email verified successfully', {
      userId: user.userId,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error('Email verification error', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Verify phone number
router.post('/verify-phone', validatePhoneVerification, async (req, res) => {
  try {
    const { code, phoneNumber } = req.body;

    // Hash the code to compare with stored hash
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({ phoneNumber, 'security.phoneVerificationCode': hashedCode });

    if (!user || !user.security?.phoneVerificationExpires || new Date(user.security.phoneVerificationExpires) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
        code: 'INVALID_CODE'
      });
    }

    // Update user verification status
    user.security.phoneVerificationCode = null;
    user.security.phoneVerificationExpires = null;
    
    if (user.verificationLevel === 'unverified') {
      user.verificationLevel = 'phone_verified';
    } else if (user.verificationLevel === 'email_verified') {
      user.verificationLevel = 'fully_verified';
    }

    await user.save();

    // Log phone verification
    logger.info('Phone verified successfully', {
      userId: user.userId,
      phoneNumber: user.phoneNumber,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error('Phone verification error', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Phone verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Resend verification email
router.post('/resend-email-verification', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.verificationLevel === 'email_verified' || user.verificationLevel === 'fully_verified') {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
        code: 'ALREADY_VERIFIED'
      });
    }

    // Generate new verification token
    const emailToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: 'Jashoo - Verify Your Email',
      template: 'email-verification',
      data: {
        fullName: user.fullName,
        verificationToken: emailToken,
        userId: user.userId
      }
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    logger.error('Resend email verification error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'RESEND_ERROR'
    });
  }
});

// Resend phone verification code
router.post('/resend-phone-verification', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.verificationLevel === 'phone_verified' || user.verificationLevel === 'fully_verified') {
      return res.status(400).json({
        success: false,
        message: 'Phone number already verified',
        code: 'ALREADY_VERIFIED'
      });
    }

    // Generate new verification code
    const phoneCode = user.generatePhoneVerificationCode();
    await user.save();

    // Send verification SMS
    await sendSMS({
      to: user.phoneNumber,
      message: `Your Jashoo verification code is: ${phoneCode}. Valid for 10 minutes.`
    });

    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    logger.error('Resend phone verification error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'RESEND_ERROR'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error('Get profile error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'PROFILE_ERROR'
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user.userId);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });
  } catch (error) {
    logger.error('Token refresh error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'REFRESH_ERROR'
    });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated system, you might blacklist the token
    // For now, we'll just log the logout event
    logger.info('User logged out', {
      userId: req.user.userId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'LOGOUT_ERROR'
    });
  }
});

// Login/Register via Firebase Phone Authentication
router.post('/firebase-phone', async (req, res) => {
  try {
    const { idToken, fullName, location } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'idToken is required',
        code: 'ID_TOKEN_REQUIRED'
      });
    }

    // Verify Firebase ID token
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const phoneNumber = decoded.phone_number;
    const firebaseUid = decoded.uid;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'No phone number on Firebase token',
        code: 'PHONE_REQUIRED'
      });
    }

    // Find or create user by phone number
    let user = await User.findByPhone(phoneNumber);

    if (!user) {
      const autoCreate = String(process.env.FIREBASE_PHONE_AUTO_CREATE || 'true').toLowerCase() === 'true';
      if (!autoCreate) {
        return res.status(404).json({
          success: false,
          message: 'No account found for this phone number. Please register first.',
          code: 'USER_NOT_FOUND',
          data: { requiresRegistration: true }
        });
      }

      const userId = `user_${Date.now()}_${(firebaseUid || Math.random().toString(36)).toString().slice(-6)}`;
      user = new User({
        userId,
        email: null,
        phoneNumber,
        password: null,
        fullName: fullName || 'New User',
        location: location || 'Unknown',
        skills: [],
        verificationLevel: 'phone_verified',
        isVerified: true,
      });
      await user.save();

      // Initialize wallet
      const { Wallet } = require('../models/Wallet');
      let wallet = await Wallet.findByUserId(user.userId);
      if (!wallet) {
        wallet = await Wallet.createWallet(user.userId);
      }

      // Initialize gamification
      const { Gamification } = require('../models/Gamification');
      let gamification = await Gamification.findOne({ userId: user.userId });
      if (!gamification) {
        gamification = await Gamification.createProfile(user.userId);
      }

      // Initialize credit score
      const { CreditScore } = require('../models/CreditScore');
      let creditScore = await CreditScore.findByUser(user.userId);
      if (!creditScore) {
        creditScore = await CreditScore.createProfile(user.userId);
      }

      // Optional: create starter savings goal on phone sign-in
      try {
        if (String(process.env.STARTER_GOAL_AUTO_CREATE || 'true').toLowerCase() === 'true') {
          const { SavingsGoal } = require('../models/Savings');
          const starter = new SavingsGoal({
            userId: user.userId,
            name: 'Starter Emergency Fund',
            target: 10000,
            saved: 0,
            category: 'Personal',
            metadata: { starter: true }
          });
          await starter.save();
        }
      } catch (e) {
        logger.warn('Starter goal creation skipped (phone)', { error: e.message });
      }
    }

    // Issue backend JWT for subsequent API calls
    const token = generateToken(user.userId);

    return res.json({
      success: true,
      message: 'Authenticated via Firebase phone',
      data: {
        token,
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error('Firebase phone auth error', { error: error.message });
    return res.status(401).json({
      success: false,
      message: 'Invalid Firebase token',
      code: 'INVALID_ID_TOKEN'
    });
  }
});

// Check if email is available
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    res.json({
      success: true,
      data: {
        available: !existingUser,
        email: email.toLowerCase()
      }
    });
  } catch (error) {
    logger.error('Check email error', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to check email availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'CHECK_EMAIL_ERROR'
    });
  }
});

// Check if phone number is available
router.post('/check-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
        code: 'PHONE_REQUIRED'
      });
    }

    const existingUser = await User.findOne({ phoneNumber });
    
    res.json({
      success: true,
      data: {
        available: !existingUser,
        phoneNumber
      }
    });
  } catch (error) {
    logger.error('Check phone error', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to check phone number availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'CHECK_PHONE_ERROR'
    });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    await sendEmail({
      to: user.email,
      subject: 'Jashoo - Reset Your Password',
      template: 'password-reset',
      data: {
        fullName: user.fullName,
        resetToken,
        userId: user.userId
      }
    });

    logger.info('Password reset requested', {
      userId: user.userId,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    logger.error('Forgot password error', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'FORGOT_PASSWORD_ERROR'
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ 'security.passwordResetToken': hashedToken });

    if (!user || !user.security?.passwordResetExpires || new Date(user.security.passwordResetExpires) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    }

    // Update password
    user.password = newPassword;
    user.security.passwordResetToken = null;
    user.security.passwordResetExpires = null;
    await user.save();

    logger.info('Password reset successfully', {
      userId: user.userId,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset password error', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'RESET_PASSWORD_ERROR'
    });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
        code: 'MISSING_FIELDS'
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info('Password changed successfully', {
      userId: user.userId,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

module.exports = router;