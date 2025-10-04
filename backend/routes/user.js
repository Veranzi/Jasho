const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validateKYC, validateUserId } = require('../middleware/validation');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, location, skills } = req.body;
    const allowedUpdates = {};

    if (fullName !== undefined) {
      allowedUpdates.fullName = fullName.trim();
    }
    if (location !== undefined) {
      allowedUpdates.location = location.trim();
    }
    if (skills !== undefined) {
      allowedUpdates.skills = skills;
    }

    const user = await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Complete KYC verification
router.post('/kyc', authenticateToken, validateKYC, async (req, res) => {
  try {
    const { idType, idNumber, photoUrl } = req.body;

    // Check if KYC is already completed
    if (req.user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'KYC verification already completed'
      });
    }

    // Check if ID number is already used
    const existingUser = await User.findOne({
      'kyc.idNumber': idNumber,
      userId: { $ne: req.user.userId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ID number already registered'
      });
    }

    const user = await User.findOneAndUpdate(
      { userId: req.user.userId },
      {
        $set: {
          'kyc.idType': idType,
          'kyc.idNumber': idNumber,
          'kyc.photoUrl': photoUrl,
          'kyc.verifiedAt': new Date(),
          isVerified: true
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'KYC verification completed successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('KYC verification error:', error);
    res.status(500).json({
      success: false,
      message: 'KYC verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Link Absa account
router.post('/absa-account', authenticateToken, requireVerification, async (req, res) => {
  try {
    const { accountNumber } = req.body;

    if (!accountNumber || accountNumber.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Valid Absa account number is required'
      });
    }

    // Check if account is already linked to another user
    const existingUser = await User.findOne({
      absaAccountNumber: accountNumber,
      userId: { $ne: req.user.userId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Account number already linked to another user'
      });
    }

    const user = await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { absaAccountNumber: accountNumber.trim() } },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Absa account linked successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Link Absa account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link Absa account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update language preference
router.put('/language', authenticateToken, async (req, res) => {
  try {
    const { language } = req.body;

    if (!language || !['en', 'sw'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Valid language code is required (en or sw)'
      });
    }

    const user = await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { 'preferences.language': language } },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Language preference updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update language preference',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update notification preferences
router.put('/notifications', authenticateToken, async (req, res) => {
  try {
    const { email, sms, push } = req.body;
    const allowedUpdates = {};

    if (email !== undefined) {
      allowedUpdates['preferences.notifications.email'] = Boolean(email);
    }
    if (sms !== undefined) {
      allowedUpdates['preferences.notifications.sms'] = Boolean(sms);
    }
    if (push !== undefined) {
      allowedUpdates['preferences.notifications.push'] = Boolean(push);
    }

    const user = await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user by ID (public profile)
router.get('/:userId', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId, isActive: true })
      .select('-password -kyc.idNumber -absaAccountNumber');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Deactivate account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to deactivate account'
      });
    }

    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { isActive: false } }
    );

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;