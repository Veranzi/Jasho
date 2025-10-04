const mongoose = require('mongoose');
const crypto = require('crypto');

const transactionSchema = new mongoose.Schema({
  // Basic Information
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  
  // Transaction Details
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdrawal', 'earning', 'convert', 'transfer', 'payment', 'refund', 'bonus', 'penalty'],
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currencyCode: {
    type: String,
    required: true,
    enum: ['KES', 'USDT', 'USD'],
    default: 'KES',
    index: true
  },
  
  // Status and Processing
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  processingStatus: {
    type: String,
    enum: ['initiated', 'validated', 'authorized', 'processed', 'confirmed'],
    default: 'initiated'
  },
  
  // Transaction Metadata
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50,
    index: true
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  // Source and Destination
  source: {
    type: String,
    enum: ['wallet', 'bank', 'mpesa', 'card', 'cash', 'job', 'bonus', 'refund'],
    default: 'wallet'
  },
  destination: {
    type: String,
    enum: ['wallet', 'bank', 'mpesa', 'card', 'cash', 'savings', 'loan'],
    default: 'wallet'
  },
  
  // Related Entities
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanRequest',
    default: null
  },
  savingsGoalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavingsGoal',
    default: null
  },
  
  // Transfer Information
  transferInfo: {
    recipientUserId: {
      type: String,
      ref: 'User',
      default: null
    },
    recipientName: {
      type: String,
      default: null
    },
    recipientPhone: {
      type: String,
      default: null
    }
  },
  
  // Payment Method Details
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'bank_transfer', 'card', 'cash', 'crypto', 'absa'],
    default: null
  },
  paymentReference: {
    type: String,
    default: null,
    index: true
  },
  externalTransactionId: {
    type: String,
    default: null,
    index: true
  },
  
  // Blockchain Information
  blockchain: {
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'bsc'],
      default: null
    },
    transactionHash: {
      type: String,
      default: null,
      index: true
    },
    blockNumber: {
      type: Number,
      default: null
    },
    gasUsed: {
      type: Number,
      default: null
    },
    gasPrice: {
      type: Number,
      default: null
    }
  },
  
  // Fees and Charges
  fees: {
    processingFee: {
      type: Number,
      default: 0
    },
    networkFee: {
      type: Number,
      default: 0
    },
    totalFees: {
      type: Number,
      default: 0
    }
  },
  
  // Exchange Rate (for conversions)
  exchangeRate: {
    fromCurrency: {
      type: String,
      default: null
    },
    toCurrency: {
      type: String,
      default: null
    },
    rate: {
      type: Number,
      default: null
    },
    convertedAmount: {
      type: Number,
      default: null
    }
  },
  
  // Security Information
  security: {
    pinVerified: {
      type: Boolean,
      default: false
    },
    biometricVerified: {
      type: Boolean,
      default: false
    },
    deviceFingerprint: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    }
  },
  
  // Timing Information
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  failedAt: {
    type: Date,
    default: null
  },
  
  // Error Information
  error: {
    code: {
      type: String,
      default: null
    },
    message: {
      type: String,
      default: null
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  
  // Additional Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Audit Information
  audit: {
    createdBy: {
      type: String,
      default: 'system'
    },
    modifiedBy: {
      type: String,
      default: null
    },
    version: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const walletSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User',
    index: true
  },
  
  // Balance Information
  balances: {
    KES: {
      type: Number,
      default: 0,
      min: 0
    },
    USDT: {
      type: Number,
      default: 0,
      min: 0
    },
    USD: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Locked Balances (for pending transactions)
  lockedBalances: {
    KES: {
      type: Number,
      default: 0,
      min: 0
    },
    USDT: {
      type: Number,
      default: 0,
      min: 0
    },
    USD: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Transaction PIN Security
  transactionPin: {
    hash: {
      type: String,
      default: null,
      select: false
    },
    attempts: {
      type: Number,
      default: 0
    },
    lockedUntil: {
      type: Date,
      default: null
    },
    lastUsed: {
      type: Date,
      default: null
    }
  },
  
  // Daily Limits
  dailyLimits: {
    withdrawal: {
      KES: {
        type: Number,
        default: 100000 // 100,000 KES
      },
      USDT: {
        type: Number,
        default: 1000 // 1,000 USDT
      },
      USD: {
        type: Number,
        default: 1000 // 1,000 USD
      }
    },
    transfer: {
      KES: {
        type: Number,
        default: 50000 // 50,000 KES
      },
      USDT: {
        type: Number,
        default: 500 // 500 USDT
      },
      USD: {
        type: Number,
        default: 500 // 500 USD
      }
    }
  },
  
  // Daily Usage Tracking
  dailyUsage: {
    date: {
      type: Date,
      default: Date.now
    },
    withdrawal: {
      KES: {
        type: Number,
        default: 0
      },
      USDT: {
        type: Number,
        default: 0
      },
      USD: {
        type: Number,
        default: 0
      }
    },
    transfer: {
      KES: {
        type: Number,
        default: 0
      },
      USDT: {
        type: Number,
        default: 0
      },
      USD: {
        type: Number,
        default: 0
      }
    }
  },
  
  // Statistics
  statistics: {
    totalDeposits: {
      KES: {
        type: Number,
        default: 0
      },
      USDT: {
        type: Number,
        default: 0
      },
      USD: {
        type: Number,
        default: 0
      }
    },
    totalWithdrawals: {
      KES: {
        type: Number,
        default: 0
      },
      USDT: {
        type: Number,
        default: 0
      },
      USD: {
        type: Number,
        default: 0
      }
    },
    totalEarnings: {
      KES: {
        type: Number,
        default: 0
      },
      USDT: {
        type: Number,
        default: 0
      },
      USD: {
        type: Number,
        default: 0
      }
    },
    totalTransactions: {
      type: Number,
      default: 0
    },
    lastTransactionAt: {
      type: Date,
      default: null
    }
  },
  
  // Security Settings
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    biometricEnabled: {
      type: Boolean,
      default: false
    },
    autoLockEnabled: {
      type: Boolean,
      default: true
    },
    autoLockTimeout: {
      type: Number,
      default: 300000 // 5 minutes in milliseconds
    },
    lastSecurityCheck: {
      type: Date,
      default: Date.now
    }
  },
  
  // Wallet Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'frozen', 'closed'],
    default: 'active',
    index: true
  },
  suspensionReason: {
    type: String,
    default: null
  },
  frozenUntil: {
    type: Date,
    default: null
  },
  
  // Blockchain Integration
  blockchain: {
    enabled: {
      type: Boolean,
      default: false
    },
    walletAddress: {
      type: String,
      default: null,
      index: true
    },
    privateKey: {
      type: String,
      default: null,
      select: false
    },
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'bsc'],
      default: 'ethereum'
    },
    lastSyncAt: {
      type: Date,
      default: null
    }
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ paymentReference: 1 });
transactionSchema.index({ externalTransactionId: 1 });
transactionSchema.index({ 'blockchain.transactionHash': 1 });
transactionSchema.index({ initiatedAt: -1 });

