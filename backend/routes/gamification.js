const express = require('express');
const { Gamification, Badge, UserBadge } = require('../models/Gamification');
const { authenticateToken } = require('../middleware/auth');
const { validatePointsRedemption, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get user's gamification profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    let gamification = await Gamification.findOne({ userId: req.user.userId });

    if (!gamification) {
      // Create gamification profile if it doesn't exist
      gamification = new Gamification({
        userId: req.user.userId
      });
      await gamification.save();
    }

    // Get user's badges
    const userBadges = await UserBadge.find({ userId: req.user.userId })
      .populate('badgeId')
      .sort({ earnedAt: -1 });

    res.json({
      success: true,
      data: {
        gamification,
        badges: userBadges.map(ub => ({
          ...ub.badgeId.toObject(),
          earnedAt: ub.earnedAt,
          pointsAtEarned: ub.pointsAtEarned
        }))
      }
    });
  } catch (error) {
    console.error('Get gamification profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gamification profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const leaderboard = await Gamification.find()
      .populate('userId', 'userId fullName rating')
      .sort({ points: -1 })
      .skip(skip)
      .limit(limit);

    // Get user's rank
    const userRank = await Gamification.countDocuments({
      points: { $gt: leaderboard.find(g => g.userId === req.user.userId)?.points || 0 }
    }) + 1;

    const total = await Gamification.countDocuments();

    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.map((g, index) => ({
          rank: skip + index + 1,
          userId: g.userId.userId,
          fullName: g.userId.fullName,
          rating: g.userId.rating,
          points: g.points,
          level: g.level,
          loginStreakDays: g.loginStreakDays
        })),
        userRank,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get available badges
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true }).sort({ pointsRequired: 1 });

    // Get user's earned badges
    const userBadges = await UserBadge.find({ userId: req.user.userId })
      .populate('badgeId');

    const earnedBadgeIds = userBadges.map(ub => ub.badgeId.id);

    res.json({
      success: true,
      data: {
        badges: badges.map(badge => ({
          ...badge.toObject(),
          earned: earnedBadgeIds.includes(badge.id),
          earnedAt: userBadges.find(ub => ub.badgeId.id === badge.id)?.earnedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get badges',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Redeem points
router.post('/redeem', authenticateToken, validatePointsRedemption, async (req, res) => {
  try {
    const { points, reason } = req.body;

    let gamification = await Gamification.findOne({ userId: req.user.userId });

    if (!gamification) {
      return res.status(404).json({
        success: false,
        message: 'Gamification profile not found'
      });
    }

    if (points > gamification.points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    await gamification.redeemPoints(points);

    res.json({
      success: true,
      message: 'Points redeemed successfully',
      data: {
        pointsRedeemed: points,
        remainingPoints: gamification.points,
        reason: reason || 'Points redemption'
      }
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeem points',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    let gamification = await Gamification.findOne({ userId: req.user.userId });

    if (!gamification) {
      gamification = new Gamification({
        userId: req.user.userId
      });
      await gamification.save();
    }

    res.json({
      success: true,
      data: {
        achievements: gamification.achievements.sort((a, b) => b.earnedAt - a.earnedAt)
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    let gamification = await Gamification.findOne({ userId: req.user.userId });

    if (!gamification) {
      gamification = new Gamification({
        userId: req.user.userId
      });
      await gamification.save();
    }

    // Get total users for comparison
    const totalUsers = await Gamification.countDocuments();

    // Get user's percentile
    const usersWithMorePoints = await Gamification.countDocuments({
      points: { $gt: gamification.points }
    });
    const percentile = Math.round(((totalUsers - usersWithMorePoints) / totalUsers) * 100);

    // Get recent achievements (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentAchievements = gamification.achievements.filter(
      achievement => achievement.earnedAt > sevenDaysAgo
    );

    res.json({
      success: true,
      data: {
        gamification,
        percentile,
        totalUsers,
        recentAchievements,
        nextLevelPoints: gamification.pointsToNextLevel,
        levelProgress: gamification.levelProgress
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Award badge manually (admin function)
router.post('/award-badge', authenticateToken, async (req, res) => {
  try {
    const { badgeId, userId } = req.body;

    // Check if badge exists
    const badge = await Badge.findOne({ id: badgeId, isActive: true });
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    // Check if user exists
    const targetUser = userId || req.user.userId;
    const user = await require('../models/User').findOne({ userId: targetUser });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has this badge
    const existingBadge = await UserBadge.findOne({
      userId: targetUser,
      badgeId: badge._id
    });

    if (existingBadge) {
      return res.status(400).json({
        success: false,
        message: 'User already has this badge'
      });
    }

    // Award the badge
    const userBadge = new UserBadge({
      userId: targetUser,
      badgeId: badge._id,
      pointsAtEarned: 0 // Will be updated with current points
    });

    await userBadge.save();

    // Update gamification points
    let gamification = await Gamification.findOne({ userId: targetUser });
    if (gamification) {
      await gamification.earnPoints(badge.pointsRequired || 0, 'badge_award');
      userBadge.pointsAtEarned = gamification.points;
      await userBadge.save();
    }

    res.json({
      success: true,
      message: 'Badge awarded successfully',
      data: {
        badge,
        userBadge
      }
    });
  } catch (error) {
    console.error('Award badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award badge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Initialize default badges (admin function)
router.post('/init-badges', authenticateToken, async (req, res) => {
  try {
    const defaultBadges = [
      {
        id: 'first_job',
        name: 'First Job',
        description: 'Complete your first job',
        category: 'earning',
        pointsRequired: 100
      },
      {
        id: 'first_saving',
        name: 'First Saver',
        description: 'Make your first savings contribution',
        category: 'saving',
        pointsRequired: 200
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day login streak',
        category: 'streak',
        pointsRequired: 150
      },
      {
        id: 'streak_30',
        name: 'Month Master',
        description: 'Maintain a 30-day login streak',
        category: 'streak',
        pointsRequired: 500
      },
      {
        id: 'level_5',
        name: 'Level 5',
        description: 'Reach level 5',
        category: 'milestone',
        pointsRequired: 300
      },
      {
        id: 'level_10',
        name: 'Level 10',
        description: 'Reach level 10',
        category: 'milestone',
        pointsRequired: 1000
      },
      {
        id: 'earner_1000',
        name: 'Big Earner',
        description: 'Earn 1000 KES total',
        category: 'earning',
        pointsRequired: 400
      },
      {
        id: 'saver_5000',
        name: 'Super Saver',
        description: 'Save 5000 KES total',
        category: 'saving',
        pointsRequired: 800
      }
    ];

    for (const badgeData of defaultBadges) {
      const existingBadge = await Badge.findOne({ id: badgeData.id });
      if (!existingBadge) {
        const badge = new Badge(badgeData);
        await badge.save();
      }
    }

    res.json({
      success: true,
      message: 'Default badges initialized successfully'
    });
  } catch (error) {
    console.error('Init badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize badges',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;