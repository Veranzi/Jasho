const express = require('express');
const { Badge, UserBadge, Gamification } = require('../models/Gamification');
const { authenticateToken } = require('../middleware/auth');
const { validatePointsRedemption, validatePagination } = require('../middleware/validation');
const { logger } = require('../middleware/cybersecurity');

const router = express.Router();

// Get gamification profile - matches Flutter GamificationProvider
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    let gamification = await Gamification.findOne({ userId: req.user.userId });

    if (!gamification) {
      // Create gamification profile if it doesn't exist
      gamification = new Gamification({
        userId: req.user.userId,
        points: 0,
        level: 1,
        loginStreakDays: 0,
        lastLoginDate: null
      });
      await gamification.save();
    }

    // Get user badges
    const userBadges = await UserBadge.find({ userId: req.user.userId })
      .populate('badgeId')
      .sort({ earnedAt: -1 });

    const badges = userBadges.map(ub => ({
      id: ub.badgeId.id,
      name: ub.badgeId.name,
      description: ub.badgeId.description,
      icon: ub.badgeId.icon,
      category: ub.badgeId.category,
      pointsRequired: ub.badgeId.pointsRequired,
      earnedAt: ub.earnedAt,
      pointsAtEarned: ub.pointsAtEarned
    }));

    // Return profile in Flutter GamificationProvider format
    const profile = {
      points: gamification.points,
      level: gamification.level,
      badges: badges,
      loginStreakDays: gamification.loginStreakDays,
      // Additional fields for Flutter
      pointsToNextLevel: gamification.pointsToNextLevel,
      levelProgress: gamification.levelProgress,
      totalEarnings: gamification.totalEarnings,
      totalSavings: gamification.totalSavings,
      jobsCompleted: gamification.jobsCompleted,
      achievements: gamification.achievements,
      statistics: gamification.statistics,
      preferences: gamification.preferences,
      lastLoginDate: gamification.lastLoginDate,
      createdAt: gamification.createdAt,
      updatedAt: gamification.updatedAt
    };

    res.json({
      success: true,
      data: {
        profile
      }
    });
  } catch (error) {
    logger.error('Get gamification profile error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get gamification profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_PROFILE_ERROR'
    });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, type = 'points' } = req.query;

    let sortField = 'points';
    switch (type) {
      case 'level':
        sortField = 'level';
        break;
      case 'earnings':
        sortField = 'totalEarnings';
        break;
      case 'savings':
        sortField = 'totalSavings';
        break;
      case 'jobs':
        sortField = 'jobsCompleted';
        break;
      default:
        sortField = 'points';
    }

    const leaderboard = await Gamification.find({})
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('userId', 'userId fullName rating isVerified');

    // Get user's rank
    const userRank = await Gamification.countDocuments({
      [sortField]: { $gt: req.user.gamification?.[sortField] || 0 }
    }) + 1;

    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: (parseInt(page) - 1) * parseInt(limit) + index + 1,
      userId: entry.userId.userId,
      fullName: entry.userId.fullName,
      rating: entry.userId.rating,
      isVerified: entry.userId.isVerified,
      points: entry.points,
      level: entry.level,
      totalEarnings: entry.totalEarnings,
      totalSavings: entry.totalSavings,
      jobsCompleted: entry.jobsCompleted,
      loginStreakDays: entry.loginStreakDays
    }));

    res.json({
      success: true,
      data: {
        leaderboard: formattedLeaderboard,
        userRank,
        type,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: formattedLeaderboard.length
        }
      }
    });
  } catch (error) {
    logger.error('Get leaderboard error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_LEADERBOARD_ERROR'
    });
  }
});

// Get available badges - matches Flutter GamificationProvider.badges
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true }).sort({ pointsRequired: 1 });

    // Get user's earned badges
    const userBadges = await UserBadge.find({ userId: req.user.userId });
    const earnedBadgeIds = userBadges.map(ub => ub.badgeId.toString());

    // Convert to Flutter Badge format
    const formattedBadges = badges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      pointsRequired: badge.pointsRequired,
      isEarned: earnedBadgeIds.includes(badge._id.toString()),
      earnedAt: userBadges.find(ub => ub.badgeId.toString() === badge._id.toString())?.earnedAt || null
    }));

    res.json({
      success: true,
      data: {
        badges: formattedBadges
      }
    });
  } catch (error) {
    logger.error('Get badges error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get badges',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_BADGES_ERROR'
    });
  }
});

// Redeem points - matches Flutter GamificationProvider.redeemPoints()
router.post('/redeem', authenticateToken, validatePointsRedemption, async (req, res) => {
  try {
    const { points, reason } = req.body;

    const gamification = await Gamification.findOne({ userId: req.user.userId });

    if (!gamification) {
      return res.status(404).json({
        success: false,
        message: 'Gamification profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    if (gamification.points < points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points',
        code: 'INSUFFICIENT_POINTS'
      });
    }

    // Redeem points
    await gamification.redeemPoints(points);

    // Log redemption
    logger.info('Points redeemed', {
      userId: req.user.userId,
      points,
      reason,
      remainingPoints: gamification.points,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Points redeemed successfully',
      data: {
        redeemedPoints: points,
        remainingPoints: gamification.points,
        reason: reason || 'Points redemption'
      }
    });
  } catch (error) {
    logger.error('Redeem points error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to redeem points',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'REDEEM_POINTS_ERROR'
    });
  }
});

