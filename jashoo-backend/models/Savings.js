const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'SavingsGoal',
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  source: {
    type: String,
    enum: ['manual', 'auto', 'earning', 'bonus'],
    default: 'manual'
  },
  hustle: {
    type: String,
    trim: true,
    maxlength: 50
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const savingsGoalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  target: {
    type: Number,
    required: true,
    min: 100
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
    maxlength: 50
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
    type: Boolean,
    default: false
  },
  autoSaveAmount: {
    type: Number,
    default: 0
  },
  autoSaveFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'monthly'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const loanRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1000,
    max: 1000000
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'repaid', 'defaulted'],
    default: 'pending',
    index: true
  },
  interestRate: {
    type: Number,
    default: 15 // 15% APR
  },
  termMonths: {
    type: Number,
    default: 12,
    min: 1,
    max: 60
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
    trim: true,
    maxlength: 200
  },
  guarantor: {
    name: String,
    phone: String,
    relationship: String
  },
  documents: [{
    type: String,
    name: String,
    url: String
  }],
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
savingsGoalSchema.index({ userId: 1, createdAt: -1 });
savingsGoalSchema.index({ userId: 1, isActive: 1 });
savingsGoalSchema.index({ category: 1 });

loanRequestSchema.index({ userId: 1, createdAt: -1 });
loanRequestSchema.index({ userId: 1, status: 1 });
loanRequestSchema.index({ status: 1 });

contributionSchema.index({ userId: 1, createdAt: -1 });
contributionSchema.index({ goalId: 1, createdAt: -1 });

// Virtual fields
savingsGoalSchema.virtual('progressPercentage').get(function() {
  return this.target > 0 ? Math.round((this.saved / this.target) * 100) : 0;
});

savingsGoalSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const diffTime = this.dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

savingsGoalSchema.virtual('isCompleted').get(function() {
  return this.saved >= this.target;
});

savingsGoalSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && !this.isCompleted;
});

loanRequestSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'repaid';
});

loanRequestSchema.virtual('remainingAmount').get(function() {
  if (this.status !== 'disbursed') return 0;
  const totalAmount = this.amount + (this.amount * this.interestRate / 100);
  const monthsPaid = this.monthlyPayment > 0 ? 
    Math.floor((Date.now() - this.disbursedAt) / (1000 * 60 * 60 * 24 * 30)) : 0;
  return Math.max(0, totalAmount - (this.monthlyPayment * monthsPaid));
});

// Instance methods
savingsGoalSchema.methods.addContribution = function(amount) {
  this.saved += amount;
  
  // Check if goal is completed
  if (this.saved >= this.target && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  return this.save();
};

savingsGoalSchema.methods.isOverdue = function() {
  return this.dueDate && this.dueDate < new Date() && this.saved < this.target;
};

loanRequestSchema.methods.calculateMonthlyPayment = function() {
  const principal = this.amount;
  const monthlyRate = this.interestRate / 100 / 12;
  const numPayments = this.termMonths;
  
  if (monthlyRate === 0) {
    return principal / numPayments;
  }
  
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  this.monthlyPayment = Math.round(monthlyPayment);
  return this.monthlyPayment;
};

loanRequestSchema.methods.isOverdue = function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'repaid';
};

// Pre-save middleware
loanRequestSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('interestRate') || this.isModified('termMonths')) {
    this.calculateMonthlyPayment();
  }
  
  if (this.isModified('termMonths') && this.status === 'pending') {
    const disbursedDate = this.disbursedAt || new Date();
    this.dueDate = new Date(disbursedDate.getTime() + this.termMonths * 30 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Static methods
savingsGoalSchema.statics.findByUser = function(userId, options = {}) {
  const { active = true, category } = options;
  
  const query = { userId };
  if (active) query.isActive = true;
  if (category) query.category = category;
  
  return this.find(query).sort({ createdAt: -1 });
};

loanRequestSchema.statics.findByUser = function(userId, options = {}) {
  const { status } = options;
  
  const query = { userId };
  if (status) query.status = status;
  
  return this.find(query).sort({ createdAt: -1 });
};

contributionSchema.statics.findByUser = function(userId, options = {}) {
  const { goalId, startDate, endDate } = options;
  
  const query = { userId };
  if (goalId) query.goalId = goalId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

module.exports = {
  SavingsGoal: mongoose.model('SavingsGoal', savingsGoalSchema),
  LoanRequest: mongoose.model('LoanRequest', loanRequestSchema),
  Contribution: mongoose.model('Contribution', contributionSchema)
};