const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validateKYC, validateObjectId } = require('../middleware/validation');
const { logger } = require('../middleware/cybersecurity');

const router = express.Router();

// Get user profile - matches Flutter UserProvider
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Response format that matches Flutter UserProfile model
    const profile = {
      userId: user.userId,
      fullName: user.fullName,
      skills: user.skills || [],
      location: user.location,
      rating: user.rating,
      isVerified: user.isVerified,
      idType: user.kyc?.idType || null,
      idNumber: user.kyc?.idNumber || null,
      photoUrl: user.kyc?.photoUrl || null,
      absaAccountNumber: user.absaAccountNumber || null,
      // Additional fields for Flutter
      email: user.email,
      phoneNumber: user.phoneNumber,
      verificationLevel: user.verificationLevel,
      joinDate: user.statistics.joinDate,
      totalJobsCompleted: user.statistics.totalJobsCompleted,
      totalEarnings: user.statistics.totalEarnings,
      totalSavings: user.statistics.totalSavings,
      totalWithdrawals: user.statistics.totalWithdrawals,
      profileViews: user.statistics.profileViews,
      isKycComplete: user.kyc?.idNumber != null && user.kyc?.photoUrl != null
    };

    res.json({
      success: true,
      data: {
        profile
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

// Update user profile - matches Flutter UserProvider.updateProfile()
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, skills, location, coordinates } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update user fields
    if (fullName) user.fullName = fullName;
    if (skills) user.skills = skills;
    if (location) user.location = location;
    if (coordinates) {
      user.coordinates = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
    }

    await user.save();

    // Return updated profile in Flutter format
    const profile = {
      userId: user.userId,
      fullName: user.fullName,
      skills: user.skills || [],
      location: user.location,
      rating: user.rating,
      isVerified: user.isVerified,
      idType: user.kyc?.idType || null,
      idNumber: user.kyc?.idNumber || null,
      photoUrl: user.kyc?.photoUrl || null,
      absaAccountNumber: user.absaAccountNumber || null,
      email: user.email,
      phoneNumber: user.phoneNumber,
      verificationLevel: user.verificationLevel,
      joinDate: user.statistics.joinDate,
      totalJobsCompleted: user.statistics.totalJobsCompleted,
      totalEarnings: user.statistics.totalEarnings,
      totalSavings: user.statistics.totalSavings,
      totalWithdrawals: user.statistics.totalWithdrawals,
      profileViews: user.statistics.profileViews,
      isKycComplete: user.kyc?.idNumber != null && user.kyc?.photoUrl != null
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile
      }
    });
  } catch (error) {
    logger.error('Update profile error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
});

// Complete KYC - matches Flutter UserProvider.completeKyc()
router.post('/kyc', authenticateToken, validateKYC, async (req, res) => {
  try {
    const { idType, idNumber, photoUrl, documentUrls } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if ID number already exists
    const existingUser = await User.findOne({
      'kyc.idNumber': idNumber,
      userId: { $ne: user.userId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ID number already registered',
        code: 'ID_NUMBER_EXISTS'
      });
    }

    // Complete KYC
    await user.completeKyc({
      idType,
      idNumber,
      photoUrl,
      documentUrls
    });

    // Return updated profile
    const profile = {
      userId: user.userId,
      fullName: user.fullName,
      skills: user.skills || [],
      location: user.location,
      rating: user.rating,
      isVerified: user.isVerified,
      idType: user.kyc?.idType || null,
      idNumber: user.kyc?.idNumber || null,
      photoUrl: user.kyc?.photoUrl || null,
      absaAccountNumber: user.absaAccountNumber || null,
      email: user.email,
      phoneNumber: user.phoneNumber,
      verificationLevel: user.verificationLevel,
      joinDate: user.statistics.joinDate,
      totalJobsCompleted: user.statistics.totalJobsCompleted,
      totalEarnings: user.statistics.totalEarnings,
      totalSavings: user.statistics.totalSavings,
      totalWithdrawals: user.statistics.totalWithdrawals,
      profileViews: user.statistics.profileViews,
      isKycComplete: user.kyc?.idNumber != null && user.kyc?.photoUrl != null
    };

    res.json({
      success: true,
      message: 'KYC completed successfully',
      data: {
        profile
      }
    });
  } catch (error) {
    logger.error('KYC completion error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to complete KYC',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'KYC_ERROR'
    });
  }
});

