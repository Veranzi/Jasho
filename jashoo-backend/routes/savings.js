const express = require('express');
const { SavingsGoal, LoanRequest, Contribution } = require('../models/Savings');
const { Wallet, Transaction } = require('../models/Wallet');
const { Gamification } = require('../models/Gamification');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validateSavingsGoal, validateContribution, validateLoanRequest, validatePagination } = require('../middleware/validation');
const { logger } = require('../middleware/cybersecurity');

const router = express.Router();

// Get savings goals - matches Flutter SavingsProvider.goals
router.get('/goals', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const allGoals = await SavingsGoal.findByUser(req.user.userId);
    const goals = allGoals.slice((parseInt(page)-1)*parseInt(limit), parseInt(page)*parseInt(limit));

    // Convert to Flutter SavingsGoal format
    const formattedGoals = goals.map(goal => ({
      id: goal.id,
      name: goal.name,
      target: goal.target,
      saved: goal.saved,
      dueDate: goal.dueDate,
      hustle: goal.hustle,
      // Additional fields for Flutter
      category: goal.category,
      isActive: goal.isActive,
      completedAt: goal.completedAt,
      autoSave: goal.autoSave,
      progressPercentage: goal.progressPercentage,
      daysRemaining: goal.daysRemaining,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    }));

    res.json({
      success: true,
      data: {
        goals: formattedGoals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: formattedGoals.length
        }
      }
    });
  } catch (error) {
    logger.error('Get savings goals error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get savings goals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_GOALS_ERROR'
    });
  }
});

// Get savings goal by ID
router.get('/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await SavingsGoal.findOneById(id);
    if (goal && goal.userId !== req.user.userId) return res.status(404).json({ success:false,message:'Savings goal not found', code:'GOAL_NOT_FOUND' });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
        code: 'GOAL_NOT_FOUND'
      });
    }

    // Convert to Flutter SavingsGoal format
    const formattedGoal = {
      id: goal.id,
      name: goal.name,
      target: goal.target,
      saved: goal.saved,
      dueDate: goal.dueDate,
      hustle: goal.hustle,
      category: goal.category,
      isActive: goal.isActive,
      completedAt: goal.completedAt,
      autoSave: goal.autoSave,
      progressPercentage: goal.progressPercentage,
      daysRemaining: goal.daysRemaining,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    };

    res.json({
      success: true,
      data: {
        goal: formattedGoal
      }
    });
  } catch (error) {
    logger.error('Get savings goal error', {
      goalId: req.params.id,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get savings goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_GOAL_ERROR'
    });
  }
});

// Create savings goal - matches Flutter SavingsProvider.addGoal()
router.post('/goals', authenticateToken, validateSavingsGoal, async (req, res) => {
  try {
    const { name, target, dueDate, category, hustle } = req.body;

    const goal = new SavingsGoal({ userId: req.user.userId, name, target, saved: 0, dueDate: dueDate ? new Date(dueDate) : null, category, hustle, isActive: true });
    await goal.save();

    // Convert to Flutter SavingsGoal format
    const formattedGoal = {
      id: goal.id,
      name: goal.name,
      target: goal.target,
      saved: goal.saved,
      dueDate: goal.dueDate,
      hustle: goal.hustle,
      category: goal.category,
      isActive: goal.isActive,
      completedAt: goal.completedAt,
      autoSave: goal.autoSave,
      progressPercentage: goal.progressPercentage,
      daysRemaining: goal.daysRemaining,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: {
        goal: formattedGoal
      }
    });
  } catch (error) {
    logger.error('Create savings goal error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create savings goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'CREATE_GOAL_ERROR'
    });
  }
});

