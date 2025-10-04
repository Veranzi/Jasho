const mongoose = require('mongoose');
const tf = require('@tensorflow/tfjs-node');

// Credit scoring model schema
const creditScoreSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  currentScore: {
    type: Number,
    default: 300,
    min: 300,
    max: 850
  },
  scoreHistory: [{
    score: Number,
    factors: {
      paymentHistory: Number,
      creditUtilization: Number,
      lengthOfCreditHistory: Number,
      newCredit: Number,
      creditMix: Number
    },
    calculatedAt: {
      type: Date,
      default: Date.now
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
    purpose: String,
    status: {
      type: String,
      enum: ['active', 'completed', 'defaulted', 'cancelled']
    },
    disbursedAt: Date,
    dueDate: Date,
    repaidAt: Date,
    repaymentHistory: [{
      amount: Number,
      paidAt: Date,
      onTime: Boolean,
      delayDays: Number
    }]
  }],
  riskFactors: [{
    factor: String,
    impact: Number,
    description: String,
    detectedAt: Date
  }],
  aiInsights: {
    spendingPatterns: {
      categoryBreakdown: mongoose.Schema.Types.Mixed,
      seasonalTrends: mongoose.Schema.Types.Mixed,
      irregularSpending: [String]
    },
    incomePredictions: {
      nextMonthPrediction: Number,
      confidence: Number,
      factors: [String]
    },
    riskAssessment: {
      overallRisk: String,
      riskFactors: [String],
      recommendations: [String]
    },
    creditworthinessTrend: {
      direction: String, // 'improving', 'stable', 'declining'
      rate: Number,
      projectedScore: Number
    }
  },
  eligibilityProfile: {
    maxLoanAmount: Number,
    recommendedLoanTerms: {
      maxTermMonths: Number,
      interestRateRange: {
        min: Number,
        max: Number
      }
    },
    approvedLoanTypes: [String],
    restrictions: [String]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  nextCalculation: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
}, {
  timestamps: true
});

// Indexes for performance
creditScoreSchema.index({ userId: 1 });
creditScoreSchema.index({ currentScore: -1 });
creditScoreSchema.index({ 'financialProfile.monthlyIncome': -1 });
creditScoreSchema.index({ lastUpdated: -1 });

// AI Credit Scoring Engine
class AICreditScorer {
  constructor() {
    this.model = null;
    this.initializeModel();
  }