walletSchema.index({ userId: 1 });
walletSchema.index({ status: 1 });
walletSchema.index({ 'blockchain.walletAddress': 1 });

// Virtual fields
transactionSchema.virtual('netAmount').get(function() {
  return this.amount - (this.fees.totalFees || 0);
});

transactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

transactionSchema.virtual('isPending').get(function() {
  return this.status === 'pending' || this.status === 'processing';
});

transactionSchema.virtual('isFailed').get(function() {
  return this.status === 'failed';
});

walletSchema.virtual('totalBalance').get(function() {
  return this.balances.KES + this.balances.USDT + this.balances.USD;
});

walletSchema.virtual('availableBalance').get(function() {
  return {
    KES: this.balances.KES - this.lockedBalances.KES,
    USDT: this.balances.USDT - this.lockedBalances.USDT,
    USD: this.balances.USD - this.lockedBalances.USD
  };
});

walletSchema.virtual('isPinLocked').get(function() {
  return !!(this.transactionPin.lockedUntil && this.transactionPin.lockedUntil > Date.now());
});

walletSchema.virtual('isFrozen').get(function() {
  return !!(this.frozenUntil && this.frozenUntil > Date.now());
});

// Transaction methods
transactionSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.processingStatus = 'confirmed';
  return this.save();
};

transactionSchema.methods.markAsFailed = function(errorCode, errorMessage) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.error = {
    code: errorCode,
    message: errorMessage
  };
  return this.save();
};

transactionSchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  this.processedAt = new Date();
  this.processingStatus = 'processed';
  return this.save();
};

transactionSchema.methods.generateTransactionId = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 9);
  return `TXN_${timestamp}_${random}`.toUpperCase();
};

