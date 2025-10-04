const express = require('express');
const { CreditScore, AICreditScorer } = require('../models/CreditScore');
const { Transaction } = require('../models/Wallet');
const { LoanRequest } = require('../models/Savings');
const { Job } = require('../models/Job');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get user's credit score
router.get('/score', authenticateToken, async (req, res) => {
  try {
    let creditScore = await CreditScore.findOne({ userId: req.user.userId });

    if (!creditScore) {
      // Initialize credit score for new user
      creditScore = new CreditScore({
        userId: req.user.userId,
        currentScore: 300 // Starting score
      });
      await creditScore.save();
    }

    // Check if score needs recalculation
    const now = new Date();
    if (now > creditScore.nextCalculation) {
      await recalculateCreditScore(req.user.userId);
      creditScore = await CreditScore.findOne({ userId: req.user.userId });
    }

    res.json({
      success: true,
      data: {
        creditScore: creditScore.currentScore,
        scoreHistory: creditScore.scoreHistory.slice(-12), // Last 12 calculations
        financialProfile: creditScore.financialProfile,
        paymentPatterns: creditScore.paymentPatterns,
        aiInsights: creditScore.aiInsights,
        eligibilityProfile: creditScore.eligibilityProfile,
        riskFactors: creditScore.riskFactors,
        lastUpdated: creditScore.lastUpdated,
        nextCalculation: creditScore.nextCalculation,
        scoreTrend: creditScore.getScoreTrend()
      }
    });
  } catch (error) {
    console.error('Get credit score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit score',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get detailed credit analysis
router.get('/analysis', authenticateToken, async (req, res) => {
  try {
    const creditScore = await CreditScore.findOne({ userId: req.user.userId });

    if (!creditScore) {
      return res.status(404).json({
        success: false,
        message: 'Credit score not found'
      });
    }

    // Get comprehensive analysis
    const analysis = await generateComprehensiveAnalysis(req.user.userId);

    res.json({
      success: true,
      data: {
        currentScore: creditScore.currentScore,
        scoreBreakdown: analysis.scoreBreakdown,
        improvementSuggestions: analysis.improvementSuggestions,
        riskAssessment: analysis.riskAssessment,
        financialHealth: analysis.financialHealth,
        predictiveInsights: analysis.predictiveInsights,
        benchmarkComparison: analysis.benchmarkComparison
      }
    });
  } catch (error) {
    console.error('Credit analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate credit analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get credit score history
router.get('/history', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const creditScore = await CreditScore.findOne({ userId: req.user.userId });

    if (!creditScore) {
      return res.status(404).json({
        success: false,
        message: 'Credit score not found'
      });
    }

    const scoreHistory = creditScore.scoreHistory
      .sort((a, b) => b.calculatedAt - a.calculatedAt)
      .slice(skip, skip + limit);

    const total = creditScore.scoreHistory.length;

    res.json({
      success: true,
      data: {
        scoreHistory,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get score history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get score history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Force credit score recalculation
router.post('/recalculate', authenticateToken, requireVerification, async (req, res) => {
  try {
    await recalculateCreditScore(req.user.userId);
    
    const creditScore = await CreditScore.findOne({ userId: req.user.userId });

    res.json({
      success: true,
      message: 'Credit score recalculated successfully',
      data: {
        newScore: creditScore.currentScore,
        previousScore: creditScore.scoreHistory[creditScore.scoreHistory.length - 2]?.score || 300,
        change: creditScore.currentScore - (creditScore.scoreHistory[creditScore.scoreHistory.length - 2]?.score || 300),
        recalculatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Recalculate credit score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate credit score',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get loan eligibility
router.get('/eligibility', authenticateToken, async (req, res) => {
  try {
    const { amount, termMonths, purpose } = req.query;

    const creditScore = await CreditScore.findOne({ userId: req.user.userId });

    if (!creditScore) {
      return res.status(404).json({
        success: false,
        message: 'Credit score not found'
      });
    }

    const eligibility = calculateLoanEligibility(
      creditScore,
      parseFloat(amount) || 0,
      parseInt(termMonths) || 12,
      purpose || 'general'
    );

    res.json({
      success: true,
      data: {
        eligible: eligibility.eligible,
        maxAmount: eligibility.maxAmount,
        recommendedTerm: eligibility.recommendedTerm,
        interestRate: eligibility.interestRate,
        monthlyPayment: eligibility.monthlyPayment,
        approvalProbability: eligibility.approvalProbability,
        conditions: eligibility.conditions,
        alternatives: eligibility.alternatives
      }
    });
  } catch (error) {
    console.error('Loan eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate loan eligibility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get credit score factors
router.get('/factors', authenticateToken, async (req, res) => {
  try {
    const creditScore = await CreditScore.findOne({ userId: req.user.userId });

    if (!creditScore) {
      return res.status(404).json({
        success: false,
        message: 'Credit score not found'
      });
    }

    const factors = analyzeCreditFactors(req.user.userId, creditScore);

    res.json({
      success: true,
      data: {
        factors: factors.factors,
        impactAnalysis: factors.impactAnalysis,
        recommendations: factors.recommendations,
        timeline: factors.timeline
      }
    });
  } catch (error) {
    console.error('Credit factors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze credit factors',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get peer comparison
router.get('/comparison', authenticateToken, async (req, res) => {
  try {
    const creditScore = await CreditScore.findOne({ userId: req.user.userId });

    if (!creditScore) {
      return res.status(404).json({
        success: false,
        message: 'Credit score not found'
      });
    }

    const comparison = await generatePeerComparison(req.user.userId, creditScore);

    res.json({
      success: true,
      data: {
        userScore: creditScore.currentScore,
        peerComparison: comparison.peerComparison,
        percentile: comparison.percentile,
        benchmarks: comparison.benchmarks,
        insights: comparison.insights
      }
    });
  } catch (error) {
    console.error('Peer comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate peer comparison',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper functions
async function recalculateCreditScore(userId) {
  try {
    // Get user's financial data
    const userData = await gatherUserFinancialData(userId);
    
    // Initialize AI scorer
    const scorer = new AICreditScorer();
    
    // Calculate new score
    const newScore = await scorer.calculateCreditScore(userData);
    
    // Update credit score record
    const creditScore = await CreditScore.findOne({ userId });
    if (creditScore) {
      await creditScore.updateScore(userData);
    } else {
      const newCreditScore = new CreditScore({
        userId,
        currentScore: newScore
      });
      await newCreditScore.updateScore(userData);
    }
  } catch (error) {
    console.error('Recalculate credit score error:', error);
    throw error;
  }
}

async function gatherUserFinancialData(userId) {
  // Get transaction history
  const transactions = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100);

  // Get loan history
  const loans = await LoanRequest.find({ userId });

  // Get job history
  const jobs = await Job.find({ assignedTo: userId });

  // Calculate financial metrics
  const monthlyIncome = transactions
    .filter(t => t.type === 'earning')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'withdrawal' || t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;

  // Calculate payment patterns
  const onTimePayments = loans.filter(loan => 
    loan.status === 'completed' && loan.repaidAt <= loan.dueDate
  ).length;

  const latePayments = loans.filter(loan => 
    loan.status === 'completed' && loan.repaidAt > loan.dueDate
  ).length;

  const missedPayments = loans.filter(loan => 
    loan.status === 'defaulted'
  ).length;

  return {
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    paymentPatterns: {
      onTimePayments,
      latePayments,
      missedPayments
    },
    loanHistory: loans,
    transactions,
    jobs,
    historicalData: await getHistoricalData(userId)
  };
}

async function getHistoricalData(userId) {
  // Get historical financial data for trend analysis
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
  
  const historicalTransactions = await Transaction.find({
    userId,
    createdAt: { $gte: sixMonthsAgo }
  }).sort({ createdAt: 1 });

  // Group by month
  const monthlyData = {};
  historicalTransactions.forEach(transaction => {
    const month = transaction.createdAt.toISOString().substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expenses: 0 };
    }
    
    if (transaction.type === 'earning') {
      monthlyData[month].income += transaction.amount;
    } else if (transaction.type === 'withdrawal' || transaction.type === 'payment') {
      monthlyData[month].expenses += transaction.amount;
    }
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    monthlyIncome: data.income,
    monthlyExpenses: data.expenses
  }));
}

async function generateComprehensiveAnalysis(userId) {
  const creditScore = await CreditScore.findOne({ userId });
  const userData = await gatherUserFinancialData(userId);

  return {
    scoreBreakdown: {
      paymentHistory: calculatePaymentHistoryScore(userData.paymentPatterns),
      creditUtilization: calculateUtilizationScore(userData),
      lengthOfCreditHistory: calculateHistoryLengthScore(userData.loanHistory),
      newCredit: calculateNewCreditScore(userData.loanHistory),
      creditMix: calculateCreditMixScore(userData.loanHistory)
    },
    improvementSuggestions: generateImprovementSuggestions(creditScore, userData),
    riskAssessment: assessRiskFactors(userData),
    financialHealth: assessFinancialHealth(userData),
    predictiveInsights: generatePredictiveInsights(userData),
    benchmarkComparison: await generateBenchmarkComparison(userId)
  };
}

function calculatePaymentHistoryScore(paymentPatterns) {
  const { onTimePayments, latePayments, missedPayments } = paymentPatterns;
  const totalPayments = onTimePayments + latePayments + missedPayments;
  
  if (totalPayments === 0) return 0;
  
  const onTimeRate = onTimePayments / totalPayments;
  const lateRate = latePayments / totalPayments;
  const missedRate = missedPayments / totalPayments;
  
  return Math.round((onTimeRate * 100) - (lateRate * 30) - (missedRate * 100));
}

function calculateUtilizationScore(userData) {
  const { monthlyIncome, monthlyExpenses } = userData;
  
  if (monthlyIncome === 0) return 0;
  
  const expenseRatio = monthlyExpenses / monthlyIncome;
  return Math.round(Math.max(0, 100 - (expenseRatio * 100)));
}

function calculateHistoryLengthScore(loanHistory) {
  if (loanHistory.length === 0) return 0;
  
  const oldestLoan = Math.min(...loanHistory.map(loan => 
    new Date(loan.createdAt).getTime()
  ));
  
  const historyMonths = (Date.now() - oldestLoan) / (1000 * 60 * 60 * 24 * 30);
  
  return Math.round(Math.min(historyMonths * 2, 100));
}

function calculateNewCreditScore(loanHistory) {
  const recentLoans = loanHistory.filter(loan => {
    const loanDate = new Date(loan.createdAt);
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    return loanDate > sixMonthsAgo;
  });
  
  return Math.round(Math.max(0, 100 - (recentLoans.length * 20)));
}

function calculateCreditMixScore(loanHistory) {
  const loanTypes = new Set(loanHistory.map(loan => loan.purpose));
  return Math.round(Math.min(loanTypes.size * 20, 100));
}

function generateImprovementSuggestions(creditScore, userData) {
  const suggestions = [];

  if (creditScore.currentScore < 600) {
    suggestions.push({
      category: 'Payment History',
      suggestion: 'Focus on making all payments on time',
      impact: 'High',
      timeline: '3-6 months',
      priority: 'Critical'
    });
  }

  if (userData.savingsRate < 0.1) {
    suggestions.push({
      category: 'Financial Stability',
      suggestion: 'Increase savings rate to at least 10% of income',
      impact: 'High',
      timeline: '6-12 months',
      priority: 'High'
    });
  }

  if (userData.loanHistory.length < 2) {
    suggestions.push({
      category: 'Credit History',
      suggestion: 'Consider taking small loans to build credit history',
      impact: 'Medium',
      timeline: '12-24 months',
      priority: 'Medium'
    });
  }

  return suggestions;
}

function assessRiskFactors(userData) {
  const risks = [];

  if (userData.paymentPatterns.missedPayments > 0) {
    risks.push({
      factor: 'Missed Payments',
      severity: 'High',
      description: 'History of missed payments',
      mitigation: 'Set up automatic payments'
    });
  }

  if (userData.savingsRate < 0.05) {
    risks.push({
      factor: 'Low Savings',
      severity: 'Medium',
      description: 'Savings rate below 5%',
      mitigation: 'Increase monthly savings'
    });
  }

  return {
    overallRisk: risks.length > 0 ? 'Medium' : 'Low',
    riskFactors: risks,
    riskScore: risks.reduce((sum, risk) => sum + (risk.severity === 'High' ? 3 : 1), 0)
  };
}

function assessFinancialHealth(userData) {
  const { monthlyIncome, monthlyExpenses, savingsRate } = userData;
  
  let healthScore = 0;
  const factors = [];

  // Income stability
  if (monthlyIncome > 0) {
    healthScore += 25;
    factors.push('Has regular income');
  }

  // Expense management
  if (monthlyExpenses < monthlyIncome * 0.8) {
    healthScore += 25;
    factors.push('Manages expenses well');
  }

  // Savings
  if (savingsRate > 0.1) {
    healthScore += 25;
    factors.push('Good savings rate');
  } else if (savingsRate > 0.05) {
    healthScore += 15;
    factors.push('Moderate savings rate');
  }

  // Payment history
  if (userData.paymentPatterns.onTimePayments > userData.paymentPatterns.latePayments) {
    healthScore += 25;
    factors.push('Good payment history');
  }

  return {
    healthScore,
    healthLevel: healthScore >= 75 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs Improvement',
    factors,
    recommendations: generateHealthRecommendations(healthScore, userData)
  };
}

function generateHealthRecommendations(healthScore, userData) {
  const recommendations = [];

  if (healthScore < 50) {
    recommendations.push('Focus on building emergency fund');
    recommendations.push('Reduce unnecessary expenses');
    recommendations.push('Increase income through additional gig work');
  } else if (healthScore < 75) {
    recommendations.push('Maintain current financial habits');
    recommendations.push('Consider investment opportunities');
  } else {
    recommendations.push('Excellent financial health - consider advanced investment strategies');
  }

  return recommendations;
}

function generatePredictiveInsights(userData) {
  const insights = [];

  // Income prediction
  const incomeTrend = calculateTrend(userData.historicalData.map(d => d.monthlyIncome));
  if (incomeTrend > 0.1) {
    insights.push({
      type: 'Income Growth',
      prediction: 'Income is trending upward',
      confidence: 0.8,
      timeframe: '3 months'
    });
  }

  // Expense prediction
  const expenseTrend = calculateTrend(userData.historicalData.map(d => d.monthlyExpenses));
  if (expenseTrend > 0.15) {
    insights.push({
      type: 'Expense Alert',
      prediction: 'Expenses are increasing rapidly',
      confidence: 0.9,
      timeframe: '1 month'
    });
  }

  return insights;
}

function calculateTrend(values) {
  if (values.length < 2) return 0;
  
  const first = values[0];
  const last = values[values.length - 1];
  
  return (last - first) / first;
}

async function generateBenchmarkComparison(userId) {
  // Get peer averages
  const peerAverages = await CreditScore.aggregate([
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$currentScore' },
        avgIncome: { $avg: '$financialProfile.monthlyIncome' },
        avgSavingsRate: { $avg: '$financialProfile.savingsRate' }
      }
    }
  ]);

  const userScore = await CreditScore.findOne({ userId });

  return {
    userScore: userScore?.currentScore || 300,
    peerAverage: peerAverages[0]?.avgScore || 500,
    percentile: calculatePercentile(userScore?.currentScore || 300),
    benchmarks: {
      income: {
        user: userScore?.financialProfile.monthlyIncome || 0,
        peer: peerAverages[0]?.avgIncome || 0
      },
      savings: {
        user: userScore?.financialProfile.savingsRate || 0,
        peer: peerAverages[0]?.avgSavingsRate || 0
      }
    }
  };
}

function calculatePercentile(score) {
  // Simplified percentile calculation
  if (score >= 750) return 95;
  if (score >= 700) return 85;
  if (score >= 650) return 70;
  if (score >= 600) return 50;
  if (score >= 550) return 30;
  if (score >= 500) return 15;
  return 5;
}

function calculateLoanEligibility(creditScore, amount, termMonths, purpose) {
  const score = creditScore.currentScore;
  const maxAmount = creditScore.eligibilityProfile.maxLoanAmount;
  const maxTerm = creditScore.eligibilityProfile.recommendedLoanTerms.maxTermMonths;
  const interestRateRange = creditScore.eligibilityProfile.recommendedLoanTerms.interestRateRange;

  const eligible = score >= 550 && amount <= maxAmount && termMonths <= maxTerm;
  const interestRate = eligible ? 
    Math.max(interestRateRange.min, interestRateRange.max - (score - 550) * 0.1) : 
    interestRateRange.max;

  const monthlyPayment = eligible ? 
    calculateMonthlyPayment(amount, interestRate, termMonths) : 0;

  const approvalProbability = calculateApprovalProbability(score, amount, maxAmount);

  return {
    eligible,
    maxAmount,
    recommendedTerm: maxTerm,
    interestRate: Math.round(interestRate * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment),
    approvalProbability,
    conditions: eligible ? [] : ['Improve credit score', 'Reduce loan amount', 'Shorten loan term'],
    alternatives: !eligible ? ['Emergency fund', 'Smaller loan amount', 'Co-signer'] : []
  };
}

function calculateMonthlyPayment(amount, annualRate, termMonths) {
  const monthlyRate = annualRate / 100 / 12;
  return amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
         (Math.pow(1 + monthlyRate, termMonths) - 1);
}

function calculateApprovalProbability(score, amount, maxAmount) {
  const scoreFactor = Math.min(score / 850, 1);
  const amountFactor = Math.max(0, 1 - (amount / maxAmount));
  
  return Math.round((scoreFactor * 0.7 + amountFactor * 0.3) * 100);
}

function analyzeCreditFactors(userId, creditScore) {
  const factors = [
    {
      name: 'Payment History',
      score: calculatePaymentHistoryScore(creditScore.paymentPatterns),
      weight: 35,
      description: 'Your track record of paying bills on time'
    },
    {
      name: 'Credit Utilization',
      score: calculateUtilizationScore(creditScore.financialProfile),
      weight: 30,
      description: 'How much of your available credit you use'
    },
    {
      name: 'Length of Credit History',
      score: calculateHistoryLengthScore(creditScore.loanHistory),
      weight: 15,
      description: 'How long you have been using credit'
    },
    {
      name: 'New Credit',
      score: calculateNewCreditScore(creditScore.loanHistory),
      weight: 10,
      description: 'Recent credit applications and new accounts'
    },
    {
      name: 'Credit Mix',
      score: calculateCreditMixScore(creditScore.loanHistory),
      weight: 10,
      description: 'Variety of credit types you use'
    }
  ];

  const impactAnalysis = factors.map(factor => ({
    ...factor,
    impact: factor.score < 50 ? 'Negative' : factor.score < 70 ? 'Neutral' : 'Positive',
    improvement: factor.score < 70 ? `Focus on improving ${factor.name.toLowerCase()}` : 'Maintain current practices'
  }));

  const recommendations = factors
    .filter(f => f.score < 70)
    .map(f => ({
      factor: f.name,
      currentScore: f.score,
      targetScore: 80,
      action: getActionForFactor(f.name),
      timeline: getTimelineForFactor(f.name)
    }));

  const timeline = generateImprovementTimeline(factors);

  return {
    factors,
    impactAnalysis,
    recommendations,
    timeline
  };
}

function getActionForFactor(factorName) {
  const actions = {
    'Payment History': 'Set up automatic payments and payment reminders',
    'Credit Utilization': 'Reduce expenses and increase income',
    'Length of Credit History': 'Continue using credit responsibly over time',
    'New Credit': 'Avoid applying for new credit frequently',
    'Credit Mix': 'Consider different types of credit products'
  };
  
  return actions[factorName] || 'Continue responsible credit practices';
}

function getTimelineForFactor(factorName) {
  const timelines = {
    'Payment History': '3-6 months',
    'Credit Utilization': '1-3 months',
    'Length of Credit History': '12-24 months',
    'New Credit': '6-12 months',
    'Credit Mix': '6-18 months'
  };
  
  return timelines[factorName] || '6-12 months';
}

function generateImprovementTimeline(factors) {
  const timeline = [];
  const currentDate = new Date();

  factors.forEach(factor => {
    if (factor.score < 70) {
      timeline.push({
        month: 1,
        factor: factor.name,
        action: getActionForFactor(factor.name),
        expectedImprovement: Math.min(20, 70 - factor.score)
      });
    }
  });

  return timeline;
}

async function generatePeerComparison(userId, creditScore) {
  // Get users with similar profiles
  const similarUsers = await CreditScore.find({
    userId: { $ne: userId },
    'financialProfile.monthlyIncome': {
      $gte: creditScore.financialProfile.monthlyIncome * 0.8,
      $lte: creditScore.financialProfile.monthlyIncome * 1.2
    }
  }).limit(100);

  const peerScores = similarUsers.map(user => user.currentScore);
  const userScore = creditScore.currentScore;

  const percentile = peerScores.filter(score => score < userScore).length / peerScores.length * 100;

  const benchmarks = {
    average: peerScores.reduce((sum, score) => sum + score, 0) / peerScores.length,
    median: peerScores.sort((a, b) => a - b)[Math.floor(peerScores.length / 2)],
    top25: peerScores.sort((a, b) => b - a)[Math.floor(peerScores.length * 0.25)],
    bottom25: peerScores.sort((a, b) => a - b)[Math.floor(peerScores.length * 0.25)]
  };

  const insights = [];
  if (userScore > benchmarks.average) {
    insights.push('Your score is above average for similar users');
  } else {
    insights.push('Your score is below average for similar users');
  }

  if (userScore >= benchmarks.top25) {
    insights.push('You are in the top 25% of similar users');
  }

  return {
    peerComparison: {
      userScore,
      peerAverage: benchmarks.average,
      peerMedian: benchmarks.median
    },
    percentile: Math.round(percentile),
    benchmarks,
    insights
  };
}

module.exports = router;