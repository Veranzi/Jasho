const express = require('express');
const { SavingsGoal, LoanRequest, Contribution } = require('../models/Savings');
const { Wallet, Transaction } = require('../models/Wallet');
const { Gamification } = require('../models/Gamification');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validateSavingsGoal, validateContribution, validateLoanRequest, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all savings goals
router.get('/goals', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const goals = await SavingsGoal.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SavingsGoal.countDocuments({ userId: req.user.userId });

    res.json({
      success: true,
      data: {
        goals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get savings goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get savings goals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get savings goal by ID
router.get('/goals/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    if (goal.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get contributions for this goal
    const contributions = await Contribution.find({ goalId: goal._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        goal,
        recentContributions: contributions
      }
    });
  } catch (error) {
    console.error('Get savings goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get savings goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new savings goal
router.post('/goals', authenticateToken, requireVerification, validateSavingsGoal, async (req, res) => {
  try {
    const goalData = {
      ...req.body,
      userId: req.user.userId
    };

    const goal = new SavingsGoal(goalData);
    await goal.save();

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: {
        goal
      }
    });
  } catch (error) {
    console.error('Create savings goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create savings goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update savings goal
router.put('/goals/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const goalId = req.params.id;
    const { name, target, dueDate, category, hustle } = req.body;

    const goal = await SavingsGoal.findById(goalId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    if (goal.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (goal.completedAt) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed goal'
      });
    }

    const allowedUpdates = {};
    if (name !== undefined) allowedUpdates.name = name.trim();
    if (target !== undefined) allowedUpdates.target = target;
    if (dueDate !== undefined) allowedUpdates.dueDate = dueDate;
    if (category !== undefined) allowedUpdates.category = category;
    if (hustle !== undefined) allowedUpdates.hustle = hustle;

    const updatedGoal = await SavingsGoal.findByIdAndUpdate(
      goalId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Savings goal updated successfully',
      data: {
        goal: updatedGoal
      }
    });
  } catch (error) {
    console.error('Update savings goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update savings goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Contribute to savings goal
router.post('/goals/:id/contribute', authenticateToken, requireVerification, validateObjectId, validateContribution, async (req, res) => {
  try {
    const goalId = req.params.id;
    const { amount, source, hustle, pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is required'
      });
    }

    const goal = await SavingsGoal.findById(goalId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    if (goal.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!goal.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot contribute to inactive goal'
      });
    }

    // Check wallet balance and verify PIN
    let wallet = await Wallet.findOne({ userId: req.user.userId });
    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const isValidPin = await require('bcryptjs').compare(pin, wallet.transactionPinHash);
    if (!isValidPin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid transaction PIN'
      });
    }

    if (amount > wallet.kesBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Add contribution to goal
    const { pointsEarned } = await goal.addContribution(amount, source, hustle);

    // Update wallet balance
    await wallet.updateBalance(amount, 'KES', 'withdrawal');

    // Create contribution record
    const contribution = new Contribution({
      userId: req.user.userId,
      goalId: goal._id,
      amount,
      source,
      hustle,
      pointsEarned
    });

    await contribution.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user.userId,
      type: 'saving',
      amount,
      currencyCode: 'KES',
      status: 'Success',
      description: `Savings contribution: ${goal.name}`,
      category: 'Savings',
      hustle,
      reference: `SAV_${goalId}_${Date.now()}`
    });

    await transaction.save();

    // Update gamification
    const gamification = await Gamification.findOne({ userId: req.user.userId });
    if (gamification) {
      await gamification.updateSavings(amount);
      await gamification.earnPoints(pointsEarned, 'savings');
    }

    res.json({
      success: true,
      message: 'Contribution successful',
      data: {
        contribution,
        transaction,
        goal,
        pointsEarned
      }
    });
  } catch (error) {
    console.error('Contribute to goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to contribute to goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get contributions for a goal
router.get('/goals/:id/contributions', authenticateToken, validateObjectId, validatePagination, async (req, res) => {
  try {
    const goalId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const goal = await SavingsGoal.findById(goalId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    if (goal.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const contributions = await Contribution.find({ goalId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contribution.countDocuments({ goalId });

    res.json({
      success: true,
      data: {
        contributions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get contributions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contributions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete savings goal
router.delete('/goals/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const goalId = req.params.id;

    const goal = await SavingsGoal.findById(goalId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    if (goal.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (goal.saved > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete goal with contributions. Withdraw funds first.'
      });
    }

    await SavingsGoal.findByIdAndDelete(goalId);

    res.json({
      success: true,
      message: 'Savings goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete savings goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete savings goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all loan requests
router.get('/loans', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const loans = await LoanRequest.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LoanRequest.countDocuments({ userId: req.user.userId });

    res.json({
      success: true,
      data: {
        loans,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get loan requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get loan requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get loan request by ID
router.get('/loans/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const loan = await LoanRequest.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan request not found'
      });
    }

    if (loan.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        loan
      }
    });
  } catch (error) {
    console.error('Get loan request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get loan request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Request a loan
router.post('/loans', authenticateToken, requireVerification, validateLoanRequest, async (req, res) => {
  try {
    const loanData = {
      ...req.body,
      userId: req.user.userId
    };

    // Calculate monthly payment
    const loan = new LoanRequest(loanData);
    await loan.calculateMonthlyPayment();

    res.status(201).json({
      success: true,
      message: 'Loan request submitted successfully',
      data: {
        loan
      }
    });
  } catch (error) {
    console.error('Request loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit loan request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get savings statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get total saved amount
    const totalSaved = await SavingsGoal.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$saved' } } }
    ]);

    // Get total target amount
    const totalTarget = await SavingsGoal.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$target' } } }
    ]);

    // Get active goals count
    const activeGoals = await SavingsGoal.countDocuments({ userId, isActive: true });

    // Get completed goals count
    const completedGoals = await SavingsGoal.countDocuments({ userId, completedAt: { $ne: null } });

    // Get overdue goals count
    const overdueGoals = await SavingsGoal.find({ userId, isActive: true })
      .then(goals => goals.filter(goal => goal.isOverdue()).length);

    // Get total contributions this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyContributions = await Contribution.aggregate([
      { $match: { userId, createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get hustle breakdown
    const hustleBreakdown = await Contribution.aggregate([
      { $match: { userId, hustle: { $ne: null } } },
      { $group: { _id: '$hustle', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalSaved: totalSaved[0]?.total || 0,
        totalTarget: totalTarget[0]?.total || 0,
        activeGoals,
        completedGoals,
        overdueGoals,
        monthlyContributions: monthlyContributions[0]?.total || 0,
        hustleBreakdown
      }
    });
  } catch (error) {
    console.error('Get savings statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get savings statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;