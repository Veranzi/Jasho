const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const { logger } = require('../middleware/cybersecurity');
const User = require('../models/User');
const { Wallet, Transaction } = require('../models/Wallet');
const { Job } = require('../models/Job');
const { SavingsGoal, Contribution } = require('../models/Savings');
const { Gamification } = require('../models/Gamification');

const router = express.Router();

// Get AI suggestions - matches Flutter AiProvider.suggestions
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user data for analysis
    const user = await User.findById(userId);
    const wallet = await Wallet.findByUserId(userId);
    const gamification = await Gamification.findOne({ userId });
    
    // Get recent transactions
    const recentTransactions = await Transaction.findByUserId(userId, {
      limit: 10,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    });

    // Get recent jobs
    const recentJobs = await Job.findByUser(userId, 'assigned', {
      limit: 5,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    });

    // Get savings goals
    const savingsGoals = await SavingsGoal.find({ userId, isActive: true });

    // Analyze data and generate suggestions
    const suggestions = await generateAISuggestions({
      user,
      wallet,
      gamification,
      recentTransactions,
      recentJobs,
      savingsGoals
    });

    // Convert to Flutter AiSuggestion format
    const formattedSuggestions = suggestions.map(suggestion => ({
      messageEn: suggestion.messageEn,
      messageSw: suggestion.messageSw,
      // Additional fields for Flutter
      category: suggestion.category,
      priority: suggestion.priority,
      actionable: suggestion.actionable,
      createdAt: new Date()
    }));

    res.json({
      success: true,
      data: {
        suggestions: formattedSuggestions,
        languageCode: user.preferences.language || 'en'
      }
    });
  } catch (error) {
    logger.error('Get AI suggestions error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get AI suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_SUGGESTIONS_ERROR'
    });
  }
});

// Get AI insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = '30' } = req.query; // days

    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Get financial data
    const transactions = await Transaction.findByUserId(userId, {
      startDate,
      endDate: new Date()
    });

    const jobs = await Job.findByUser(userId, 'assigned', {
      startDate,
      endDate: new Date()
    });

    const savingsGoals = await SavingsGoal.find({ userId, isActive: true });
    const contributions = await Contribution.find({ 
      userId,
      createdAt: { $gte: startDate }
    });

    // Calculate insights
    const insights = await generateFinancialInsights({
      transactions,
      jobs,
      savingsGoals,
      contributions,
      period: parseInt(period)
    });

    res.json({
      success: true,
      data: {
        insights,
        period: parseInt(period),
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Get AI insights error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get AI insights',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_INSIGHTS_ERROR'
    });
  }
});

// Get market trends
router.get('/market-trends', authenticateToken, async (req, res) => {
  try {
    const { period = '30', location } = req.query;

    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Get job trends
    const jobTrends = await getJobMarketTrends(startDate, location);

    // Get location trends
    const locationTrends = await getLocationTrends(startDate);

    // Get skill trends
    const skillTrends = await getSkillTrends(startDate);

    const trends = {
      jobTrends,
      locationTrends,
      skillTrends,
      period: parseInt(period),
      generatedAt: new Date()
    };

    res.json({
      success: true,
      data: {
        trends
      }
    });
  } catch (error) {
    logger.error('Get market trends error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get market trends',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_TRENDS_ERROR'
    });
  }
});

