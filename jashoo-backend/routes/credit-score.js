const express = require('express');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const { logger } = require('../middleware/cybersecurity');
const { CreditScore, AICreditScorer } = require('../models/CreditScore');
const { Wallet, Transaction } = require('../models/Wallet');
const { SavingsGoal, LoanRequest, Contribution } = require('../models/Savings');
const User = require('../models/User');

const router = express.Router();

// Get credit score - matches Flutter expectations
router.get('/score', authenticateToken, requireVerification, async (req, res) => {
  try {
    const userId = req.user.userId;

    let creditScore = await CreditScore.findByUser(userId);

    if (!creditScore) {
      // Create initial credit score profile
      creditScore = await CreditScore.createProfile(userId);
    }

    // Check if score needs recalculation
    const needsRecalculation = creditScore.nextCalculation < new Date();
    
    if (needsRecalculation) {
      await recalculateCreditScore(userId);
      creditScore = await CreditScore.findByUser(userId);
    }

    // Return credit score data
    const scoreData = {
      currentScore: creditScore.currentScore,
      scoreGrade: creditScore.scoreGrade,
      scoreTrend: creditScore.scoreTrend,
      lastUpdated: creditScore.lastUpdated,
      nextCalculation: creditScore.nextCalculation,
      financialProfile: creditScore.financialProfile,
      paymentPatterns: creditScore.paymentPatterns,
      eligibilityProfile: creditScore.eligibilityProfile,
      riskFactors: creditScore.riskFactors,
      aiInsights: creditScore.aiInsights
    };

    res.json({
      success: true,
      data: {
        creditScore: scoreData
      }
    });
  } catch (error) {
    logger.error('Get credit score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit score',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_SCORE_ERROR'
    });
  }
});

// Get comprehensive credit analysis
router.get('/analysis', authenticateToken, requireVerification, async (req, res) => {
  try {
    const userId = req.user.userId;

    const creditScore = await CreditScore.findByUser(userId);
    if (!creditScore) {
      return res.status(404).json({
        success: false,
        message: 'Credit score not found',
        code: 'SCORE_NOT_FOUND'
      });
    }

    // Gather comprehensive data
    const userData = await gatherUserFinancialData(userId);
    const analysis = await generateComprehensiveAnalysis(creditScore, userData);

    res.json({
      success: true,
      data: {
        analysis
      }
    });
  } catch (error) {
    logger.error('Get credit analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_ANALYSIS_ERROR'
    });
  }
});

// Get credit score history
router.get('/history', authenticateToken, requireVerification, validatePagination, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const creditScore = await CreditScore.findByUser(userId);
    if (!creditScore) {
      return res.status(404).json({
        success: false,
        message: 'Credit score not found',
        code: 'SCORE_NOT_FOUND'
      });
    }

    // Get score history with pagination
    const history = creditScore.scoreHistory
      .sort((a, b) => b.date - a.date)
      .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: creditScore.scoreHistory.length
        }
      }
    });
  } catch (error) {
    logger.error('Get credit history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_HISTORY_ERROR'
    });
  }
});

// Force credit score recalculation
router.post('/recalculate', authenticateToken, requireVerification, async (req, res) => {
  try {
    const userId = req.user.userId;

    await recalculateCreditScore(userId);
    const creditScore = await CreditScore.findByUser(userId);

    res.json({
      success: true,
      message: 'Credit score recalculated successfully',
      data: {
        creditScore: {
          currentScore: creditScore.currentScore,
          scoreGrade: creditScore.scoreGrade,
          scoreTrend: creditScore.scoreTrend,
          lastUpdated: creditScore.lastUpdated,
          nextCalculation: creditScore.nextCalculation
        }
      }
    });
  } catch (error) {
    logger.error('Recalculate credit score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate credit score',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'RECALCULATE_ERROR'
    });
  }
});

