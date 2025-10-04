const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  icon: {
    type: String,
    default: '🏆'
  },
  category: {
    type: String,
    enum: ['milestone', 'level', 'streak', 'earning', 'saving', 'job', 'special'],
    default: 'milestone'
  },
  pointsRequired: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const userBadgeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  badgeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Badge',
    index: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  pointsAtEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const gamificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User',
    index: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  loginStreakDays: {
    type: Number,
    default: 0,
    min: 0
  },
  lastLoginDate: {
    type: Date,
    default: null
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSavings: {
    type: Number,
    default: 0,
    min: 0
  },
  jobsCompleted: {
    type: Number,
    default: 0,
    min: 0
  },
  achievements: [{
    id: String,
    name: String,
    description: String,
    earnedAt: Date,
    category: String
  }],
  statistics: {
    totalPointsEarned: {
      type: Number,
      default: 0
    },
    totalPointsRedeemed: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    badgesEarned: {
      type: Number,
      default: 0
    },
    levelUps: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    notifications: {
      levelUp: {
        type: Boolean,
        default: true
      },
      badgeEarned: {
        type: Boolean,
        default: true
      },
      streakMilestone: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
gamificationSchema.index({ userId: 1 });
gamificationSchema.index({ points: -1 });
gamificationSchema.index({ level: -1 });
gamificationSchema.index({ loginStreakDays: -1 });

userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
userBadgeSchema.index({ userId: 1, earnedAt: -1 });

badgeSchema.index({ category: 1 });
badgeSchema.index({ pointsRequired: 1 });

// Virtual fields
gamificationSchema.virtual('pointsToNextLevel').get(function() {
  const currentLevelPoints = (this.level - 1) * 1000;
  const nextLevelPoints = this.level * 1000;
  return nextLevelPoints - this.points;
});

gamificationSchema.virtual('levelProgress').get(function() {
  const currentLevelPoints = (this.level - 1) * 1000;
  const nextLevelPoints = this.level * 1000;
  const progress = this.points - currentLevelPoints;
  const total = nextLevelPoints - currentLevelPoints;
  return total > 0 ? Math.round((progress / total) * 100) : 0;
});

// Instance methods
gamificationSchema.methods.earnPoints = async function(points, reason = 'General activity') {
  this.points += points;
  this.statistics.totalPointsEarned += points;
  
  // Check for level up
  const newLevel = 1 + Math.floor(this.points / 1000);
  if (newLevel > this.level) {
    this.level = newLevel;
    this.statistics.levelUps += 1;
    
    // Award level badge if exists
    await this.awardLevelBadge(newLevel);
  }
  
  // Check for achievements
  await this.checkAchievements();
  
  return this.save();
};

gamificationSchema.methods.redeemPoints = async function(points, reason = 'Points redemption') {
  if (points > this.points) {
    throw new Error('Insufficient points');
  }
  
  this.points -= points;
  this.statistics.totalPointsRedeemed += points;
  
  return this.save();
};

gamificationSchema.methods.recordLogin = async function() {
  const today = new Date();
  const todayStr = today.toDateString();
  const lastLoginStr = this.lastLoginDate ? this.lastLoginDate.toDateString() : null;
  
  if (lastLoginStr === todayStr) {
    // Already logged in today
    return this;
  }
  
  if (lastLoginStr === new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString()) {
    // Consecutive day
    this.loginStreakDays += 1;
  } else {
    // New streak
    this.loginStreakDays = 1;
  }
  
  this.lastLoginDate = today;
  
  // Award daily login points
  await this.earnPoints(10, 'Daily login bonus');
  
  // Check for streak achievements
  await this.checkStreakAchievements();
  
  return this.save();
};

gamificationSchema.methods.updateEarnings = async function(amount) {
  this.totalEarnings += amount;
  
  // Award earning points (1% of earnings)
  const points = Math.floor(amount * 0.01);
  if (points > 0) {
    await this.earnPoints(points, 'Earning bonus');
  }
  
  // Check for earning achievements
  await this.checkEarningAchievements();
  
  return this.save();
};

gamificationSchema.methods.updateSavings = async function(amount) {
  this.totalSavings += amount;
  
  // Award saving points (1 KES = 1 point)
  await this.earnPoints(Math.floor(amount), 'Savings contribution');
  
  // Check for saving achievements
  await this.checkSavingAchievements();
  
  return this.save();
};

gamificationSchema.methods.completeJob = async function() {
  this.jobsCompleted += 1;
  
  // Award job completion points
  await this.earnPoints(50, 'Job completion');
  
  // Check for job achievements
  await this.checkJobAchievements();
  
  return this.save();
};

gamificationSchema.methods.awardBadge = async function(badgeId) {
  const Badge = mongoose.model('Badge');
  const badge = await Badge.findById(badgeId);
  
  if (!badge) {
    throw new Error('Badge not found');
  }
  
  // Check if user already has this badge
  const existingBadge = await mongoose.model('UserBadge').findOne({
    userId: this.userId,
    badgeId: badgeId
  });
  
  if (existingBadge) {
    return this; // Already has this badge
  }
  
  // Award badge
  const userBadge = new mongoose.model('UserBadge')({
    userId: this.userId,
    badgeId: badgeId,
    earnedAt: new Date(),
    pointsAtEarned: this.points
  });
  
  await userBadge.save();
  
  // Add to achievements
  this.achievements.push({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    earnedAt: new Date(),
    category: badge.category
  });
  
  this.statistics.badgesEarned += 1;
  
  return this.save();
};

gamificationSchema.methods.checkAchievements = async function() {
  const Badge = mongoose.model('Badge');
  const UserBadge = mongoose.model('UserBadge');
  
  // Get all badges user doesn't have
  const userBadges = await UserBadge.find({ userId: this.userId });
  const userBadgeIds = userBadges.map(ub => ub.badgeId.toString());
  
  const availableBadges = await Badge.find({
    _id: { $nin: userBadgeIds },
    isActive: true
  });
  
  for (const badge of availableBadges) {
    let shouldAward = false;
    
    switch (badge.id) {
      case 'first_login':
        shouldAward = this.loginStreakDays >= 1;
        break;
      case 'first_job':
        shouldAward = this.jobsCompleted >= 1;
        break;
      case 'first_savings':
        shouldAward = this.totalSavings >= 50;
        break;
      case 'level_5':
        shouldAward = this.level >= 5;
        break;
      case 'level_10':
        shouldAward = this.level >= 10;
        break;
      case 'streak_7':
        shouldAward = this.loginStreakDays >= 7;
        break;
      case 'streak_30':
        shouldAward = this.loginStreakDays >= 30;
        break;
      case 'earner_10000':
        shouldAward = this.totalEarnings >= 10000;
        break;
      case 'saver_5000':
        shouldAward = this.totalSavings >= 5000;
        break;
      case 'jobs_10':
        shouldAward = this.jobsCompleted >= 10;
        break;
    }
    
    if (shouldAward) {
      await this.awardBadge(badge._id);
    }
  }
};

gamificationSchema.methods.awardLevelBadge = async function(level) {
  const Badge = mongoose.model('Badge');
  
  let badgeId = null;
  if (level === 5) {
    badgeId = 'level_5';
  } else if (level === 10) {
    badgeId = 'level_10';
  }
  
  if (badgeId) {
    const badge = await Badge.findOne({ id: badgeId });
    if (badge) {
      await this.awardBadge(badge._id);
    }
  }
};

gamificationSchema.methods.checkStreakAchievements = async function() {
  const Badge = mongoose.model('Badge');
  
  if (this.loginStreakDays === 7) {
    const badge = await Badge.findOne({ id: 'streak_7' });
    if (badge) {
      await this.awardBadge(badge._id);
    }
  } else if (this.loginStreakDays === 30) {
    const badge = await Badge.findOne({ id: 'streak_30' });
    if (badge) {
      await this.awardBadge(badge._id);
    }
  }
};

gamificationSchema.methods.checkEarningAchievements = async function() {
  const Badge = mongoose.model('Badge');
  
  if (this.totalEarnings >= 10000) {
    const badge = await Badge.findOne({ id: 'earner_10000' });
    if (badge) {
      await this.awardBadge(badge._id);
    }
  }
};

gamificationSchema.methods.checkSavingAchievements = async function() {
  const Badge = mongoose.model('Badge');
  
  if (this.totalSavings >= 5000) {
    const badge = await Badge.findOne({ id: 'saver_5000' });
    if (badge) {
      await this.awardBadge(badge._id);
    }
  }
};

gamificationSchema.methods.checkJobAchievements = async function() {
  const Badge = mongoose.model('Badge');
  
  if (this.jobsCompleted === 1) {
    const badge = await Badge.findOne({ id: 'first_job' });
    if (badge) {
      await this.awardBadge(badge._id);
    }
  } else if (this.jobsCompleted === 10) {
    const badge = await Badge.findOne({ id: 'jobs_10' });
    if (badge) {
      await this.awardBadge(badge._id);
    }
  }
};

// Static methods
gamificationSchema.statics.findByUser = function(userId) {
  return this.findOne({ userId });
};

gamificationSchema.statics.createProfile = function(userId) {
  return this.create({
    userId,
    points: 0,
    level: 1,
    loginStreakDays: 0
  });
};

gamificationSchema.statics.getLeaderboard = function(options = {}) {
  const { limit = 20, skip = 0, sortBy = 'points' } = options;
  
  return this.find({})
    .sort({ [sortBy]: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'userId fullName rating isVerified');
};

module.exports = {
  Badge: mongoose.model('Badge', badgeSchema),
  UserBadge: mongoose.model('UserBadge', userBadgeSchema),
  Gamification: mongoose.model('Gamification', gamificationSchema)
};