const express = require('express');
const { Gamification } = require('../models/Gamification');
const { SavingsGoal, Contribution } = require('../models/Savings');
const { Job } = require('../models/Job');
const { Transaction } = require('../models/Wallet');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get AI suggestions
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const language = req.user.preferences?.language || 'en';

    // Get user's data for analysis
    const gamification = await Gamification.findOne({ userId });
    const savingsGoals = await SavingsGoal.find({ userId, isActive: true });
    const recentContributions = await Contribution.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);
    const recentJobs = await Job.find({ 
      $or: [{ postedBy: userId }, { assignedTo: userId }] 
    }).sort({ createdAt: -1 }).limit(10);
    const recentTransactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const suggestions = [];

    // Analyze earnings vs savings
    const totalEarnings = recentTransactions
      .filter(t => t.type === 'earning')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSavings = recentContributions
      .reduce((sum, c) => sum + c.amount, 0);

    if (totalEarnings > 0 && totalSavings / totalEarnings < 0.1) {
      suggestions.push({
        type: 'savings',
        priority: 'high',
        messageEn: 'You\'re earning well! Consider saving 10% of your earnings to build financial security.',
        messageSw: 'Unapata pesa nzuri! Fikiria kuweka 10% ya mapato yako kujenga usalama wa kifedha.',
        action: 'Set up automatic savings',
        icon: '💰'
      });
    }

    // Analyze savings goals progress
    const overdueGoals = savingsGoals.filter(goal => goal.isOverdue());
    if (overdueGoals.length > 0) {
      suggestions.push({
        type: 'goal',
        priority: 'high',
        messageEn: `You have ${overdueGoals.length} savings goal(s) that are overdue. Consider adjusting your targets or increasing contributions.`,
        messageSw: `Una malengo ${overdueGoals.length} ya akiba ambayo yamechelewa. Fikiria kubadilisha malengo yako au kuongeza michango.`,
        action: 'Review savings goals',
        icon: '🎯'
      });
    }

    // Analyze job completion rate
    const completedJobs = recentJobs.filter(job => 
      job.status === 'completed' && job.assignedTo === userId
    );
    const totalAssignedJobs = recentJobs.filter(job => 
      job.assignedTo === userId
    );

    if (totalAssignedJobs.length > 0 && completedJobs.length / totalAssignedJobs.length < 0.8) {
      suggestions.push({
        type: 'productivity',
        priority: 'medium',
        messageEn: 'Your job completion rate is below 80%. Focus on finishing assigned tasks to build your reputation.',
        messageSw: 'Kiwango chako cha kumaliza kazi ni chini ya 80%. Elekeza nguvu kumaliza kazi zilizopewa ili ujenge sifa yako.',
        action: 'Complete pending jobs',
        icon: '✅'
      });
    }

    // Analyze spending patterns
    const spendingByCategory = {};
    recentTransactions
      .filter(t => t.type === 'withdrawal' || t.type === 'payment')
      .forEach(t => {
        const category = t.category || 'Other';
        spendingByCategory[category] = (spendingByCategory[category] || 0) + t.amount;
      });

    const topSpendingCategory = Object.entries(spendingByCategory)
      .sort(([,a], [,b]) => b - a)[0];

    if (topSpendingCategory && topSpendingCategory[1] > totalEarnings * 0.3) {
      suggestions.push({
        type: 'spending',
        priority: 'medium',
        messageEn: `You're spending ${Math.round(topSpendingCategory[1] / totalEarnings * 100)}% of your earnings on ${topSpendingCategory[0]}. Consider budgeting.`,
        messageSw: `Unatumia ${Math.round(topSpendingCategory[1] / totalEarnings * 100)}% ya mapato yako kwenye ${topSpendingCategory[0]}. Fikiria kupanga bajeti.`,
        action: 'Create budget plan',
        icon: '📊'
      });
    }

    // Analyze login streak
    if (gamification && gamification.loginStreakDays >= 7) {
      suggestions.push({
        type: 'engagement',
        priority: 'low',
        messageEn: `Great job! You've maintained a ${gamification.loginStreakDays}-day login streak. Keep it up!`,
        messageSw: `Kazi nzuri! Umeendelea kuingia kwa siku ${gamification.loginStreakDays}. Endelea hivyo!`,
        action: 'Continue streak',
        icon: '🔥'
      });
    }

    // Analyze level progress
    if (gamification && gamification.pointsToNextLevel < 100) {
      suggestions.push({
        type: 'gamification',
        priority: 'low',
        messageEn: `You're ${gamification.pointsToNextLevel} points away from level ${gamification.level + 1}! Complete a few more tasks to level up.`,
        messageSw: `Uko pointi ${gamification.pointsToNextLevel} mbali na kiwango ${gamification.level + 1}! Maliza kazi chache zaidi ili uongeze kiwango.`,
        action: 'Complete more tasks',
        icon: '⭐'
      });
    }

    // Analyze job market trends (simplified)
    const availableJobs = await Job.countDocuments({ status: 'pending' });
    const weekendJobs = await Job.countDocuments({ 
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (weekendJobs > availableJobs * 0.4) {
      suggestions.push({
        type: 'opportunity',
        priority: 'medium',
        messageEn: 'More jobs are posted on weekends. Consider being more active during weekends to increase your earnings.',
        messageSw: 'Kazi nyingi zinawekwa wikendi. Fikiria kuwa mwenye shughuli zaidi wikendi ili uongeze mapato yako.',
        action: 'Check weekend jobs',
        icon: '📅'
      });
    }

    // Sort suggestions by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 5), // Return top 5 suggestions
        language,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get personalized financial insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const language = req.user.preferences?.language || 'en';

    // Get data for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const monthlyEarnings = await Transaction.aggregate([
      { $match: { userId, type: 'earning', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlySavings = await Contribution.aggregate([
      { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlySpending = await Transaction.aggregate([
      { $match: { userId, type: { $in: ['withdrawal', 'payment'] }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const jobsCompleted = await Job.countDocuments({
      assignedTo: userId,
      status: 'completed',
      completedAt: { $gte: thirtyDaysAgo }
    });

    const insights = [];

    const earnings = monthlyEarnings[0]?.total || 0;
    const savings = monthlySavings[0]?.total || 0;
    const spending = monthlySpending[0]?.total || 0;

    // Savings rate insight
    if (earnings > 0) {
      const savingsRate = (savings / earnings) * 100;
      if (savingsRate >= 20) {
        insights.push({
          type: 'excellent',
          titleEn: 'Excellent Savings Rate',
          titleSw: 'Kiwango Cha Akiba Cha Juu',
          messageEn: `You're saving ${savingsRate.toFixed(1)}% of your earnings. This is excellent for building wealth!`,
          messageSw: `Unaweka ${savingsRate.toFixed(1)}% ya mapato yako. Hii ni bora sana kujenga utajiri!`,
          icon: '🏆'
        });
      } else if (savingsRate >= 10) {
        insights.push({
          type: 'good',
          titleEn: 'Good Savings Rate',
          titleSw: 'Kiwango Cha Akiba Cha Kazi',
          messageEn: `You're saving ${savingsRate.toFixed(1)}% of your earnings. Consider increasing to 20% for better financial security.`,
          messageSw: `Unaweka ${savingsRate.toFixed(1)}% ya mapato yako. Fikiria kuongeza hadi 20% kwa usalama wa kifedha bora.`,
          icon: '👍'
        });
      } else {
        insights.push({
          type: 'improvement',
          titleEn: 'Improve Savings Rate',
          titleSw: 'Boresha Kiwango Cha Akiba',
          messageEn: `You're saving ${savingsRate.toFixed(1)}% of your earnings. Try to save at least 10% for financial stability.`,
          messageSw: `Unaweka ${savingsRate.toFixed(1)}% ya mapato yako. Jaribu kuweka angalau 10% kwa utulivu wa kifedha.`,
          icon: '📈'
        });
      }
    }

    // Job completion insight
    if (jobsCompleted >= 10) {
      insights.push({
        type: 'excellent',
        titleEn: 'High Productivity',
        titleSw: 'Uzalishaji Wa Juu',
        messageEn: `You completed ${jobsCompleted} jobs this month. Your productivity is impressive!`,
        messageSw: `Umemaliza kazi ${jobsCompleted} mwezi huu. Uzalishaji wako ni wa kuvutia!`,
        icon: '⚡'
      });
    } else if (jobsCompleted >= 5) {
      insights.push({
        type: 'good',
        titleEn: 'Steady Progress',
        titleSw: 'Maendeleo Ya Kudumu',
        messageEn: `You completed ${jobsCompleted} jobs this month. Keep up the good work!`,
        messageSw: `Umemaliza kazi ${jobsCompleted} mwezi huu. Endelea kufanya kazi nzuri!`,
        icon: '🎯'
      });
    }

    // Spending analysis
    if (spending > earnings * 0.8) {
      insights.push({
        type: 'warning',
        titleEn: 'High Spending',
        titleSw: 'Matumizi Ya Juu',
        messageEn: `You're spending ${((spending / earnings) * 100).toFixed(1)}% of your earnings. Consider reducing expenses.`,
        messageSw: `Unatumia ${((spending / earnings) * 100).toFixed(1)}% ya mapato yako. Fikiria kupunguza gharama.`,
        icon: '⚠️'
      });
    }

    res.json({
      success: true,
      data: {
        insights,
        summary: {
          monthlyEarnings: earnings,
          monthlySavings: savings,
          monthlySpending: spending,
          jobsCompleted,
          savingsRate: earnings > 0 ? (savings / earnings) * 100 : 0
        },
        language,
        period: '30 days',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial insights',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get market trends and opportunities
router.get('/market-trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const language = req.user.preferences?.language || 'en';

    // Get job trends for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const jobTrends = await Job.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$priceKes' } } },
      { $sort: { count: -1 } }
    ]);

    const locationTrends = await Job.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get user's skills for personalized recommendations
    const user = await require('../models/User').findOne({ userId });
    const userSkills = user?.skills || [];

    const trends = [];

    // Top job categories
    if (jobTrends.length > 0) {
      const topCategory = jobTrends[0];
      trends.push({
        type: 'category',
        titleEn: `High Demand: ${topCategory._id}`,
        titleSw: `Mahitaji Ya Juu: ${topCategory._id}`,
        messageEn: `${topCategory.count} ${topCategory._id} jobs posted this week with average pay of ${topCategory.avgPrice.toFixed(0)} KES.`,
        messageSw: `Kazi ${topCategory.count} za ${topCategory._id} zimewekwa wiki hii na malipo ya wastani wa ${topCategory.avgPrice.toFixed(0)} KES.`,
        icon: '📈',
        data: topCategory
      });
    }

    // Location opportunities
    if (locationTrends.length > 0) {
      const topLocation = locationTrends[0];
      trends.push({
        type: 'location',
        titleEn: `Hot Spot: ${topLocation._id}`,
        titleSw: `Eneo Lenye Mahitaji: ${topLocation._id}`,
        messageEn: `${topLocation.count} jobs available in ${topLocation._id} this week.`,
        messageSw: `Kazi ${topLocation.count} zinapatikana ${topLocation._id} wiki hii.`,
        icon: '📍',
        data: topLocation
      });
    }

    // Skill-based recommendations
    if (userSkills.length > 0) {
      const skillJobs = await Job.find({
        category: { $in: userSkills },
        status: 'pending',
        createdAt: { $gte: sevenDaysAgo }
      });

      if (skillJobs.length > 0) {
        trends.push({
          type: 'skill',
          titleEn: 'Jobs Match Your Skills',
          titleSw: 'Kazi Zinahusiana Na Ujuzi Wako',
          messageEn: `${skillJobs.length} jobs matching your skills (${userSkills.join(', ')}) are available.`,
          messageSw: `Kazi ${skillJobs.length} zinahusiana na ujuzi wako (${userSkills.join(', ')}) zinapatikana.`,
          icon: '🎯',
          data: { count: skillJobs.length, skills: userSkills }
        });
      }
    }

    res.json({
      success: true,
      data: {
        trends,
        jobTrends,
        locationTrends,
        language,
        period: '7 days',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get market trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get market trends',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;