// Get loan eligibility
router.get('/eligibility', authenticateToken, requireVerification, async (req, res) => {
  try {
    const { amount, termMonths } = req.query;

    if (!amount || !termMonths) {
      return res.status(400).json({
        success: false,
        message: 'Amount and term months are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const userId = req.user.userId;
    const creditScore = await CreditScore.findByUser(userId);

    if (!creditScore) {
      return res.status(404).json({
        success: false,
        message: 'Credit score not found',
        code: 'SCORE_NOT_FOUND'
      });
    }

    const eligibility = calculateLoanEligibility(creditScore, parseFloat(amount), parseInt(termMonths));

    res.json({
      success: true,
      data: {
        eligibility
      }
    });
  } catch (error) {
    logger.error('Get loan eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get loan eligibility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_ELIGIBILITY_ERROR'
    });
  }
});

// Get credit factors analysis
router.get('/factors', authenticateToken, requireVerification, async (req, res) => {
  try {
    const userId = req.user.userId;

    const creditScore = await CreditScore.findByUser(userId);
    if (!creditScore) {
      return res.status(404).json({
        success: false,
        message: 'Credit score not found',
        code: 'SCORE_NOT_FOUND'
      });
    }

    const factors = analyzeCreditFactors(creditScore);

    res.json({
      success: true,
      data: {
        factors
      }
    });
  } catch (error) {
    logger.error('Get credit factors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit factors',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_FACTORS_ERROR'
    });
  }
});

// Get peer comparison
router.get('/comparison', authenticateToken, requireVerification, async (req, res) => {
  try {
    const userId = req.user.userId;

    const creditScore = await CreditScore.findByUser(userId);
    if (!creditScore) {
      return res.status(404).json({
        success: false,
        message: 'Credit score not found',
        code: 'SCORE_NOT_FOUND'
      });
    }

    const comparison = await generateBenchmarkComparison(creditScore);

    res.json({
      success: true,
      data: {
        comparison
      }
    });
  } catch (error) {
    logger.error('Get credit comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit comparison',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_COMPARISON_ERROR'
    });
  }
});

// Helper functions
async function recalculateCreditScore(userId) {
  try {
    const userData = await gatherUserFinancialData(userId);
    const newScore = await AICreditScorer.calculateCreditScore(userData);

    const creditScore = await CreditScore.findByUser(userId);
    if (!creditScore) {
      throw new Error('Credit score profile not found');
    }

    // Calculate score factors
    const factors = {
      paymentHistory: calculatePaymentHistoryScore(userData.paymentPatterns),
      creditUtilization: calculateUtilizationScore(userData.financialProfile),
      creditHistory: calculateHistoryLengthScore(userData),
      newCredit: calculateNewCreditScore(userData),
      creditMix: calculateCreditMixScore(userData)
    };

    await creditScore.updateScore(newScore, factors, 'AI-powered recalculation');

    logger.info('Credit score recalculated', {
      userId,
      newScore,
      factors
    });

    return newScore;
  } catch (error) {
    logger.error('Credit score recalculation error:', error);
    throw error;
  }
}

async function gatherUserFinancialData(userId) {
  const user = await User.findById(userId);
  const wallet = await Wallet.findByUserId(userId);
  
  // Get transaction history
  const transactions = await Transaction.findByUserId(userId, {
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
  });

  // Get job history
  const jobs = []; // Jobs Firestore migration pending; leave empty for now

  // Get savings data
  const savingsGoals = await SavingsGoal.findByUser(userId);
  const contributions = await Contribution.findByUser(userId);

  // Get loan history
  const loans = await LoanRequest.find({ userId });

  // Calculate financial metrics
  const monthlyIncome = calculateMonthlyIncome(transactions, jobs);
  const monthlyExpenses = calculateMonthlyExpenses(transactions);
  const savingsRate = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;

  return {
    user,
    wallet,
    transactions,
    jobs,
    savingsGoals,
    contributions,
    loans,
    financialProfile: {
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      debtToIncomeRatio: calculateDebtToIncomeRatio(loans, monthlyIncome),
      employmentStability: calculateEmploymentStability(jobs),
      gigWorkConsistency: calculateGigWorkConsistency(jobs)
    },
    paymentPatterns: {
      onTimePayments: calculateOnTimePayments(transactions),
      latePayments: calculateLatePayments(transactions),
      missedPayments: calculateMissedPayments(transactions),
      averagePaymentDelay: calculateAveragePaymentDelay(transactions)
    }
  };
}

function calculateMonthlyIncome(transactions, jobs) {
  const earningTransactions = transactions.filter(t => t.type === 'earning');
  const jobEarnings = jobs.reduce((sum, job) => sum + job.priceKes, 0);
  const transactionEarnings = earningTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  return (jobEarnings + transactionEarnings) / 12; // Average monthly
}