// Update savings goal
router.put('/goals/:id', authenticateToken, validateSavingsGoal, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, target, dueDate, category, hustle } = req.body;

    const goal = await SavingsGoal.findOneById(id);
    if (!goal || goal.userId !== req.user.userId) {
      return res.status(404).json({ success:false, message:'Savings goal not found', code:'GOAL_NOT_FOUND' });
    }

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
        code: 'GOAL_NOT_FOUND'
      });
    }

    // Update goal fields
    if (name) goal.name = name;
    if (target) goal.target = target;
    if (dueDate) goal.dueDate = new Date(dueDate);
    if (category) goal.category = category;
    if (hustle !== undefined) goal.hustle = hustle;

    await goal.save();

    // Convert to Flutter SavingsGoal format
    const formattedGoal = {
      id: goal.id,
      name: goal.name,
      target: goal.target,
      saved: goal.saved,
      dueDate: goal.dueDate,
      hustle: goal.hustle,
      category: goal.category,
      isActive: goal.isActive,
      completedAt: goal.completedAt,
      autoSave: goal.autoSave,
      progressPercentage: goal.progressPercentage,
      daysRemaining: goal.daysRemaining,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    };

    res.json({
      success: true,
      message: 'Savings goal updated successfully',
      data: {
        goal: formattedGoal
      }
    });
  } catch (error) {
    logger.error('Update savings goal error', {
      goalId: req.params.id,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update savings goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'UPDATE_GOAL_ERROR'
    });
  }
});

// Contribute to savings goal - matches Flutter SavingsProvider.contribute()
router.post('/goals/:id/contribute', authenticateToken, validateContribution, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, source = 'manual', hustle, pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is required',
        code: 'PIN_REQUIRED'
      });
    }

    const goal = await SavingsGoal.findOneById(id);
    if (!goal || goal.userId !== req.user.userId) {
      return res.status(404).json({ success:false, message:'Savings goal not found', code:'GOAL_NOT_FOUND' });
    }

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
        code: 'GOAL_NOT_FOUND'
      });
    }

    // Verify PIN
    const wallet = await Wallet.findByUserId(req.user.userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const isValidPin = await wallet.verifyTransactionPin(pin);
    if (!isValidPin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN',
        code: 'INVALID_PIN'
      });
    }

    // Check sufficient balance
    if (wallet.balances.KES < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    // Add contribution to goal
    await goal.addContribution(amount);

    // Create contribution record
    const contribution = new Contribution({ userId: req.user.userId, goalId: goal.id, amount, source, hustle, pointsEarned: Math.floor(amount), metadata: { ip: req.ip, userAgent: req.get('User-Agent') } });
    await contribution.save();

    // Create transaction
    const transaction = new Transaction({
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.userId,
      type: 'saving',
      amount,
      currencyCode: 'KES',
      description: `Savings contribution: ${goal.name}`,
      category: 'Savings',
      method: 'wallet',
      savingsGoalId: goal._id,
      source: 'wallet',
      destination: 'savings',
      status: 'completed',
      processingStatus: 'confirmed',
      initiatedAt: new Date(),
      completedAt: new Date(),
      security: {
        pinVerified: true,
        deviceFingerprint: req.fingerprint,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      metadata: {
        goalId: goal._id.toString(),
        goalName: goal.name,
        hustle,
        pointsEarned: contribution.pointsEarned
      }
    });

    await transaction.save();

    // Update wallet balance
    await wallet.updateBalance(amount, 'KES', 'withdrawal');

    // Update gamification
    const gamification = await Gamification.findOne({ userId: req.user.userId });
    if (gamification) {
      await gamification.earnPoints(contribution.pointsEarned);
      await gamification.updateSavings(amount);
    }

    // Convert to Flutter SavingsGoal format
    const formattedGoal = {
      id: goal.id,
      name: goal.name,
      target: goal.target,
      saved: goal.saved,
      dueDate: goal.dueDate,
      hustle: goal.hustle,
      category: goal.category,
      isActive: goal.isActive,
      completedAt: goal.completedAt,
      autoSave: goal.autoSave,
      progressPercentage: goal.progressPercentage,
      daysRemaining: goal.daysRemaining,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    };

    res.json({
      success: true,
      message: 'Contribution successful',
      data: {
        goal: formattedGoal,
        contribution: {
          id: contribution.id,
          amount: contribution.amount,
          source: contribution.source,
          hustle: contribution.hustle,
          pointsEarned: contribution.pointsEarned,
          createdAt: contribution.createdAt
        },
        newBalance: {
          kesBalance: wallet.balances.KES,
          usdtBalance: wallet.balances.USDT,
          usdBalance: wallet.balances.USD
        }
      }
    });
  } catch (error) {
    logger.error('Contribute to savings goal error', {
      goalId: req.params.id,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to contribute to savings goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'CONTRIBUTE_ERROR'
    });
  }
});