// Helper function to generate AI suggestions
async function generateAISuggestions(data) {
  const { user, wallet, gamification, recentTransactions, recentJobs, savingsGoals } = data;
  const suggestions = [];

  // Analyze earnings
  const totalEarnings = recentTransactions
    .filter(t => t.type === 'earning')
    .reduce((sum, t) => sum + t.amount, 0);

  const lastWeekEarnings = recentTransactions
    .filter(t => t.type === 'earning' && t.initiatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + t.amount, 0);

  if (totalEarnings > 0 && lastWeekEarnings > totalEarnings * 0.2) {
    suggestions.push({
      messageEn: `You earned ${Math.round((lastWeekEarnings / totalEarnings) * 100)}% more than your average. Consider saving KES ${Math.round(lastWeekEarnings * 0.2)} to reach your goals.`,
      messageSw: `Ulipata ${Math.round((lastWeekEarnings / totalEarnings) * 100)}% zaidi kuliko wastani wako. Fikiria kuweka KES ${Math.round(lastWeekEarnings * 0.2)} kufikia malengo yako.`,
      category: 'earning',
      priority: 'high',
      actionable: true
    });
  }

  // Analyze savings
  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.saved, 0);
  const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.target, 0);

  if (totalTarget > 0 && totalSaved < totalTarget * 0.5) {
    const shortfall = totalTarget - totalSaved;
    suggestions.push({
      messageEn: `You're ${Math.round((totalSaved / totalTarget) * 100)}% towards your savings goals. Save KES ${Math.round(shortfall / 12)} monthly to reach your target.`,
      messageSw: `Uko ${Math.round((totalSaved / totalTarget) * 100)}% kuelekea malengo yako ya akiba. Weka KES ${Math.round(shortfall / 12)} kila mwezi kufikia lengo lako.`,
      category: 'saving',
      priority: 'medium',
      actionable: true
    });
  }

  // Analyze job patterns
  const jobCategories = recentJobs.reduce((acc, job) => {
    acc[job.category] = (acc[job.category] || 0) + 1;
    return acc;
  }, {});

  const topCategory = Object.keys(jobCategories).reduce((a, b) => 
    jobCategories[a] > jobCategories[b] ? a : b, 'Other');

  if (topCategory && topCategory !== 'Other') {
    suggestions.push({
      messageEn: `${topCategory} jobs are trending in your area. Consider updating your skills to match market demand.`,
      messageSw: `Kazi za ${topCategory} zinaongezeka katika eneo lako. Fikiria kusasisha ujuzi wako kulingana na mahitaji ya soko.`,
      category: 'job',
      priority: 'medium',
      actionable: true
    });
  }

  // Analyze spending patterns
  const spendingByCategory = recentTransactions
    .filter(t => t.type === 'withdrawal' || t.type === 'payment')
    .reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {});

  const topSpendingCategory = Object.keys(spendingByCategory).reduce((a, b) => 
    spendingByCategory[a] > spendingByCategory[b] ? a : b, 'Other');

  if (topSpendingCategory && topSpendingCategory !== 'Other') {
    const spendingAmount = spendingByCategory[topSpendingCategory];
    suggestions.push({
      messageEn: `You spent KES ${spendingAmount.toLocaleString()} on ${topSpendingCategory} this month. Consider budgeting for this category.`,
      messageSw: `Umetumia KES ${spendingAmount.toLocaleString()} kwenye ${topSpendingCategory} mwezi huu. Fikiria kupanga bajeti ya kategoria hii.`,
      category: 'spending',
      priority: 'low',
      actionable: true
    });
  }

  // Analyze login streak
  if (gamification && gamification.loginStreakDays > 0) {
    suggestions.push({
      messageEn: `Great job! You've logged in ${gamification.loginStreakDays} days in a row. Keep it up to earn more points!`,
      messageSw: `Kazi nzuri! Umeingia ${gamification.loginStreakDays} siku mfululizo. Endelea hivyo kupata pointi zaidi!`,
      category: 'engagement',
      priority: 'low',
      actionable: false
    });
  }

  // Analyze level progress
  if (gamification && gamification.pointsToNextLevel < 100) {
    suggestions.push({
      messageEn: `You're ${gamification.pointsToNextLevel} points away from level ${gamification.level + 1}. Complete a job or make a savings contribution to level up!`,
      messageSw: `Uko pointi ${gamification.pointsToNextLevel} mbali na kiwango ${gamification.level + 1}. Maliza kazi au fanya mchango wa akiba kupanda kiwango!`,
      category: 'gamification',
      priority: 'medium',
      actionable: true
    });
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
}

// Helper function to generate financial insights
async function generateFinancialInsights(data) {
  const { transactions, jobs, savingsGoals, contributions, period } = data;

  // Calculate monthly earnings
  const monthlyEarnings = transactions
    .filter(t => t.type === 'earning')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate monthly savings
  const monthlySavings = contributions.reduce((sum, c) => sum + c.amount, 0);

  // Calculate monthly spending
  const monthlySpending = transactions
    .filter(t => t.type === 'withdrawal' || t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate job completion rate
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const jobCompletionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  // Calculate savings rate
  const savingsRate = monthlyEarnings > 0 ? (monthlySavings / monthlyEarnings) * 100 : 0;

  const insights = {
    monthlyEarnings,
    monthlySavings,
    monthlySpending,
    savingsRate,
    jobCompletionRate,
    totalJobs,
    completedJobs,
    activeSavingsGoals: savingsGoals.length,
    completedSavingsGoals: savingsGoals.filter(g => g.saved >= g.target).length,
    period,
    generatedAt: new Date()
  };

  return insights;
}

// Helper function to get job market trends
async function getJobMarketTrends(startDate, location) {
  const query = {
    createdAt: { $gte: startDate },
    status: { $in: ['active', 'completed'] }
  };

  if (location) {
    query['location.city'] = new RegExp(location, 'i');
  }

  const jobs = await Job.find(query);

  const categoryTrends = jobs.reduce((acc, job) => {
    acc[job.category] = (acc[job.category] || 0) + 1;
    return acc;
  }, {});

  const priceTrends = jobs.reduce((acc, job) => {
    const category = job.category;
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += job.priceKes;
    acc[category].count += 1;
    return acc;
  }, {});

  // Calculate average prices
  Object.keys(priceTrends).forEach(category => {
    priceTrends[category].average = priceTrends[category].total / priceTrends[category].count;
  });

  return {
    categoryTrends,
    priceTrends,
    totalJobs: jobs.length
  };
}

// Helper function to get location trends
async function getLocationTrends(startDate) {
  const jobs = await Job.find({
    createdAt: { $gte: startDate },
    status: { $in: ['active', 'completed'] }
  });

  const locationTrends = jobs.reduce((acc, job) => {
    const city = job.location.city;
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});

  return locationTrends;
}

// Helper function to get skill trends
async function getSkillTrends(startDate) {
  const jobs = await Job.find({
    createdAt: { $gte: startDate },
    status: { $in: ['active', 'completed'] }
  });

  const skillTrends = {};
  jobs.forEach(job => {
    if (job.skills) {
      job.skills.forEach(skill => {
        skillTrends[skill] = (skillTrends[skill] || 0) + 1;
      });
    }
  });

  return skillTrends;
}

module.exports = router;