// Get achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const gamification = await Gamification.findOne({ userId: req.user.userId });

    if (!gamification) {
      return res.status(404).json({
        success: false,
        message: 'Gamification profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    const achievements = gamification.achievements || [];

    res.json({
      success: true,
      data: {
        achievements
      }
    });
  } catch (error) {
    logger.error('Get achievements error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get achievements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_ACHIEVEMENTS_ERROR'
    });
  }
});

// Get gamification statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const gamification = await Gamification.findOne({ userId: req.user.userId });

    if (!gamification) {
      return res.status(404).json({
        success: false,
        message: 'Gamification profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    const statistics = {
      // Points and level
      points: gamification.points,
      level: gamification.level,
      pointsToNextLevel: gamification.pointsToNextLevel,
      levelProgress: gamification.levelProgress,
      
      // Streaks
      loginStreakDays: gamification.loginStreakDays,
      
      // Totals
      totalEarnings: gamification.totalEarnings,
      totalSavings: gamification.totalSavings,
      jobsCompleted: gamification.jobsCompleted,
      
      // Achievements
      achievements: gamification.achievements,
      
      // Statistics
      statistics: gamification.statistics,
      
      // Dates
      lastLoginDate: gamification.lastLoginDate,
      createdAt: gamification.createdAt,
      updatedAt: gamification.updatedAt
    };

    res.json({
      success: true,
      data: {
        statistics
      }
    });
  } catch (error) {
    logger.error('Get gamification statistics error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get gamification statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_STATISTICS_ERROR'
    });
  }
});

// Award badge (admin only)
router.post('/award-badge', authenticateToken, async (req, res) => {
  try {
    const { userId, badgeId } = req.body;

    // Check if user is admin (simplified check)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found',
        code: 'BADGE_NOT_FOUND'
      });
    }

    // Check if user already has this badge
    const existingBadge = await UserBadge.findOne({
      userId,
      badgeId
    });

    if (existingBadge) {
      return res.status(400).json({
        success: false,
        message: 'User already has this badge',
        code: 'BADGE_ALREADY_EARNED'
      });
    }

    // Award badge
    const userBadge = new UserBadge({
      userId,
      badgeId,
      earnedAt: new Date(),
      pointsAtEarned: 0 // Will be updated with current points
    });

    await userBadge.save();

    // Update user's current points at time of earning
    const gamification = await Gamification.findOne({ userId });
    if (gamification) {
      userBadge.pointsAtEarned = gamification.points;
      await userBadge.save();
    }

    res.json({
      success: true,
      message: 'Badge awarded successfully',
      data: {
        badge: {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          pointsRequired: badge.pointsRequired
        },
        userBadge: {
          userId: userBadge.userId,
          badgeId: userBadge.badgeId,
          earnedAt: userBadge.earnedAt,
          pointsAtEarned: userBadge.pointsAtEarned
        }
      }
    });
  } catch (error) {
    logger.error('Award badge error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to award badge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'AWARD_BADGE_ERROR'
    });
  }
});

// Initialize badges (admin only)
router.post('/init-badges', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (simplified check)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    const defaultBadges = [
      {
        id: 'first_login',
        name: 'Welcome!',
        description: 'Complete your first login',
        icon: '🎉',
        category: 'milestone',
        pointsRequired: 0,
        isActive: true
      },
      {
        id: 'first_job',
        name: 'First Gig',
        description: 'Complete your first job',
        icon: '💼',
        category: 'milestone',
        pointsRequired: 100,
        isActive: true
      },
      {
        id: 'first_savings',
        name: 'Saver',
        description: 'Make your first savings contribution',
        icon: '💰',
        category: 'milestone',
        pointsRequired: 50,
        isActive: true
      },
      {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        category: 'level',
        pointsRequired: 5000,
        isActive: true
      },
      {
        id: 'level_10',
        name: 'Superstar',
        description: 'Reach level 10',
        icon: '🌟',
        category: 'level',
        pointsRequired: 10000,
        isActive: true
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain 7-day login streak',
        icon: '🔥',
        category: 'streak',
        pointsRequired: 70,
        isActive: true
      },
      {
        id: 'streak_30',
        name: 'Month Master',
        description: 'Maintain 30-day login streak',
        icon: '🏆',
        category: 'streak',
        pointsRequired: 300,
        isActive: true
      },
      {
        id: 'earner_10000',
        name: 'Big Earner',
        description: 'Earn 10,000 KES total',
        icon: '💵',
        category: 'earning',
        pointsRequired: 1000,
        isActive: true
      },
      {
        id: 'saver_5000',
        name: 'Smart Saver',
        description: 'Save 5,000 KES total',
        icon: '🏦',
        category: 'saving',
        pointsRequired: 500,
        isActive: true
      },
      {
        id: 'jobs_10',
        name: 'Job Master',
        description: 'Complete 10 jobs',
        icon: '🎯',
        category: 'job',
        pointsRequired: 1000,
        isActive: true
      }
    ];

    // Clear existing badges
    await Badge.deleteMany({});

    // Create default badges
    const badges = await Badge.insertMany(defaultBadges);

    res.json({
      success: true,
      message: 'Badges initialized successfully',
      data: {
        badgesCreated: badges.length,
        badges: badges.map(badge => ({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          pointsRequired: badge.pointsRequired
        }))
      }
    });
  } catch (error) {
    logger.error('Initialize badges error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to initialize badges',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'INIT_BADGES_ERROR'
    });
  }
});

module.exports = router;