// Link Absa account - matches Flutter UserProvider.linkAbsaAccount()
router.post('/absa-account', authenticateToken, async (req, res) => {
  try {
    const { accountNumber } = req.body;

    if (!accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Account number is required',
        code: 'ACCOUNT_NUMBER_REQUIRED'
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

    // Check if account number already exists
    const existingUser = await User.findOne({
      absaAccountNumber: accountNumber,
      userId: { $ne: user.userId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Account number already linked',
        code: 'ACCOUNT_NUMBER_EXISTS'
      });
    }

    // Link Absa account
    user.absaAccountNumber = accountNumber;
    await user.save();

    // Return updated profile
    const profile = {
      userId: user.userId,
      fullName: user.fullName,
      skills: user.skills || [],
      location: user.location,
      rating: user.rating,
      isVerified: user.isVerified,
      idType: user.kyc?.idType || null,
      idNumber: user.kyc?.idNumber || null,
      photoUrl: user.kyc?.photoUrl || null,
      absaAccountNumber: user.absaAccountNumber || null,
      email: user.email,
      phoneNumber: user.phoneNumber,
      verificationLevel: user.verificationLevel,
      joinDate: user.statistics.joinDate,
      totalJobsCompleted: user.statistics.totalJobsCompleted,
      totalEarnings: user.statistics.totalEarnings,
      totalSavings: user.statistics.totalSavings,
      totalWithdrawals: user.statistics.totalWithdrawals,
      profileViews: user.statistics.profileViews,
      isKycComplete: user.kyc?.idNumber != null && user.kyc?.photoUrl != null
    };

    res.json({
      success: true,
      message: 'Absa account linked successfully',
      data: {
        profile
      }
    });
  } catch (error) {
    logger.error('Link Absa account error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to link Absa account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'LINK_ACCOUNT_ERROR'
    });
  }
});

// Update language preference - matches Flutter AiProvider.setLanguage()
router.put('/language', authenticateToken, async (req, res) => {
  try {
    const { language } = req.body;

    if (!language || !['en', 'sw'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Language must be "en" or "sw"',
        code: 'INVALID_LANGUAGE'
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

    user.preferences.language = language;
    await user.save();

    res.json({
      success: true,
      message: 'Language preference updated successfully',
      data: {
        language: user.preferences.language
      }
    });
  } catch (error) {
    logger.error('Update language error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update language preference',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'UPDATE_LANGUAGE_ERROR'
    });
  }
});

// Update notification preferences
router.put('/notifications', authenticateToken, async (req, res) => {
  try {
    const { email, sms, push, marketing } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update notification preferences
    if (email !== undefined) user.preferences.notifications.email = email;
    if (sms !== undefined) user.preferences.notifications.sms = sms;
    if (push !== undefined) user.preferences.notifications.push = push;
    if (marketing !== undefined) user.preferences.notifications.marketing = marketing;

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        notifications: user.preferences.notifications
      }
    });
  } catch (error) {
    logger.error('Update notifications error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'UPDATE_NOTIFICATIONS_ERROR'
    });
  }
});

// Get public user profile - for viewing other users
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId, isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Increment profile views
    user.statistics.profileViews += 1;
    await user.save();

    // Return public profile (limited information)
    const publicProfile = {
      userId: user.userId,
      fullName: user.fullName,
      skills: user.skills || [],
      location: user.location,
      rating: user.rating,
      totalRatings: user.totalRatings,
      isVerified: user.isVerified,
      verificationLevel: user.verificationLevel,
      joinDate: user.statistics.joinDate,
      totalJobsCompleted: user.statistics.totalJobsCompleted,
      // Don't expose sensitive information
      profileViews: user.statistics.profileViews
    };

    res.json({
      success: true,
      data: {
        profile: publicProfile
      }
    });
  } catch (error) {
    logger.error('Get public profile error', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_PROFILE_ERROR'
    });
  }
});

// Deactivate account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Soft delete the account
    await user.softDelete(reason || 'User requested account deletion');

    logger.info('Account deactivated', {
      userId: user.userId,
      email: user.email,
      reason: reason || 'User requested account deletion',
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    logger.error('Account deactivation error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'DEACTIVATE_ACCOUNT_ERROR'
    });
  }
});

module.exports = router;