function calculateMonthlyExpenses(transactions) {
  const expenseTransactions = transactions.filter(t => 
    ['withdrawal', 'payment', 'transfer'].includes(t.type)
  );
  
  return expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / 12; // Average monthly
}

function calculateDebtToIncomeRatio(loans, monthlyIncome) {
  if (monthlyIncome === 0) return 0;
  
  const activeDebt = loans
    .filter(loan => ['approved', 'disbursed'].includes(loan.status))
    .reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  
  return (activeDebt / monthlyIncome) * 100;
}

function calculateEmploymentStability(jobs) {
  if (jobs.length === 0) return 0;
  
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  return (completedJobs / jobs.length) * 100;
}

function calculateGigWorkConsistency(jobs) {
  if (jobs.length < 3) return 0;
  
  // Calculate consistency based on job frequency
  const jobDates = jobs.map(job => job.createdAt).sort();
  const intervals = [];
  
  for (let i = 1; i < jobDates.length; i++) {
    intervals.push(jobDates[i] - jobDates[i - 1]);
  }
  
  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
  
  // Lower variance = higher consistency
  return Math.max(0, 100 - (variance / avgInterval) * 100);
}

function calculateOnTimePayments(transactions) {
  // Simplified: count transactions without delays
  return transactions.filter(t => 
    t.status === 'completed' && !t.error
  ).length;
}

function calculateLatePayments(transactions) {
  // Simplified: count transactions with delays
  return transactions.filter(t => 
    t.status === 'completed' && t.error?.code === 'DELAYED'
  ).length;
}

function calculateMissedPayments(transactions) {
  return transactions.filter(t => t.status === 'failed').length;
}

function calculateAveragePaymentDelay(transactions) {
  const delayedTransactions = transactions.filter(t => 
    t.status === 'completed' && t.error?.code === 'DELAYED'
  );
  
  if (delayedTransactions.length === 0) return 0;
  
  const totalDelay = delayedTransactions.reduce((sum, t) => 
    sum + (t.completedAt - t.initiatedAt), 0
  );
  
  return totalDelay / delayedTransactions.length / (1000 * 60 * 60 * 24); // Days
}

function calculatePaymentHistoryScore(paymentPatterns) {
  const { onTimePayments, latePayments, missedPayments } = paymentPatterns;
  const totalPayments = onTimePayments + latePayments + missedPayments;
  
  if (totalPayments === 0) return 0;
  
  const onTimeRate = onTimePayments / totalPayments;
  return Math.round(onTimeRate * 100);
}

function calculateUtilizationScore(financialProfile) {
  const { savingsRate } = financialProfile;
  return Math.min(Math.round(savingsRate * 2), 100); // Max 100
}

function calculateHistoryLengthScore(userData) {
  const accountAge = userData.user.statistics.joinDate;
  const daysSinceJoin = Math.floor((Date.now() - accountAge) / (1000 * 60 * 60 * 24));
  
  if (daysSinceJoin >= 365) return 100;
  if (daysSinceJoin >= 180) return 75;
  if (daysSinceJoin >= 90) return 50;
  if (daysSinceJoin >= 30) return 25;
  return 0;
}

function calculateNewCreditScore(userData) {
  const recentLoans = userData.loans.filter(loan => 
    loan.createdAt > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  );
  
  return Math.max(0, 100 - recentLoans.length * 20);
}

function calculateCreditMixScore(userData) {
  const hasSavings = userData.savingsGoals.length > 0;
  const hasLoans = userData.loans.length > 0;
  const hasJobs = userData.jobs.length > 0;
  
  let score = 0;
  if (hasSavings) score += 40;
  if (hasLoans) score += 30;
  if (hasJobs) score += 30;
  
  return score;
}

async function generateComprehensiveAnalysis(creditScore, userData) {
  const analysis = {
    scoreBreakdown: {
      currentScore: creditScore.currentScore,
      scoreGrade: creditScore.scoreGrade,
      scoreTrend: creditScore.scoreTrend,
      factors: {
        paymentHistory: calculatePaymentHistoryScore(userData.paymentPatterns),
        creditUtilization: calculateUtilizationScore(userData.financialProfile),
        creditHistory: calculateHistoryLengthScore(userData),
        newCredit: calculateNewCreditScore(userData),
        creditMix: calculateCreditMixScore(userData)
      }
    },
    improvementSuggestions: generateImprovementSuggestions(creditScore, userData),
    riskAssessment: assessRiskFactors(userData),
    financialHealth: assessFinancialHealth(userData),
    predictiveInsights: generatePredictiveInsights(userData),
    benchmarkComparison: await generateBenchmarkComparison(creditScore)
  };

  return analysis;
}