  async initializeModel() {
    try {
      // Create a simple neural network for credit scoring
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [10], // 10 input features
            units: 64,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
          })
        ]
      });

      this.model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      console.log('AI Credit Scoring model initialized');
    } catch (error) {
      console.error('Failed to initialize AI model:', error);
    }
  }

  // Calculate credit score using AI
  async calculateCreditScore(userData) {
    try {
      const features = this.extractFeatures(userData);
      
      if (this.model) {
        const prediction = this.model.predict(tf.tensor2d([features]));
        const score = await prediction.data();
        return Math.round(score[0] * 550 + 300); // Scale to 300-850 range
      } else {
        // Fallback to rule-based scoring
        return this.calculateRuleBasedScore(userData);
      }
    } catch (error) {
      console.error('Credit score calculation error:', error);
      return this.calculateRuleBasedScore(userData);
    }
  }

  // Extract features for AI model
  extractFeatures(userData) {
    const {
      paymentHistory,
      creditUtilization,
      lengthOfCreditHistory,
      newCredit,
      creditMix,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      debtToIncomeRatio,
      employmentStability
    } = userData;

    return [
      paymentHistory / 100,
      creditUtilization / 100,
      lengthOfCreditHistory / 100,
      newCredit / 100,
      creditMix / 100,
      monthlyIncome / 100000, // Normalize income
      monthlyExpenses / 100000, // Normalize expenses
      savingsRate / 100,
      debtToIncomeRatio / 100,
      employmentStability / 100
    ];
  }

  // Rule-based credit scoring (fallback)
  calculateRuleBasedScore(userData) {
    let score = 300; // Base score

    // Payment history (35% of score)
    const paymentHistoryScore = this.calculatePaymentHistoryScore(userData.paymentPatterns);
    score += paymentHistoryScore * 0.35;

    // Credit utilization (30% of score)
    const utilizationScore = this.calculateUtilizationScore(userData.financialProfile);
    score += utilizationScore * 0.30;

    // Length of credit history (15% of score)
    const historyLengthScore = this.calculateHistoryLengthScore(userData.loanHistory);
    score += historyLengthScore * 0.15;

    // New credit (10% of score)
    const newCreditScore = this.calculateNewCreditScore(userData.loanHistory);
    score += newCreditScore * 0.10;

    // Credit mix (10% of score)
    const creditMixScore = this.calculateCreditMixScore(userData.loanHistory);
    score += creditMixScore * 0.10;

    return Math.min(Math.max(Math.round(score), 300), 850);
  }

  calculatePaymentHistoryScore(paymentPatterns) {
    const { onTimePayments, latePayments, missedPayments } = paymentPatterns;
    const totalPayments = onTimePayments + latePayments + missedPayments;
    
    if (totalPayments === 0) return 0;
    
    const onTimeRate = onTimePayments / totalPayments;
    const lateRate = latePayments / totalPayments;
    const missedRate = missedPayments / totalPayments;
    
    return (onTimeRate * 100) - (lateRate * 30) - (missedRate * 100);
  }

  calculateUtilizationScore(financialProfile) {
    const { monthlyIncome, monthlyExpenses, debtToIncomeRatio } = financialProfile;
    
    if (monthlyIncome === 0) return 0;
    
    const expenseRatio = monthlyExpenses / monthlyIncome;
    const utilizationScore = Math.max(0, 100 - (expenseRatio * 100) - (debtToIncomeRatio * 50));
    
    return utilizationScore;
  }

  calculateHistoryLengthScore(loanHistory) {
    if (loanHistory.length === 0) return 0;
    
    const oldestLoan = Math.min(...loanHistory.map(loan => 
      new Date(loan.disbursedAt).getTime()
    ));
    
    const historyMonths = (Date.now() - oldestLoan) / (1000 * 60 * 60 * 24 * 30);
    
    return Math.min(historyMonths * 2, 100); // Max 100 points
  }

  calculateNewCreditScore(loanHistory) {
    const recentLoans = loanHistory.filter(loan => {
      const loanDate = new Date(loan.disbursedAt);
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
      return loanDate > sixMonthsAgo;
    });
    
    return Math.max(0, 100 - (recentLoans.length * 20));
  }

  calculateCreditMixScore(loanHistory) {
    const loanTypes = new Set(loanHistory.map(loan => loan.purpose));
    const diversityScore = Math.min(loanTypes.size * 20, 100);
    
    return diversityScore;
  }

  // Analyze spending patterns
  analyzeSpendingPatterns(transactions) {
    const categoryBreakdown = {};
    const monthlySpending = {};
    const irregularSpending = [];

    transactions.forEach(transaction => {
      if (transaction.type === 'withdrawal' || transaction.type === 'payment') {
        const category = transaction.category || 'Other';
        const month = new Date(transaction.date).toISOString().substring(0, 7);
        
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + transaction.amount;
        monthlySpending[month] = (monthlySpending[month] || 0) + transaction.amount;
      }
    });

    // Detect irregular spending patterns
    const monthlyAmounts = Object.values(monthlySpending);
    if (monthlyAmounts.length > 3) {
      const avg = monthlyAmounts.reduce((a, b) => a + b, 0) / monthlyAmounts.length;
      const threshold = avg * 1.5;
      
      Object.entries(monthlySpending).forEach(([month, amount]) => {
        if (amount > threshold) {
          irregularSpending.push(`${month}: ${amount} KES`);
        }
      });
    }

    return {
      categoryBreakdown,
      monthlySpending,
      irregularSpending,
      averageMonthlySpending: monthlyAmounts.reduce((a, b) => a + b, 0) / monthlyAmounts.length || 0
    };
  }

  // Predict income for next month
  predictIncome(historicalData) {
    const monthlyIncomes = historicalData.map(data => data.monthlyIncome);
    
    if (monthlyIncomes.length < 3) {
      return {
        prediction: monthlyIncomes[monthlyIncomes.length - 1] || 0,
        confidence: 0.3,
        factors: ['Insufficient data']
      };
    }

    // Simple trend analysis
    const recentTrend = monthlyIncomes.slice(-3);
    const trend = (recentTrend[2] - recentTrend[0]) / 2;
    const prediction = recentTrend[2] + trend;
    
    const variance = this.calculateVariance(monthlyIncomes);
    const confidence = Math.max(0.1, 1 - (variance / 10000));

    return {
      prediction: Math.max(0, prediction),
      confidence,
      factors: ['Historical trend', 'Seasonal patterns', 'Gig work consistency']
    };
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return variance;
  }

  // Assess risk factors
  assessRiskFactors(userData) {
    const riskFactors = [];
    let overallRisk = 'low';

    // High debt-to-income ratio
    if (userData.financialProfile.debtToIncomeRatio > 0.4) {
      riskFactors.push({
        factor: 'High debt-to-income ratio',
        impact: 0.8,
        description: 'Debt payments exceed 40% of income'
      });
      overallRisk = 'high';
    }

    // Irregular income patterns
    if (userData.financialProfile.employmentStability < 0.5) {
      riskFactors.push({
        factor: 'Irregular income',
        impact: 0.6,
        description: 'Inconsistent gig work patterns'
      });
      if (overallRisk === 'low') overallRisk = 'medium';
    }

    // Low savings rate
    if (userData.financialProfile.savingsRate < 0.1) {
      riskFactors.push({
        factor: 'Low savings rate',
        impact: 0.4,
        description: 'Savings rate below 10%'
      });
      if (overallRisk === 'low') overallRisk = 'medium';
    }

    // Recent missed payments
    if (userData.paymentPatterns.missedPayments > 0) {
      riskFactors.push({
        factor: 'Recent missed payments',
        impact: 0.9,
        description: 'History of missed payments'
      });
      overallRisk = 'high';
    }

    return {
      overallRisk,
      riskFactors,
      recommendations: this.generateRecommendations(riskFactors)
    };
  }

  generateRecommendations(riskFactors) {
    const recommendations = [];

    riskFactors.forEach(risk => {
      switch (risk.factor) {
        case 'High debt-to-income ratio':
          recommendations.push('Reduce monthly expenses or increase income');
          break;
        case 'Irregular income':
          recommendations.push('Diversify income sources and maintain consistent gig work');
          break;
        case 'Low savings rate':
          recommendations.push('Increase monthly savings to at least 10% of income');
          break;
        case 'Recent missed payments':
          recommendations.push('Set up automatic payments and maintain payment calendar');
          break;
      }
    });

    return recommendations;
  }
}