// Wallet methods
walletSchema.methods.updateBalance = async function(amount, currency, type, lockAmount = 0) {
  const currencyKey = currency.toUpperCase();
  
  if (type === 'deposit' || type === 'earning' || type === 'bonus') {
    this.balances[currencyKey] += amount;
    this.statistics.totalDeposits[currencyKey] += amount;
    if (type === 'earning') {
      this.statistics.totalEarnings[currencyKey] += amount;
    }
  } else if (type === 'withdrawal' || type === 'payment' || type === 'penalty') {
    if (this.balances[currencyKey] < amount) {
      throw new Error('Insufficient balance');
    }
    this.balances[currencyKey] -= amount;
    this.statistics.totalWithdrawals[currencyKey] += amount;
  }
  
  // Update locked balance
  if (lockAmount > 0) {
    this.lockedBalances[currencyKey] += lockAmount;
  }
  
  this.statistics.totalTransactions += 1;
  this.statistics.lastTransactionAt = new Date();
  
  return this.save();
};

walletSchema.methods.unlockBalance = function(amount, currency) {
  const currencyKey = currency.toUpperCase();
  this.lockedBalances[currencyKey] = Math.max(0, this.lockedBalances[currencyKey] - amount);
  return this.save();
};

walletSchema.methods.setTransactionPin = async function(pin) {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  this.transactionPin.hash = await bcrypt.hash(pin, salt);
  this.transactionPin.attempts = 0;
  this.transactionPin.lockedUntil = null;
  return this.save();
};

walletSchema.methods.verifyTransactionPin = async function(pin) {
  if (this.isPinLocked) {
    throw new Error('Transaction PIN is locked. Try again later.');
  }
  
  const bcrypt = require('bcryptjs');
  const isValid = await bcrypt.compare(pin, this.transactionPin.hash);
  
  if (!isValid) {
    this.transactionPin.attempts += 1;
    if (this.transactionPin.attempts >= 3) {
      this.transactionPin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
    await this.save();
    return false;
  }
  
  this.transactionPin.attempts = 0;
  this.transactionPin.lockedUntil = null;
  this.transactionPin.lastUsed = new Date();
  await this.save();
  return true;
};

walletSchema.methods.checkDailyLimit = function(amount, currency, type) {
  const currencyKey = currency.toUpperCase();
  const today = new Date().toDateString();
  const usageDate = this.dailyUsage.date.toDateString();
  
  // Reset daily usage if it's a new day
  if (today !== usageDate) {
    this.dailyUsage.date = new Date();
    this.dailyUsage.withdrawal[currencyKey] = 0;
    this.dailyUsage.transfer[currencyKey] = 0;
  }
  
  const limitType = type === 'withdrawal' ? 'withdrawal' : 'transfer';
  const currentUsage = this.dailyUsage[limitType][currencyKey];
  const limit = this.dailyLimits[limitType][currencyKey];
  
  if (currentUsage + amount > limit) {
    throw new Error(`Daily ${limitType} limit exceeded for ${currency}`);
  }
  
  return true;
};

walletSchema.methods.updateDailyUsage = function(amount, currency, type) {
  const currencyKey = currency.toUpperCase();
  const limitType = type === 'withdrawal' ? 'withdrawal' : 'transfer';
  this.dailyUsage[limitType][currencyKey] += amount;
  return this.save();
};

walletSchema.methods.suspendWallet = function(reason) {
  this.status = 'suspended';
  this.suspensionReason = reason;
  return this.save();
};

walletSchema.methods.unsuspendWallet = function() {
  this.status = 'active';
  this.suspensionReason = null;
  return this.save();
};

walletSchema.methods.freezeWallet = function(duration) {
  this.frozenUntil = new Date(Date.now() + duration);
  return this.save();
};

walletSchema.methods.unfreezeWallet = function() {
  this.frozenUntil = null;
  return this.save();
};

// Static methods
walletSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

walletSchema.statics.createWallet = function(userId) {
  return this.create({ userId });
};

walletSchema.statics.getWalletBalance = function(userId, currency = 'KES') {
  return this.findOne({ userId }).select(`balances.${currency} lockedBalances.${currency}`);
};

// Transaction static methods
transactionSchema.statics.findByUserId = function(userId, options = {}) {
  const { limit = 20, skip = 0, type, status, startDate, endDate } = options;
  
  const query = { userId };
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.initiatedAt = {};
    if (startDate) query.initiatedAt.$gte = startDate;
    if (endDate) query.initiatedAt.$lte = endDate;
  }
  
  return this.find(query)
    .sort({ initiatedAt: -1 })
    .limit(limit)
    .skip(skip);
};

transactionSchema.statics.getTransactionStats = function(userId, startDate, endDate) {
  const matchQuery = { userId };
  if (startDate || endDate) {
    matchQuery.initiatedAt = {};
    if (startDate) matchQuery.initiatedAt.$gte = startDate;
    if (endDate) matchQuery.initiatedAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

module.exports = {
  Wallet: mongoose.model('Wallet', walletSchema),
  Transaction: mongoose.model('Transaction', transactionSchema)
};