function generateImprovementSuggestions(creditScore, userData) {
  const suggestions = [];

  if (creditScore.currentScore < 600) {
    suggestions.push({
      category: 'Payment History',
      suggestion: 'Focus on making all payments on time',
      impact: 'High',
      timeline: '3-6 months'
    });
  }

  if (userData.financialProfile.savingsRate < 10) {
    suggestions.push({
      category: 'Savings',
      suggestion: 'Increase your savings rate to at least 10% of income',
      impact: 'Medium',
      timeline: '6-12 months'
    });
  }

  if (userData.financialProfile.debtToIncomeRatio > 30) {
    suggestions.push({
      category: 'Debt Management',
      suggestion: 'Reduce your debt-to-income ratio below 30%',
      impact: 'High',
      timeline: '6-18 months'
    });
  }

  return suggestions;
}

function assessRiskFactors(userData) {
  return AICreditScorer.assessRiskFactors(userData);
}

function assessFinancialHealth(userData) {
  const { financialProfile } = userData;
  
  let healthScore = 0;
  let recommendations = [];

  // Income assessment
  if (financialProfile.monthlyIncome > 50000) {
    healthScore += 25;
  } else if (financialProfile.monthlyIncome > 25000) {
    healthScore += 15;
    recommendations.push('Consider increasing income through additional gigs');
  } else {
    healthScore += 5;
    recommendations.push('Focus on increasing income through skill development');
  }

  // Savings assessment
  if (financialProfile.savingsRate > 20) {
    healthScore += 25;
  } else if (financialProfile.savingsRate > 10) {
    healthScore += 15;
  } else {
    healthScore += 5;
    recommendations.push('Build emergency fund and increase savings');
  }

  // Debt assessment
  if (financialProfile.debtToIncomeRatio < 20) {
    healthScore += 25;
  } else if (financialProfile.debtToIncomeRatio < 30) {
    healthScore += 15;
  } else {
    healthScore += 5;
    recommendations.push('Reduce debt burden');
  }

  // Employment assessment
  if (financialProfile.employmentStability > 80) {
    healthScore += 25;
  } else if (financialProfile.employmentStability > 60) {
    healthScore += 15;
  } else {
    healthScore += 5;
    recommendations.push('Improve job completion rates');
  }

  return {
    score: healthScore,
    grade: healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Poor',
    recommendations
  };
}

function generatePredictiveInsights(userData) {
  const insights = [];

  // Income prediction
  const incomeTrend = calculateTrend(userData.jobs.map(job => job.priceKes));
  if (incomeTrend > 0) {
    insights.push({
      type: 'Income Growth',
      prediction: 'Your income is trending upward',
      confidence: 'High',
      timeframe: '3 months'
    });
  }

  // Savings prediction
  const savingsTrend = calculateTrend(userData.contributions.map(c => c.amount));
  if (savingsTrend > 0) {
    insights.push({
      type: 'Savings Growth',
      prediction: 'Your savings rate is improving',
      confidence: 'Medium',
      timeframe: '6 months'
    });
  }

  return insights;
}

function calculateTrend(values) {
  if (values.length < 2) return 0;
  
  const recent = values.slice(-3);
  const older = values.slice(-6, -3);
  
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
  const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
  
  return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
}

async function generateBenchmarkComparison(creditScore) {
  const topScores = await CreditScore.getTopScores(100);
  const userPercentile = calculatePercentile(creditScore.currentScore, topScores.map(cs => cs.currentScore));

  return {
    userScore: creditScore.currentScore,
    averageScore: topScores.reduce((sum, cs) => sum + cs.currentScore, 0) / topScores.length,
    percentile: userPercentile,
    comparison: userPercentile >= 75 ? 'Above Average' : userPercentile >= 50 ? 'Average' : 'Below Average'
  };
}

function calculatePercentile(userScore, allScores) {
  const sortedScores = allScores.sort((a, b) => a - b);
  const index = sortedScores.findIndex(score => score >= userScore);
  return index === -1 ? 100 : (index / sortedScores.length) * 100;
}

