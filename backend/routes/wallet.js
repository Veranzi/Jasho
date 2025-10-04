const express = require('express');
const bcrypt = require('bcryptjs');
const { Wallet, Transaction } = require('../models/Wallet');
const { Gamification } = require('../models/Gamification');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validateTransaction, validatePin, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.userId });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = new Wallet({
        userId: req.user.userId,
        kesBalance: 0,
        usdtBalance: 0
      });
      await wallet.save();
    }

    res.json({
      success: true,
      data: {
        kesBalance: wallet.kesBalance,
        usdtBalance: wallet.usdtBalance,
        hasPin: !!wallet.transactionPinHash,
        pinLocked: wallet.pinLockedUntil && wallet.pinLockedUntil > new Date()
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet balance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ userId: req.user.userId });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Set transaction PIN
router.post('/pin', authenticateToken, validatePin, async (req, res) => {
  try {
    const { pin } = req.body;

    // Hash the PIN
    const salt = await bcrypt.genSalt(12);
    const pinHash = await bcrypt.hash(pin, salt);

    let wallet = await Wallet.findOne({ userId: req.user.userId });

    if (!wallet) {
      wallet = new Wallet({
        userId: req.user.userId,
        kesBalance: 0,
        usdtBalance: 0
      });
    }

    await wallet.setPinHash(pinHash);

    res.json({
      success: true,
      message: 'Transaction PIN set successfully'
    });
  } catch (error) {
    console.error('Set PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set transaction PIN',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify transaction PIN
router.post('/verify-pin', authenticateToken, async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required'
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user.userId });

    if (!wallet || !wallet.transactionPinHash) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN not set'
      });
    }

    const isValid = await bcrypt.compare(pin, wallet.transactionPinHash);

    if (!isValid) {
      wallet.pinAttempts += 1;
      if (wallet.pinAttempts >= 3) {
        wallet.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }
      await wallet.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid PIN',
        attemptsRemaining: Math.max(0, 3 - wallet.pinAttempts),
        lockedUntil: wallet.pinLockedUntil
      });
    }

    // Reset attempts on successful verification
    wallet.pinAttempts = 0;
    wallet.pinLockedUntil = null;
    await wallet.save();

    res.json({
      success: true,
      message: 'PIN verified successfully'
    });
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify PIN',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Deposit money
router.post('/deposit', authenticateToken, requireVerification, validateTransaction, async (req, res) => {
  try {
    const { amount, currencyCode, description, category, method, hustle } = req.body;

    let wallet = await Wallet.findOne({ userId: req.user.userId });

    if (!wallet) {
      wallet = new Wallet({
        userId: req.user.userId,
        kesBalance: 0,
        usdtBalance: 0
      });
    }

    // Update wallet balance
    await wallet.updateBalance(amount, currencyCode, 'deposit');

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user.userId,
      type: 'deposit',
      amount,
      currencyCode,
      status: 'Success',
      description: description || 'Deposit',
      category: category || 'Deposit',
      method,
      hustle,
      reference: `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    await transaction.save();

    // Update gamification earnings
    const gamification = await Gamification.findOne({ userId: req.user.userId });
    if (gamification) {
      await gamification.updateEarnings(amount);
    }

    res.json({
      success: true,
      message: 'Deposit successful',
      data: {
        transaction,
        newBalance: currencyCode === 'KES' ? wallet.kesBalance : wallet.usdtBalance
      }
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Deposit failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Withdraw money
router.post('/withdraw', authenticateToken, requireVerification, validateTransaction, async (req, res) => {
  try {
    const { amount, currencyCode, description, category, method, hustle, pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is required'
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user.userId });

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, wallet.transactionPinHash);
    if (!isValidPin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid transaction PIN'
      });
    }

    // Check sufficient balance
    const currentBalance = currencyCode === 'KES' ? wallet.kesBalance : wallet.usdtBalance;
    if (amount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Update wallet balance
    await wallet.updateBalance(amount, currencyCode, 'withdrawal');

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user.userId,
      type: 'withdrawal',
      amount,
      currencyCode,
      status: 'Success',
      description: description || 'Withdrawal',
      category: category || 'Withdrawal',
      method,
      hustle,
      reference: `WTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Withdrawal successful',
      data: {
        transaction,
        newBalance: currencyCode === 'KES' ? wallet.kesBalance : wallet.usdtBalance
      }
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Withdrawal failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Convert currency
router.post('/convert', authenticateToken, requireVerification, async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount, rate, pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is required'
      });
    }

    if (!fromCurrency || !toCurrency || !amount || !rate) {
      return res.status(400).json({
        success: false,
        message: 'All conversion parameters are required'
      });
    }

    if (fromCurrency === toCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Cannot convert to the same currency'
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user.userId });

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, wallet.transactionPinHash);
    if (!isValidPin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid transaction PIN'
      });
    }

    // Check sufficient balance
    const currentBalance = fromCurrency === 'KES' ? wallet.kesBalance : wallet.usdtBalance;
    if (amount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Calculate converted amount
    const convertedAmount = fromCurrency === 'KES' ? amount / rate : amount * rate;

    // Update wallet balances
    await wallet.updateBalance(amount, fromCurrency, 'withdrawal');
    await wallet.updateBalance(convertedAmount, toCurrency, 'deposit');

    // Create transaction records
    const fromTransaction = new Transaction({
      userId: req.user.userId,
      type: 'convert',
      amount,
      currencyCode: fromCurrency,
      status: 'Success',
      description: `Convert ${fromCurrency} to ${toCurrency}`,
      category: 'Convert',
      reference: `CNV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    const toTransaction = new Transaction({
      userId: req.user.userId,
      type: 'convert',
      amount: convertedAmount,
      currencyCode: toCurrency,
      status: 'Success',
      description: `Convert ${fromCurrency} to ${toCurrency}`,
      category: 'Convert',
      reference: fromTransaction.reference
    });

    await fromTransaction.save();
    await toTransaction.save();

    res.json({
      success: true,
      message: 'Currency conversion successful',
      data: {
        fromTransaction,
        toTransaction,
        newBalances: {
          kes: wallet.kesBalance,
          usdt: wallet.usdtBalance
        }
      }
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({
      success: false,
      message: 'Currency conversion failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Transfer money to another user
router.post('/transfer', authenticateToken, requireVerification, async (req, res) => {
  try {
    const { recipientUserId, amount, currencyCode, description, pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is required'
      });
    }

    if (!recipientUserId || !amount || !currencyCode) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, amount, and currency are required'
      });
    }

    if (recipientUserId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to yourself'
      });
    }

    // Check if recipient exists
    const User = require('../models/User');
    const recipient = await User.findOne({ userId: recipientUserId, isActive: true });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    let senderWallet = await Wallet.findOne({ userId: req.user.userId });
    let recipientWallet = await Wallet.findOne({ userId: recipientUserId });

    if (!senderWallet) {
      return res.status(400).json({
        success: false,
        message: 'Sender wallet not found'
      });
    }

    if (!recipientWallet) {
      recipientWallet = new Wallet({
        userId: recipientUserId,
        kesBalance: 0,
        usdtBalance: 0
      });
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, senderWallet.transactionPinHash);
    if (!isValidPin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid transaction PIN'
      });
    }

    // Check sufficient balance
    const currentBalance = currencyCode === 'KES' ? senderWallet.kesBalance : senderWallet.usdtBalance;
    if (amount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Update balances
    await senderWallet.updateBalance(amount, currencyCode, 'withdrawal');
    await recipientWallet.updateBalance(amount, currencyCode, 'deposit');

    // Create transaction records
    const senderTransaction = new Transaction({
      userId: req.user.userId,
      type: 'transfer',
      amount,
      currencyCode,
      status: 'Success',
      description: description || `Transfer to ${recipient.fullName}`,
      category: 'Transfer',
      reference: `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    const recipientTransaction = new Transaction({
      userId: recipientUserId,
      type: 'transfer',
      amount,
      currencyCode,
      status: 'Success',
      description: description || `Transfer from ${req.user.fullName}`,
      category: 'Transfer',
      reference: senderTransaction.reference
    });

    await senderTransaction.save();
    await recipientTransaction.save();

    res.json({
      success: true,
      message: 'Transfer successful',
      data: {
        transaction: senderTransaction,
        newBalance: currencyCode === 'KES' ? senderWallet.kesBalance : senderWallet.usdtBalance
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;