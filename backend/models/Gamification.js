const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String, // URL to badge icon
    default: null
  },
  category: {
    type: String,
    enum: ['earning', 'saving', 'streak', 'milestone', 'special'],
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
  timestamps: true
});

const userBadgeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  badgeId: {
    type: String,
    required: true,
    ref: 'Badge'
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  pointsAtEarned: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const gamificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
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
    default: 0
  },
  totalSavings: {
    type: Number,
    default: 0
  },
  jobsCompleted: {
    type: Number,
    default: 0
  },
  achievements: [{
    type: {
      type: String,
      enum: ['first_job', 'first_saving', 'streak_7', 'streak_30', 'level_5', 'level_10', 'earner_1000', 'saver_5000']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    pointsAwarded: {
      type: Number,
      default: 0
    }
  }],
  statistics: {
    totalLoginDays: { type: Number, default: 0 },
    totalActiveDays: { type: Number, default: 0 },
    averageDailyEarnings: { type: Number, default: 0 },
    averageDailySavings: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 }
  },
  preferences: {
    showNotifications: { type: Boolean, default: true },
    showLeaderboard: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Indexes
badgeSchema.index({ category: 1 });
badgeSchema.index({ pointsRequired: 1 });

userBadgeSchema.index({ userId: 1, earnedAt: -1 });
userBadgeSchema.index({ badgeId: 1 });
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

gamificationSchema.index({ userId: 1 });
gamificationSchema.index({ points: -1 });
gamificationSchema.index({ level: -1 });

// Virtual for points needed for next level
gamificationSchema.virtual('pointsToNextLevel').get(function() {
  const nextLevelPoints = this.level * 1000;
  return Math.max(0, nextLevelPoints - this.points);
});

// Virtual for progress to next level
gamificationSchema.virtual('levelProgress').get(function() {
  const currentLevelPoints = (this.level - 1) * 1000;
  const nextLevelPoints = this.level * 1000;
  const progress = this.points - currentLevelPoints;
  const total = nextLevelPoints - currentLevelPoints;
  return total > 0 ? Math.round((progress / total) * 100) : 100;
});

// Methods
gamificationSchema.methods.earnPoints = function(points, source = 'general') {
  this.points += points;
  this._checkLevelUp();
  this._checkAchievements();
  return this.save();
};

gamificationSchema.methods.redeemPoints = function(points) {
  if (points > this.points) {
    throw new Error('Insufficient points');
  }
  this.points -= points;
  return this.save();
};

gamificationSchema.methods.recordLogin = function() {
  const today = new Date();
  const todayStr = today.toDateString();
  const lastLoginStr = this.lastLoginDate ? this.lastLoginDate.toDateString() : null;
  
  if (lastLoginStr !== todayStr) {
    if (lastLoginStr && this._isConsecutiveDay(this.lastLoginDate, today)) {
      this.loginStreakDays += 1;
    } else {
      this.loginStreakDays = 1;
    }
    
    this.lastLoginDate = today;
    this.statistics.totalLoginDays += 1;
    
    // Award daily login bonus
    this.earnPoints(10, 'daily_login');
  }
  
  return this.save();
};

gamificationSchema.methods.updateEarnings = function(amount) {
  this.totalEarnings += amount;
  this.statistics.averageDailyEarnings = this.totalEarnings / Math.max(1, this.statistics.totalActiveDays);
  this._checkAchievements();
  return this.save();
};

gamificationSchema.methods.updateSavings = function(amount) {
  this.totalSavings += amount;
  this.statistics.averageDailySavings = this.totalSavings / Math.max(1, this.statistics.totalActiveDays);
  this._checkAchievements();
  return this.save();
};

gamificationSchema.methods.completeJob = function() {
  this.jobsCompleted += 1;
  this.statistics.totalActiveDays += 1;
  this._checkAchievements();
  return this.save();
};

gamificationSchema.methods._checkLevelUp = function() {
  const newLevel = Math.floor(this.points / 1000) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    this.earnPoints(50, 'level_up'); // Bonus points for leveling up
  }
};

gamificationSchema.methods._checkAchievements = function() {
  const achievements = this.achievements.map(a => a.type);
  
  // Check for various achievements
  if (this.jobsCompleted >= 1 && !achievements.includes('first_job')) {
    this.achievements.push({ type: 'first_job', pointsAwarded: 100 });
    this.points += 100;
  }
  
  if (this.totalSavings >= 1000 && !achievements.includes('first_saving')) {
    this.achievements.push({ type: 'first_saving', pointsAwarded: 200 });
    this.points += 200;
  }
  
  if (this.loginStreakDays >= 7 && !achievements.includes('streak_7')) {
    this.achievements.push({ type: 'streak_7', pointsAwarded: 150 });
    this.points += 150;
  }
  
  if (this.loginStreakDays >= 30 && !achievements.includes('streak_30')) {
    this.achievements.push({ type: 'streak_30', pointsAwarded: 500 });
    this.points += 500;
  }
  
  if (this.level >= 5 && !achievements.includes('level_5')) {
    this.achievements.push({ type: 'level_5', pointsAwarded: 300 });
    this.points += 300;
  }
  
  if (this.level >= 10 && !achievements.includes('level_10')) {
    this.achievements.push({ type: 'level_10', pointsAwarded: 1000 });
    this.points += 1000;
  }
  
  if (this.totalEarnings >= 1000 && !achievements.includes('earner_1000')) {
    this.achievements.push({ type: 'earner_1000', pointsAwarded: 400 });
    this.points += 400;
  }
  
  if (this.totalSavings >= 5000 && !achievements.includes('saver_5000')) {
    this.achievements.push({ type: 'saver_5000', pointsAwarded: 800 });
    this.points += 800;
  }
};

gamificationSchema.methods._isConsecutiveDay = function(lastDate, currentDate) {
  const diffTime = currentDate - lastDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

module.exports = {
  Badge: mongoose.model('Badge', badgeSchema),
  UserBadge: mongoose.model('UserBadge', userBadgeSchema),
  Gamification: mongoose.model('Gamification', gamificationSchema)
};