function calculateLoanEligibility(creditScore, amount, termMonths) {
  const eligibility = creditScore.eligibilityProfile;
  
  const isEligible = amount <= eligibility.maxLoanAmount && 
                    termMonths <= eligibility.maxTermMonths;
  
  const monthlyPayment = calculateMonthlyPayment(amount, eligibility.interestRate, termMonths);
  const approvalProbability = calculateApprovalProbability(creditScore, amount, termMonths);

  return {
    isEligible,
    maxLoanAmount: eligibility.maxLoanAmount,
    interestRate: eligibility.interestRate,
    maxTermMonths: eligibility.maxTermMonths,
    monthlyPayment,
    approvalProbability,
    restrictions: eligibility.restrictions,
    recommendations: isEligible ? [] : ['Reduce loan amount', 'Shorten loan term']
  };
}

function calculateMonthlyPayment(amount, interestRate, termMonths) {
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = termMonths;
  
  if (monthlyRate === 0) {
    return amount / numPayments;
  }
  
  return amount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
}

function calculateApprovalProbability(creditScore, amount, termMonths) {
  let probability = 50; // Base probability
  
  // Score factor
  if (creditScore.currentScore >= 750) probability += 30;
  else if (creditScore.currentScore >= 700) probability += 20;
  else if (creditScore.currentScore >= 650) probability += 10;
  else if (creditScore.currentScore < 600) probability -= 20;
  
  // Amount factor
  const amountRatio = amount / creditScore.eligibilityProfile.maxLoanAmount;
  if (amountRatio <= 0.5) probability += 10;
  else if (amountRatio > 0.8) probability -= 15;
  
  // Term factor
  if (termMonths <= 12) probability += 10;
  else if (termMonths > 24) probability -= 10;
  
  return Math.max(0, Math.min(100, probability));
}

function analyzeCreditFactors(creditScore) {
  const factors = [
    {
      name: 'Payment History',
      score: calculatePaymentHistoryScore(creditScore.paymentPatterns),
      impact: 'High',
      action: getActionForFactor('payment_history', creditScore.paymentPatterns),
      timeline: getTimelineForFactor('payment_history')
    },
    {
      name: 'Credit Utilization',
      score: calculateUtilizationScore(creditScore.financialProfile),
      impact: 'High',
      action: getActionForFactor('utilization', creditScore.financialProfile),
      timeline: getTimelineForFactor('utilization')
    },
    {
      name: 'Credit History Length',
      score: calculateHistoryLengthScore({ user: { statistics: { joinDate: creditScore.createdAt } } }),
      impact: 'Medium',
      action: getActionForFactor('history_length'),
      timeline: getTimelineForFactor('history_length')
    },
    {
      name: 'New Credit',
      score: 75, // Simplified
      impact: 'Low',
      action: getActionForFactor('new_credit'),
      timeline: getTimelineForFactor('new_credit')
    },
    {
      name: 'Credit Mix',
      score: calculateCreditMixScore({ loans: [], savingsGoals: [], jobs: [] }),
      impact: 'Low',
      action: getActionForFactor('credit_mix'),
      timeline: getTimelineForFactor('credit_mix')
    }
  ];

  return factors;
}

function getActionForFactor(factorType, data = {}) {
  const actions = {
    payment_history: 'Make all payments on time',
    utilization: 'Keep credit utilization below 30%',
    history_length: 'Maintain accounts for longer periods',
    new_credit: 'Avoid opening too many new accounts',
    credit_mix: 'Diversify credit types'
  };
  
  return actions[factorType] || 'Improve this factor';
}

function getTimelineForFactor(factorType) {
  const timelines = {
    payment_history: '3-6 months',
    utilization: '1-3 months',
    history_length: '6-12 months',
    new_credit: '6-12 months',
    credit_mix: '12-24 months'
  };
  
  return timelines[factorType] || '6-12 months';
}

function generateImprovementTimeline(factors) {
  const timeline = [];
  
  factors.forEach(factor => {
    if (factor.score < 70) {
      timeline.push({
        factor: factor.name,
        action: factor.action,
        timeline: factor.timeline,
        priority: factor.impact
      });
    }
  });
  
  return timeline.sort((a, b) => {
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

module.exports = router;