// Get goal contributions
router.get('/goals/:id/contributions', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const goal = await SavingsGoal.findOneById(id);
    if (!goal || goal.userId !== req.user.userId) {
      return res.status(404).json({ success:false, message:'Savings goal not found', code:'GOAL_NOT_FOUND' });
    }

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
        code: 'GOAL_NOT_FOUND'
      });
    }

    const all = await Contribution.findByGoal(goal.id);
    const contributions = all.slice((parseInt(page)-1)*parseInt(limit), parseInt(page)*parseInt(limit));

    res.json({
      success: true,
      data: {
        contributions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: contributions.length
        }
      }
    });
  } catch (error) {
    logger.error('Get goal contributions error', {
      goalId: req.params.id,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get contributions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_CONTRIBUTIONS_ERROR'
    });
  }
});

// Delete savings goal
router.delete('/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await SavingsGoal.findOneById(id);
    if (!goal || goal.userId !== req.user.userId) {
      return res.status(404).json({ success:false, message:'Savings goal not found', code:'GOAL_NOT_FOUND' });
    }

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
        code: 'GOAL_NOT_FOUND'
      });
    }

    // Soft delete
    goal.isActive = false;
    await goal.save();

    res.json({
      success: true,
      message: 'Savings goal deleted successfully'
    });
  } catch (error) {
    logger.error('Delete savings goal error', {
      goalId: req.params.id,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete savings goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'DELETE_GOAL_ERROR'
    });
  }
});

// Get loan requests - matches Flutter SavingsProvider.loans
router.get('/loans', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { userId: req.user.userId };
    if (status) query.status = status;

    const allLoans = await LoanRequest.find(query);
    const loans = allLoans.slice((parseInt(page)-1)*parseInt(limit), parseInt(page)*parseInt(limit));

    // Convert to Flutter LoanRequest format
    const formattedLoans = loans.map(loan => ({
      id: loan.id,
      amount: loan.amount,
      status: loan.status,
      // Additional fields for Flutter
      purpose: loan.purpose,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      monthlyPayment: loan.monthlyPayment,
      disbursedAt: loan.disbursedAt,
      dueDate: loan.dueDate,
      repaidAt: loan.repaidAt,
      creditScore: loan.creditScore,
      collateral: loan.collateral,
      guarantor: loan.guarantor,
      documents: loan.documents,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt
    }));

    res.json({
      success: true,
      data: {
        loans: formattedLoans,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: formattedLoans.length
        }
      }
    });
  } catch (error) {
    logger.error('Get loan requests error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get loan requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_LOANS_ERROR'
    });
  }
});

// Get loan request by ID
router.get('/loans/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await LoanRequest.findOneById(id);
    if (!loan || loan.userId !== req.user.userId) {
      return res.status(404).json({ success:false, message:'Loan request not found', code:'LOAN_NOT_FOUND' });
    }

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan request not found',
        code: 'LOAN_NOT_FOUND'
      });
    }

    // Convert to Flutter LoanRequest format
    const formattedLoan = {
      id: loan.id,
      amount: loan.amount,
      status: loan.status,
      purpose: loan.purpose,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      monthlyPayment: loan.monthlyPayment,
      disbursedAt: loan.disbursedAt,
      dueDate: loan.dueDate,
      repaidAt: loan.repaidAt,
      creditScore: loan.creditScore,
      collateral: loan.collateral,
      guarantor: loan.guarantor,
      documents: loan.documents,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt
    };

    res.json({
      success: true,
      data: {
        loan: formattedLoan
      }
    });
  } catch (error) {
    logger.error('Get loan request error', {
      loanId: req.params.id,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get loan request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_LOAN_ERROR'
    });
  }
});

