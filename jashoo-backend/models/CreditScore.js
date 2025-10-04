const mongoose = require('mongoose');

const creditScoreSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User',
    index: true
  },
  currentScore: {
    type: Number,
    default: 300,
    min: 300,
    max: 850
  },
  scoreHistory: [{
    score: Number,
    date: Date,
    factors: {
      paymentHistory: Number,
      creditUtilization: Number,
      creditHistory: Number,
      newCredit: Number,
      creditMix: Number
    },
    reason: String
  }],
  financialProfile: {
    monthlyIncome: {
      type: Number,
      default: 0
    },
    monthlyExpenses: {
      type: Number,
      default: 0
    },
    savingsRate: {
      type: Number,
      default: 0
    },
    debtToIncomeRatio: {
      type: Number,
      default: 0
    },
    employmentStability: {
      type: Number,
      default: 0
    },
    gigWorkConsistency: {
      type: Number,
      default: 0
    }
  },
  paymentPatterns: {
    onTimePayments: {
      type: Number,
      default: 0
    },
    latePayments: {
      type: Number,
      default: 0
    },
    missedPayments: {
      type: Number,
      default: 0
    },
    averagePaymentDelay: {
      type: Number,
      default: 0
    }
  },
  loanHistory: [{
    loanId: String,
    amount: Number,
    status: String,
    disbursedAt: Date,
    repaidAt: Date,
    defaultedAt: Date
  }],
  riskFactors: [{
    factor: String,
    severity: String,
    description: String,
    recommendation: String
  }],
  aiInsights: {
    spendingPatterns: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    incomePredictions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    riskAssessment: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    creditworthinessTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable'
    }
  },
  eligibilityProfile: {
    maxLoanAmount: {
      type: Number,
      default: 0
    },
    interestRate: {
      type: Number,
      default: 15
    },
    maxTermMonths: {
      type: Number,
      default: 12
    },
    eligibleLoanTypes: [{
      type: String,
      enum: ['personal', 'business', 'emergency', 'education']
    }],
    restrictions: [String]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  nextCalculation: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
creditScoreSchema.index({ userId: 1 });
creditScoreSchema.index({ currentScore: -1 });
creditScoreSchema.index({ lastUpdated: -1 });
creditScoreSchema.index({ nextCalculation: 1 });

// Virtual fields
creditScoreSchema.virtual('scoreGrade').get(function() {
  if (this.currentScore >= 750) return 'Excellent';
  if (this.currentScore >= 700) return 'Good';
  if (this.currentScore >= 650) return 'Fair';
  if (this.currentScore >= 600) return 'Poor';
  return 'Very Poor';
});

creditScoreSchema.virtual('scoreTrend').get(function() {
  if (this.scoreHistory.length < 2) return 'stable';
  
  const recent = this.scoreHistory.slice(-3);
  const trend = recent.reduce((sum, entry, index) => {
    if (index === 0) return 0;
    return sum + (entry.score - recent[index - 1].score);
  }, 0);
  
  if (trend > 10) return 'improving';
  if (trend < -10) return 'declining';
  return 'stable';
});

// Instance methods
creditScoreSchema.methods.updateScore = async function(newScore, factors, reason) {
  // Add to history
  this.scoreHistory.push({
    score: newScore,
    date: new Date(),
    factors: factors,
    reason: reason
  });
  
  // Keep only last 12 months of history
  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  this.scoreHistory = this.scoreHistory.filter(entry => entry.date > twelveMonthsAgo);
  
  this.currentScore = newScore;
  this.lastUpdated = new Date();
  this.nextCalculation = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  // Update eligibility profile
  await this.calculateEligibilityProfile();
  
  return this.save();
};

creditScoreSchema.methods.calculateEligibilityProfile = async function() {
  const score = this.currentScore;
  
  // Calculate max loan amount based on score and income
  const incomeMultiplier = Math.min(score / 100, 5); // Max 5x monthly income
  this.eligibilityProfile.maxLoanAmount = this.financialProfile.monthlyIncome * incomeMultiplier;
  
  // Calculate interest rate based on score
  if (score >= 750) {
    this.eligibilityProfile.interestRate = 8; // 8% APR
  } else if (score >= 700) {
    this.eligibilityProfile.interestRate = 12; // 12% APR
  } else if (score >= 650) {
    this.eligibilityProfile.interestRate = 15; // 15% APR
  } else if (score >= 600) {
    this.eligibilityProfile.interestRate = 20; // 20% APR
  } else {
    this.eligibilityProfile.interestRate = 25; // 25% APR
  }
  
  // Calculate max term based on score
  if (score >= 700) {
    this.eligibilityProfile.maxTermMonths = 24;
  } else if (score >= 650) {
    this.eligibilityProfile.maxTermMonths = 18;
  } else {
    this.eligibilityProfile.maxTermMonths = 12;
  }
  
  // Determine eligible loan types
  this.eligibilityProfile.eligibleLoanTypes = ['personal'];
  if (score >= 650) {
    this.eligibilityProfile.eligibleLoanTypes.push('business');
  }
  if (score >= 600) {
    this.eligibilityProfile.eligibleLoanTypes.push('emergency');
  }
  if (score >= 700) {
    this.eligibilityProfile.eligibleLoanTypes.push('education');
  }
  
  // Set restrictions
  this.eligibilityProfile.restrictions = [];
  if (score < 600) {
    this.eligibilityProfile.restrictions.push('Requires collateral');
  }
  if (score < 650) {
    this.eligibilityProfile.restrictions.push('Higher interest rate');
  }
  if (this.paymentPatterns.missedPayments > 2) {
    this.eligibilityProfile.restrictions.push('Payment history concerns');
  }
  
  return this.save();
};

creditScoreSchema.methods.getScoreTrend = function() {
  if (this.scoreHistory.length < 2) return 'stable';
  
  const recent = this.scoreHistory.slice(-6); // Last 6 months
  const trend = recent.reduce((sum, entry, index) => {
    if (index === 0) return 0;
    return sum + (entry.score - recent[index - 1].score);
  }, 0);
  
  if (trend > 20) return 'improving';
  if (trend < -20) return 'declining';
  return 'stable';
};

// AI Credit Scorer Class
class AICreditScorer {
  constructor() {
    this.model = null;
    this.isInitialized = false;
  }

  async initializeModel() {
    try {
      // In a real implementation, you would load a trained TensorFlow.js model
      // For now, we'll use a simple rule-based approach
      this.isInitialized = true;
      console.log('AI Credit Scorer initialized');
    } catch (error) {
      console.error('Failed to initialize AI model:', error);
      this.isInitialized = false;
    }
  }

  async calculateCreditScore(userData) {
    if (!this.isInitialized) {
      await this.initializeModel();
    }

    try {
      // Extract features for AI model
      const features = this.extractFeatures(userData);
      
      // Use AI model to calculate score (simplified)
      const aiScore = await this.predictScore(features);
      
      // Fallback to rule-based scoring if AI fails
      const ruleBasedScore = this.calculateRuleBasedScore(userData);
      
      return aiScore || ruleBasedScore;
    } catch (error) {
      console.error('AI scoring error:', error);
      return this.calculateRuleBasedScore(userData);
    }
  }

  extractFeatures(userData) {
    const {
      financialProfile,
      paymentPatterns,
      loanHistory,
      transactionHistory,
      jobHistory
    } = userData;

    return {
      // Financial features
      monthlyIncome: financialProfile.monthlyIncome || 0,
      monthlyExpenses: financialProfile.monthlyExpenses || 0,
      savingsRate: financialProfile.savingsRate || 0,
      debtToIncomeRatio: financialProfile.debtToIncomeRatio || 0,
      
      // Payment features
      onTimePayments: paymentPatterns.onTimePayments || 0,
      latePayments: paymentPatterns.latePayments || 0,
      missedPayments: paymentPatterns.missedPayments || 0,
      averagePaymentDelay: paymentPatterns.averagePaymentDelay || 0,
      
      // Employment features
      employmentStability: financialProfile.employmentStability || 0,
      gigWorkConsistency: financialProfile.gigWorkConsistency || 0,
      
      // Transaction features
      transactionCount: transactionHistory?.length || 0,
      averageTransactionAmount: this.calculateAverageTransactionAmount(transactionHistory),
      transactionVariability: this.calculateTransactionVariability(transactionHistory),
      
      // Job features
      jobCompletionRate: this.calculateJobCompletionRate(jobHistory),
      averageJobRating: this.calculateAverageJobRating(jobHistory)
    };
  }

  async predictScore(features) {
    // Simplified AI prediction (in reality, this would use TensorFlow.js)
    const weights = {
      monthlyIncome: 0.15,
      savingsRate: 0.20,
      onTimePayments: 0.25,
      employmentStability: 0.15,
      gigWorkConsistency: 0.10,
      transactionVariability: 0.10,
      jobCompletionRate: 0.05
    };

    let score = 300; // Base score

    // Income factor
    if (features.monthlyIncome > 0) {
      score += Math.min(features.monthlyIncome / 100, 100) * weights.monthlyIncome;
    }

    // Savings rate factor
    if (features.savingsRate > 0) {
      score += Math.min(features.savingsRate * 2, 100) * weights.savingsRate;
    }

    // Payment history factor
    const totalPayments = features.onTimePayments + features.latePayments + features.missedPayments;
    if (totalPayments > 0) {
      const onTimeRate = features.onTimePayments / totalPayments;
      score += onTimeRate * 100 * weights.onTimePayments;
    }

    // Employment stability factor
    score += Math.min(features.employmentStability, 100) * weights.employmentStability;

    // Gig work consistency factor
    score += Math.min(features.gigWorkConsistency, 100) * weights.gigWorkConsistency;

    // Transaction variability factor (lower variability = higher score)
    const variabilityScore = Math.max(0, 100 - features.transactionVariability);
    score += variabilityScore * weights.transactionVariability;

    // Job completion rate factor
    score += features.jobCompletionRate * weights.jobCompletionRate;

    return Math.min(Math.max(Math.round(score), 300), 850);
  }

  calculateRuleBasedScore(userData) {
    const {
      financialProfile,
      paymentPatterns,
      loanHistory
    } = userData;

    let score = 300; // Base score

    // Income factor (0-100 points)
    if (financialProfile.monthlyIncome > 0) {
      score += Math.min(financialProfile.monthlyIncome / 50, 100);
    }

    // Savings rate factor (0-100 points)
    if (financialProfile.savingsRate > 0) {
      score += Math.min(financialProfile.savingsRate * 2, 100);
    }

    // Payment history factor (0-200 points)
    const totalPayments = paymentPatterns.onTimePayments + paymentPatterns.latePayments + paymentPatterns.missedPayments;
    if (totalPayments > 0) {
      const onTimeRate = paymentPatterns.onTimePayments / totalPayments;
      score += onTimeRate * 200;
    }

    // Employment stability factor (0-100 points)
    score += Math.min(financialProfile.employmentStability, 100);

    // Gig work consistency factor (0-100 points)
    score += Math.min(financialProfile.gigWorkConsistency, 100);

    // Loan history factor (0-50 points)
    if (loanHistory && loanHistory.length > 0) {
      const completedLoans = loanHistory.filter(loan => loan.status === 'repaid').length;
      const totalLoans = loanHistory.length;
      const completionRate = completedLoans / totalLoans;
      score += completionRate * 50;
    }

    return Math.min(Math.max(Math.round(score), 300), 850);
  }

  calculateAverageTransactionAmount(transactions) {
    if (!transactions || transactions.length === 0) return 0;
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    return total / transactions.length;
  }

  calculateTransactionVariability(transactions) {
    if (!transactions || transactions.length < 2) return 0;
    
    const amounts = transactions.map(t => t.amount);
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    
    return Math.sqrt(variance);
  }

  calculateJobCompletionRate(jobs) {
    if (!jobs || jobs.length === 0) return 0;
    const completed = jobs.filter(job => job.status === 'completed').length;
    return (completed / jobs.length) * 100;
  }

  calculateAverageJobRating(jobs) {
    if (!jobs || jobs.length === 0) return 0;
    const ratedJobs = jobs.filter(job => job.rating && job.rating > 0);
    if (ratedJobs.length === 0) return 0;
    
    const totalRating = ratedJobs.reduce((sum, job) => sum + job.rating, 0);
    return totalRating / ratedJobs.length;
  }

  analyzeSpendingPatterns(transactions) {
    if (!transactions || transactions.length === 0) return {};

    const patterns = {
      categories: {},
      amounts: [],
      frequencies: {},
      trends: {}
    };

    transactions.forEach(transaction => {
      // Category analysis
      const category = transaction.category || 'Other';
      patterns.categories[category] = (patterns.categories[category] || 0) + transaction.amount;
      
      // Amount analysis
      patterns.amounts.push(transaction.amount);
      
      // Frequency analysis
      const dayOfWeek = new Date(transaction.date).getDay();
      patterns.frequencies[dayOfWeek] = (patterns.frequencies[dayOfWeek] || 0) + 1;
    });

    return patterns;
  }

  predictIncome(historicalData) {
    if (!historicalData || historicalData.length < 3) return null;

    // Simple trend analysis
    const recent = historicalData.slice(-3);
    const trend = recent.reduce((sum, entry, index) => {
      if (index === 0) return 0;
      return sum + (entry.amount - recent[index - 1].amount);
    }, 0);

    const lastIncome = recent[recent.length - 1].amount;
    const predictedIncome = lastIncome + (trend / recent.length);

    return Math.max(predictedIncome, 0);
  }

  assessRiskFactors(userData) {
    const risks = [];

    // Income risk
    if (userData.financialProfile.monthlyIncome < 10000) {
      risks.push({
        factor: 'Low Income',
        severity: 'medium',
        description: 'Monthly income below recommended threshold',
        recommendation: 'Consider additional income sources or skill development'
      });
    }

    // Payment risk
    if (userData.paymentPatterns.missedPayments > 2) {
      risks.push({
        factor: 'Payment History',
        severity: 'high',
        description: 'Multiple missed payments detected',
        recommendation: 'Improve payment discipline and set up payment reminders'
      });
    }

    // Employment risk
    if (userData.financialProfile.gigWorkConsistency < 50) {
      risks.push({
        factor: 'Employment Stability',
        severity: 'medium',
        description: 'Inconsistent gig work patterns',
        recommendation: 'Diversify income sources and improve job completion rates'
      });
    }

    // Savings risk
    if (userData.financialProfile.savingsRate < 10) {
      risks.push({
        factor: 'Low Savings Rate',
        severity: 'medium',
        description: 'Savings rate below recommended 10%',
        recommendation: 'Increase savings contributions gradually'
      });
    }

    return risks;
  }
}

// Static methods
creditScoreSchema.statics.findByUser = function(userId) {
  return this.findOne({ userId });
};

creditScoreSchema.statics.createProfile = function(userId) {
  return this.create({
    userId,
    currentScore: 300,
    financialProfile: {
      monthlyIncome: 0,
      monthlyExpenses: 0,
      savingsRate: 0,
      debtToIncomeRatio: 0,
      employmentStability: 0,
      gigWorkConsistency: 0
    },
    paymentPatterns: {
      onTimePayments: 0,
      latePayments: 0,
      missedPayments: 0,
      averagePaymentDelay: 0
    }
  });
};

creditScoreSchema.statics.getTopScores = function(limit = 10) {
  return this.find({})
    .sort({ currentScore: -1 })
    .limit(limit)
    .populate('userId', 'userId fullName rating isVerified');
};

module.exports = {
  CreditScore: mongoose.model('CreditScore', creditScoreSchema),
  AICreditScorer: new AICreditScorer()
};