// Credit score methods
creditScoreSchema.methods.updateScore = async function(userData) {
  const scorer = new AICreditScorer();
  
  // Calculate new score
  const newScore = await scorer.calculateCreditScore(userData);
  
  // Analyze patterns
  const spendingPatterns = scorer.analyzeSpendingPatterns(userData.transactions || []);
  const incomePrediction = scorer.predictIncome(userData.historicalData || []);
  const riskAssessment = scorer.assessRiskFactors(userData);
  
  // Update score history
  this.scoreHistory.push({
    score: newScore,
    factors: {
      paymentHistory: userData.paymentHistory || 0,
      creditUtilization: userData.creditUtilization || 0,
      lengthOfCreditHistory: userData.lengthOfCreditHistory || 0,
      newCredit: userData.newCredit || 0,
      creditMix: userData.creditMix || 0
    },
    reason: `AI-calculated score based on ${Object.keys(userData).length} factors`
  });
  
  // Update current score
  this.currentScore = newScore;
  
  // Update AI insights
  this.aiInsights = {
    spendingPatterns,
    incomePredictions: incomePrediction,
    riskAssessment,
    creditworthinessTrend: {
      direction: newScore > this.currentScore ? 'improving' : 'stable',
      rate: Math.abs(newScore - this.currentScore),
      projectedScore: newScore
    }
  };
  
  // Update eligibility profile
  this.eligibilityProfile = this.calculateEligibilityProfile(newScore, userData);
  
  this.lastUpdated = new Date();
  this.nextCalculation = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return this.save();
};

creditScoreSchema.methods.calculateEligibilityProfile = function(score, userData) {
  let maxLoanAmount = 0;
  let maxTermMonths = 12;
  let interestRateRange = { min: 15, max: 25 };
  let approvedLoanTypes = [];
  let restrictions = [];

  if (score >= 750) {
    maxLoanAmount = userData.financialProfile.monthlyIncome * 10;
    maxTermMonths = 60;
    interestRateRange = { min: 8, max: 12 };
    approvedLoanTypes = ['personal', 'business', 'emergency', 'education'];
  } else if (score >= 650) {
    maxLoanAmount = userData.financialProfile.monthlyIncome * 6;
    maxTermMonths = 36;
    interestRateRange = { min: 12, max: 18 };
    approvedLoanTypes = ['personal', 'emergency', 'education'];
  } else if (score >= 550) {
    maxLoanAmount = userData.financialProfile.monthlyIncome * 3;
    maxTermMonths = 24;
    interestRateRange = { min: 15, max: 22 };
    approvedLoanTypes = ['personal', 'emergency'];
    restrictions.push('Requires co-signer for amounts above 50,000 KES');
  } else {
    maxLoanAmount = userData.financialProfile.monthlyIncome * 1.5;
    maxTermMonths = 12;
    interestRateRange = { min: 20, max: 30 };
    approvedLoanTypes = ['emergency'];
    restrictions.push('Requires collateral or co-signer');
    restrictions.push('Maximum loan term limited to 12 months');
  }

  return {
    maxLoanAmount,
    recommendedLoanTerms: {
      maxTermMonths,
      interestRateRange
    },
    approvedLoanTypes,
    restrictions
  };
};

creditScoreSchema.methods.getScoreTrend = function() {
  if (this.scoreHistory.length < 2) {
    return { direction: 'stable', change: 0 };
  }

  const recent = this.scoreHistory.slice(-3);
  const trend = recent[recent.length - 1].score - recent[0].score;
  
  return {
    direction: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
    change: Math.abs(trend),
    period: '3 months'
  };
};

module.exports = {
  CreditScore: mongoose.model('CreditScore', creditScoreSchema),
  AICreditScorer
};