// Request loan - matches Flutter SavingsProvider.requestLoan()
router.post('/loans', authenticateToken, requireVerification, validateLoanRequest, async (req, res) => {
  try {
    const { amount, purpose, termMonths = 12, collateral, guarantor } = req.body;

    // Get user's credit score
    const { CreditScore } = require('../models/CreditScore');
    const { CreditScore } = require('../models/CreditScore');
    const creditScore = await CreditScore.findByUser(req.user.userId);

    if (!creditScore) {
      return res.status(400).json({
        success: false,
        message: 'Credit score not available. Please complete your profile first.',
        code: 'NO_CREDIT_SCORE'
      });
    }

    // Check loan eligibility
    const eligibility = creditScore.eligibilityProfile;
    if (amount > eligibility.maxLoanAmount) {
      return res.status(400).json({
        success: false,
        message: `Maximum loan amount is ${eligibility.maxLoanAmount} KES`,
        code: 'LOAN_AMOUNT_EXCEEDED'
      });
    }

    // Calculate loan terms
    const interestRate = eligibility.interestRate || 15; // Default 15% APR
    const monthlyPayment = amount * (interestRate / 100 / 12) * Math.pow(1 + (interestRate / 100 / 12), termMonths) / (Math.pow(1 + (interestRate / 100 / 12), termMonths) - 1);

    const loan = new LoanRequest({ userId: req.user.userId, amount, purpose, status: 'pending', interestRate, termMonths, monthlyPayment, creditScore: creditScore.currentScore, collateral, guarantor, documents: [], metadata: { ip: req.ip, userAgent: req.get('User-Agent') } });
    await loan.save();

    // Convert to Flutter LoanRequest format
    const formattedLoan = {
      id: loan.id,
      amount: loan.amount,
      status: loan.status,
      purpose: loan.purpose,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      monthlyPayment: loan.monthlyPayment,
      disbursedAt: loan.disbursedAt,
      dueDate: loan.dueDate,
      repaidAt: loan.repaidAt,
      creditScore: loan.creditScore,
      collateral: loan.collateral,
      guarantor: loan.guarantor,
      documents: loan.documents,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Loan request submitted successfully',
      data: {
        loan: formattedLoan
      }
    });
  } catch (error) {
    logger.error('Request loan error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to submit loan request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'REQUEST_LOAN_ERROR'
    });
  }
});

// Get savings statistics - matches Flutter SavingsProvider
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get savings goals
    const goals = await SavingsGoal.findByUser(userId);
    const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
    const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);

    // Get contributions
    const contributions = await Contribution.findByUser(userId);
    const totalContributions = contributions.reduce((sum, contrib) => sum + contrib.amount, 0);
    const pointsEarnedFromSavings = contributions.reduce((sum, contrib) => sum + contrib.pointsEarned, 0);

    // Get hustle savings breakdown
    const hustleSavings = {};
    contributions.forEach(contrib => {
      if (contrib.hustle) {
        hustleSavings[contrib.hustle] = (hustleSavings[contrib.hustle] || 0) + contrib.amount;
      }
    });

    // Get loan requests
    const loans = await LoanRequest.find({ userId });
    const totalLoansRequested = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const activeLoans = loans.filter(loan => loan.status === 'approved' || loan.status === 'disbursed');

    const statistics = {
      // Goals
      totalGoals: goals.length,
      activeGoals: goals.filter(goal => goal.isActive).length,
      completedGoals: goals.filter(goal => goal.saved >= goal.target).length,
      totalSaved,
      totalTarget,
      savingsRate: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
      
      // Contributions
      totalContributions,
      pointsEarnedFromSavings,
      hustleSavings,
      
      // Loans
      totalLoansRequested,
      activeLoans: activeLoans.length,
      totalLoanAmount: activeLoans.reduce((sum, loan) => sum + loan.amount, 0),
      
      // Recent activity
      recentContributions: contributions.slice(0, 5),
      recentGoals: goals.slice(0, 5)
    };

    res.json({
      success: true,
      data: {
        statistics
      }
    });
  } catch (error) {
    logger.error('Get savings statistics error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get savings statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_STATISTICS_ERROR'
    });
  }
});

module.exports = router;