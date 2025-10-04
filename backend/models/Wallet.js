const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdrawal', 'earning', 'convert', 'transfer', 'payment']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currencyCode: {
    type: String,
    required: true,
    enum: ['KES', 'USDT'],
    default: 'KES'
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Success', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  method: {
    type: String,
    trim: true
  },
  hustle: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    unique: true,
    sparse: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  kesBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  usdtBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  transactionPinHash: {
    type: String,
    default: null
  },
  pinAttempts: {
    type: Number,
    default: 0
  },
  pinLockedUntil: {
    type: Date,
    default: null
  },
  lastTransactionAt: {
    type: Date,
    default: null
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ status: 1 });
walletSchema.index({ userId: 1 });

// Virtual for transaction count
walletSchema.virtual('transactionCount', {
  ref: 'Transaction',
  localField: 'userId',
  foreignField: 'userId',
  count: true
});

// Methods
walletSchema.methods.updateBalance = function(amount, currency = 'KES', type = 'deposit') {
  if (currency === 'KES') {
    if (type === 'deposit' || type === 'earning') {
      this.kesBalance += amount;
    } else if (type === 'withdrawal') {
      this.kesBalance -= amount;
    }
  } else if (currency === 'USDT') {
    if (type === 'deposit' || type === 'earning') {
      this.usdtBalance += amount;
    } else if (type === 'withdrawal') {
      this.usdtBalance -= amount;
    }
  }
  
  this.lastTransactionAt = new Date();
  return this.save();
};

walletSchema.methods.setPinHash = function(pinHash) {
  this.transactionPinHash = pinHash;
  this.pinAttempts = 0;
  this.pinLockedUntil = null;
  return this.save();
};

walletSchema.methods.verifyPinHash = function(pinHash) {
  if (this.pinLockedUntil && this.pinLockedUntil > new Date()) {
    throw new Error('PIN is locked. Try again later.');
  }
  
  if (this.transactionPinHash !== pinHash) {
    this.pinAttempts += 1;
    if (this.pinAttempts >= 3) {
      this.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }
    this.save();
    return false;
  }
  
  this.pinAttempts = 0;
  this.pinLockedUntil = null;
  this.save();
  return true;
};

module.exports = {
  Wallet: mongoose.model('Wallet', walletSchema),
  Transaction: mongoose.model('Transaction', transactionSchema)
};