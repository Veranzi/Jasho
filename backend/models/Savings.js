const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  target: {
    type: Number,
    required: true,
    min: 0
  },
  saved: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    default: null
  },
  hustle: {
    type: String,
    trim: true,
    default: null
  },
  category: {
    type: String,
    enum: ['Emergency', 'Education', 'Business', 'Personal', 'Other'],
    default: 'Personal'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  autoSave: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      default: 0
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const loanRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Disbursed', 'Repaid'],
    default: 'Pending'
  },
  interestRate: {
    type: Number,
    default: 0
  },
  termMonths: {
    type: Number,
    default: 12
  },
  monthlyPayment: {
    type: Number,
    default: 0
  },
  disbursedAt: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },
  repaidAt: {
    type: Date,
    default: null
  },
  creditScore: {
    type: Number,
    default: null
  },
  collateral: {
    type: String,
    default: null
  },
  guarantor: {
    name: String,
    phone: String,
    relationship: String
  },
  documents: [{
    type: String, // URLs to uploaded documents
    default: []
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const contributionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'SavingsGoal'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    enum: ['manual', 'auto', 'earning', 'bonus'],
    default: 'manual'
  },
  hustle: {
    type: String,
    trim: true,
    default: null
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
savingsGoalSchema.index({ userId: 1, createdAt: -1 });
savingsGoalSchema.index({ isActive: 1 });
savingsGoalSchema.index({ dueDate: 1 });

loanRequestSchema.index({ userId: 1, createdAt: -1 });
loanRequestSchema.index({ status: 1 });
loanRequestSchema.index({ dueDate: 1 });

contributionSchema.index({ userId: 1, createdAt: -1 });
contributionSchema.index({ goalId: 1, createdAt: -1 });

// Virtual for progress percentage
savingsGoalSchema.virtual('progressPercentage').get(function() {
  return this.target > 0 ? Math.round((this.saved / this.target) * 100) : 0;
});

// Virtual for days remaining
savingsGoalSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const diffTime = this.dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Methods
savingsGoalSchema.methods.addContribution = function(amount, source = 'manual', hustle = null) {
  this.saved += amount;
  
  // Calculate points earned (1 KES = 1 point)
  const pointsEarned = Math.floor(amount);
  
  // Check if goal is completed
  if (this.saved >= this.target && !this.completedAt) {
    this.completedAt = new Date();
    this.isActive = false;
  }
  
  return this.save().then(() => ({ pointsEarned }));
};

savingsGoalSchema.methods.isOverdue = function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.saved < this.target;
};

loanRequestSchema.methods.calculateMonthlyPayment = function() {
  if (this.interestRate === 0) {
    this.monthlyPayment = this.amount / this.termMonths;
  } else {
    const monthlyRate = this.interestRate / 100 / 12;
    this.monthlyPayment = this.amount * (monthlyRate * Math.pow(1 + monthlyRate, this.termMonths)) / 
                         (Math.pow(1 + monthlyRate, this.termMonths) - 1);
  }
  return this.save();
};

loanRequestSchema.methods.isOverdue = function() {
  if (!this.dueDate || this.status === 'Repaid') return false;
  return new Date() > this.dueDate;
};

module.exports = {
  SavingsGoal: mongoose.model('SavingsGoal', savingsGoalSchema),
  LoanRequest: mongoose.model('LoanRequest', loanRequestSchema),
  Contribution: mongoose.model('Contribution', contributionSchema)
};