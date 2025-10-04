const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic Information
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  
  // Personal Information
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    required: false
  },
  
  // Professional Information
  skills: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  
  // Rating and Verification
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    set: v => Math.round(v * 10) / 10 // Round to 1 decimal place
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationLevel: {
    type: String,
    enum: ['unverified', 'phone_verified', 'email_verified', 'kyc_verified', 'fully_verified'],
    default: 'unverified'
  },
  
  // KYC Information
  kyc: {
    idType: {
      type: String,
      enum: ['ID', 'Passport', 'Driving_License'],
      default: null
    },
    idNumber: {
      type: String,
      default: null,
      trim: true
    },
    photoUrl: {
      type: String,
      default: null
    },
    documentUrls: [{
      type: String
    }],
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: String,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    }
  },
  
  // Financial Information
  absaAccountNumber: {
    type: String,
    default: null,
    trim: true
  },
  bankDetails: {
    bankName: {
      type: String,
      default: null
    },
    accountNumber: {
      type: String,
      default: null
    },
    accountName: {
      type: String,
      default: null
    },
    branchCode: {
      type: String,
      default: null
    }
  },
  
  // Preferences
  preferences: {
    language: {
      type: String,
      enum: ['en', 'sw'],
      default: 'en'
    },
    currency: {
      type: String,
      enum: ['KES', 'USD'],
      default: 'KES'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'contacts_only'],
        default: 'public'
      },
      showLocation: {
        type: Boolean,
        default: true
      },
      showRating: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Security Information
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String,
      default: null,
      select: false
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false
    },
    emailVerificationToken: {
      type: String,
      default: null,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false
    },
    phoneVerificationCode: {
      type: String,
      default: null,
      select: false
    },
    phoneVerificationExpires: {
      type: Date,
      default: null,
      select: false
    }
  },
  
  // Status and Activity
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedReason: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // Statistics
  statistics: {
    totalJobsCompleted: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    totalSavings: {
      type: Number,
      default: 0
    },
    totalWithdrawals: {
      type: Number,
      default: 0
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    profileViews: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  metadata: {
    source: {
      type: String,
      default: 'web'
    },
    userAgent: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    referrer: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ location: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Virtual fields
userSchema.virtual('fullProfile').get(function() {
  return {
    userId: this.userId,
    email: this.email,
    phoneNumber: this.phoneNumber,
    fullName: this.fullName,
    skills: this.skills,
    location: this.location,
    rating: this.rating,
    totalRatings: this.totalRatings,
    isVerified: this.isVerified,
    verificationLevel: this.verificationLevel,
    joinDate: this.statistics.joinDate,
    totalJobsCompleted: this.statistics.totalJobsCompleted,
    totalEarnings: this.statistics.totalEarnings
  };
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.statistics.joinDate) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', function(next) {
  // Update lastActive on save
  this.lastActive = new Date();
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.security.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.security.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.security.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.security.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};

userSchema.methods.generatePhoneVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  this.security.phoneVerificationCode = crypto.createHash('sha256').update(code).digest('hex');
  this.security.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return code;
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'security.loginAttempts': 1, 'security.lockUntil': 1 }
  });
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.lastActive = new Date();
  return this.save();
};

userSchema.methods.updateRating = function(newRating) {
  const totalRatings = this.totalRatings + 1;
  const currentTotal = this.rating * this.totalRatings;
  const newTotal = currentTotal + newRating;
  this.rating = newTotal / totalRatings;
  this.totalRatings = totalRatings;
  return this.save();
};

userSchema.methods.completeKyc = function(kycData) {
  this.kyc = {
    ...this.kyc,
    ...kycData,
    verifiedAt: new Date(),
    verifiedBy: 'system'
  };
  this.isVerified = true;
  this.verificationLevel = 'kyc_verified';
  return this.save();
};

userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.security;
  delete userObject.__v;
  return userObject;
};

userSchema.methods.getSafeProfile = function() {
  return {
    userId: this.userId,
    fullName: this.fullName,
    skills: this.skills,
    location: this.location,
    rating: this.rating,
    totalRatings: this.totalRatings,
    isVerified: this.isVerified,
    verificationLevel: this.verificationLevel,
    joinDate: this.statistics.joinDate,
    totalJobsCompleted: this.statistics.totalJobsCompleted
  };
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByPhone = function(phoneNumber) {
  return this.findOne({ phoneNumber });
};

userSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true, isBlocked: false });
};

userSchema.statics.findVerifiedUsers = function() {
  return this.find({ isVerified: true, isActive: true });
};

userSchema.statics.searchUsers = function(query, options = {}) {
  const { location, skills, minRating, limit = 20, skip = 0 } = options;
  
  const searchQuery = {
    isActive: true,
    isBlocked: false
  };
  
  if (query) {
    searchQuery.$or = [
      { fullName: { $regex: query, $options: 'i' } },
      { skills: { $in: [new RegExp(query, 'i')] } }
    ];
  }
  
  if (location) {
    searchQuery.location = { $regex: location, $options: 'i' };
  }
  
  if (skills && skills.length > 0) {
    searchQuery.skills = { $in: skills };
  }
  
  if (minRating) {
    searchQuery.rating = { $gte: minRating };
  }
  
  return this.find(searchQuery)
    .sort({ rating: -1, totalRatings: -1 })
    .limit(limit)
    .skip(skip);
};

// Middleware for soft delete
userSchema.methods.softDelete = function(reason = 'User requested account deletion') {
  this.isActive = false;
  this.isBlocked = true;
  this.blockedReason = reason;
  return this.save();
};

// Middleware for account reactivation
userSchema.methods.reactivate = function() {
  this.isActive = true;
  this.isBlocked = false;
  this.blockedReason = null;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);