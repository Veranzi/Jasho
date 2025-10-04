const express = require('express');
const { Wallet, Transaction } = require('../models/Wallet');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validateTransaction, validatePin, validateTransfer } = require('../middleware/validation');
const { BalanceMasker, logger } = require('../middleware/cybersecurity');

const router = express.Router();

// Get wallet balance - matches Flutter WalletProvider
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.findByUserId(req.user.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    // Return balance in Flutter WalletProvider format
    const balance = {
      kesBalance: wallet.balances.KES,
      usdtBalance: wallet.balances.USDT,
      usdBalance: wallet.balances.USD,
      // Masked balance for security
      maskedKesBalance: BalanceMasker.maskBalance(wallet.balances.KES, req.user.userId),
      maskedUsdtBalance: BalanceMasker.maskBalance(wallet.balances.USDT, req.user.userId),
      maskedUsdBalance: BalanceMasker.maskBalance(wallet.balances.USD, req.user.userId),
      // Additional wallet info
      hasPin: wallet.transactionPin.hash !== null,
      isPinLocked: wallet.isPinLocked,
      isFrozen: wallet.isFrozen,
      status: wallet.status,
      dailyLimits: wallet.dailyLimits,
      dailyUsage: wallet.dailyUsage,
      statistics: wallet.statistics
    };

    res.json({
      success: true,
      data: {
        balance
      }
    });
  } catch (error) {
    logger.error('Get balance error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get balance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'BALANCE_ERROR'
    });
  }
});

// Get transaction history - matches Flutter WalletProvider.transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      type,
      status,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };

    const transactions = await Transaction.findByUserId(req.user.userId, options);

    // Convert to Flutter WalletTransaction format
    const formattedTransactions = transactions.map(txn => ({
      id: txn.transactionId,
      type: txn.type,
      amount: txn.amount,
      currencyCode: txn.currencyCode,
      date: txn.initiatedAt,
      status: txn.status,
      description: txn.description,
      category: txn.category,
      method: txn.paymentMethod,
      hustle: txn.metadata?.hustle || null,
      // Additional fields
      netAmount: txn.netAmount,
      fees: txn.fees,
      exchangeRate: txn.exchangeRate,
      transferInfo: txn.transferInfo,
      blockchain: txn.blockchain,
      security: txn.security
    }));

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: formattedTransactions.length
        }
      }
    });
  } catch (error) {
    logger.error('Get transactions error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'TRANSACTIONS_ERROR'
    });
  }
});

// Set transaction PIN - matches Flutter WalletProvider.setPinHash()
router.post('/pin', authenticateToken, validatePin, async (req, res) => {
  try {
    const { pin } = req.body;

    let wallet = await Wallet.findByUserId(req.user.userId);

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await Wallet.createWallet(req.user.userId);
    }

    await wallet.setTransactionPin(pin);

    res.json({
      success: true,
      message: 'Transaction PIN set successfully',
      data: {
        hasPin: true
      }
    });
  } catch (error) {
    logger.error('Set PIN error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to set transaction PIN',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SET_PIN_ERROR'
    });
  }
});

// Verify transaction PIN - matches Flutter WalletProvider.verifyPinHash()
router.post('/verify-pin', authenticateToken, async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required',
        code: 'PIN_REQUIRED'
      });
    }

    const wallet = await Wallet.findByUserId(req.user.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    const isValid = await wallet.verifyTransactionPin(pin);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN',
        code: 'INVALID_PIN'
      });
    }

    res.json({
      success: true,
      message: 'PIN verified successfully',
      data: {
        verified: true
      }
    });
  } catch (error) {
    logger.error('Verify PIN error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to verify PIN',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'VERIFY_PIN_ERROR'
    });
  }
});

// Deposit money - matches Flutter WalletProvider.depositKes()
router.post('/deposit', authenticateToken, validateTransaction, async (req, res) => {
  try {
    const { amount, currencyCode = 'KES', description = 'Deposit', method, hustle, category = 'Deposit' } = req.body;

    let wallet = await Wallet.findByUserId(req.user.userId);

    if (!wallet) {
      wallet = await Wallet.createWallet(req.user.userId);
    }

    // Check daily limits
    wallet.checkDailyLimit(amount, currencyCode, 'deposit');

    // Create transaction
    const transaction = new Transaction({
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.userId,
      type: 'deposit',
      amount,
      currencyCode,
      description,
      category,
      method: method || 'manual',
      source: 'external',
      destination: 'wallet',
      status: 'completed',
      processingStatus: 'confirmed',
      initiatedAt: new Date(),
      completedAt: new Date(),
      metadata: {
        hustle,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await transaction.save();

    // Update wallet balance
    await wallet.updateBalance(amount, currencyCode, 'deposit');

    // Update daily usage
    wallet.updateDailyUsage(amount, currencyCode, 'deposit');

    // Return transaction in Flutter format
    const formattedTransaction = {
      id: transaction.transactionId,
      type: transaction.type,
      amount: transaction.amount,
      currencyCode: transaction.currencyCode,
      date: transaction.initiatedAt,
      status: transaction.status,
      description: transaction.description,
      category: transaction.category,
      method: transaction.method,
      hustle: transaction.metadata?.hustle || null
    };

    res.json({
      success: true,
      message: 'Deposit successful',
      data: {
        transaction: formattedTransaction,
        newBalance: {
          kesBalance: wallet.balances.KES,
          usdtBalance: wallet.balances.USDT,
          usdBalance: wallet.balances.USD
        }
      }
    });
  } catch (error) {
    logger.error('Deposit error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Deposit failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'DEPOSIT_ERROR'
    });
  }
});

// Withdraw money - matches Flutter WalletProvider.withdrawKes()
router.post('/withdraw', authenticateToken, validateTransaction, async (req, res) => {
  try {
    const { amount, currencyCode = 'KES', pin, category = 'Expense', method, hustle } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is required',
        code: 'PIN_REQUIRED'
      });
    }

    const wallet = await Wallet.findByUserId(req.user.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    // Verify PIN
    const isValidPin = await wallet.verifyTransactionPin(pin);
    if (!isValidPin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN',
        code: 'INVALID_PIN'
      });
    }

    // Check daily limits
    wallet.checkDailyLimit(amount, currencyCode, 'withdrawal');

    // Check sufficient balance
    if (wallet.balances[currencyCode] < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    // Create transaction
    const transaction = new Transaction({
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.userId,
      type: 'withdrawal',
      amount,
      currencyCode,
      description: 'Withdraw',
      category,
      method: method || 'manual',
      source: 'wallet',
      destination: 'external',
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
        hustle,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await transaction.save();

    // Update wallet balance
    await wallet.updateBalance(amount, currencyCode, 'withdrawal');

    // Update daily usage
    wallet.updateDailyUsage(amount, currencyCode, 'withdrawal');

    // Return transaction in Flutter format
    const formattedTransaction = {
      id: transaction.transactionId,
      type: transaction.type,
      amount: transaction.amount,
      currencyCode: transaction.currencyCode,
      date: transaction.initiatedAt,
      status: transaction.status,
      description: transaction.description,
      category: transaction.category,
      method: transaction.method,
      hustle: transaction.metadata?.hustle || null
    };

    res.json({
      success: true,
      message: 'Withdrawal successful',
      data: {
        transaction: formattedTransaction,
        newBalance: {
          kesBalance: wallet.balances.KES,
          usdtBalance: wallet.balances.USDT,
          usdBalance: wallet.balances.USD
        }
      }
    });
  } catch (error) {
    logger.error('Withdrawal error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Withdrawal failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'WITHDRAWAL_ERROR'
    });
  }
});

// Convert currency - matches Flutter WalletProvider.convertKesToUsdt()
router.post('/convert', authenticateToken, validateTransaction, async (req, res) => {
  try {
    const { fromCurrency = 'KES', toCurrency = 'USDT', amount, pin, rate } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is required',
        code: 'PIN_REQUIRED'
      });
    }

    if (!rate) {
      return res.status(400).json({
        success: false,
        message: 'Exchange rate is required',
        code: 'RATE_REQUIRED'
      });
    }

    const wallet = await Wallet.findByUserId(req.user.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    // Verify PIN
    const isValidPin = await wallet.verifyTransactionPin(pin);
    if (!isValidPin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN',
        code: 'INVALID_PIN'
      });
    }

    // Check sufficient balance
    if (wallet.balances[fromCurrency] < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    const convertedAmount = amount / rate;

    // Create transaction
    const transaction = new Transaction({
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.userId,
      type: 'convert',
      amount,
      currencyCode: fromCurrency,
      description: `Convert ${fromCurrency} to ${toCurrency}`,
      category: 'Convert',
      status: 'completed',
      processingStatus: 'confirmed',
      initiatedAt: new Date(),
      completedAt: new Date(),
      exchangeRate: {
        fromCurrency,
        toCurrency,
        rate,
        convertedAmount
      },
      security: {
        pinVerified: true,
        deviceFingerprint: req.fingerprint,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await transaction.save();

    // Update wallet balances
    await wallet.updateBalance(amount, fromCurrency, 'withdrawal');
    await wallet.updateBalance(convertedAmount, toCurrency, 'deposit');

    // Return transaction in Flutter format
    const formattedTransaction = {
      id: transaction.transactionId,
      type: transaction.type,
      amount: transaction.amount,
      currencyCode: transaction.currencyCode,
      date: transaction.initiatedAt,
      status: transaction.status,
      description: transaction.description,
      category: transaction.category,
      method: null,
      hustle: null
    };

    res.json({
      success: true,
      message: 'Currency conversion successful',
      data: {
        transaction: formattedTransaction,
        convertedAmount,
        newBalance: {
          kesBalance: wallet.balances.KES,
          usdtBalance: wallet.balances.USDT,
          usdBalance: wallet.balances.USD
        }
      }
    });
  } catch (error) {
    logger.error('Currency conversion error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Currency conversion failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'CONVERSION_ERROR'
    });
  }
});

// Transfer to another user - matches Flutter WalletProvider transfer functionality
router.post('/transfer', authenticateToken, validateTransfer, async (req, res) => {
  try {
    const { recipientUserId, amount, currencyCode = 'KES', description, pin } = req.body;

    const wallet = await Wallet.findByUserId(req.user.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    // Verify PIN
    const isValidPin = await wallet.verifyTransactionPin(pin);
    if (!isValidPin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN',
        code: 'INVALID_PIN'
      });
    }

    // Check daily limits
    wallet.checkDailyLimit(amount, currencyCode, 'transfer');

    // Check sufficient balance
    if (wallet.balances[currencyCode] < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    // Get recipient info
    const User = require('../models/User');
    const recipient = await User.findOne({ userId: recipientUserId, isActive: true });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found',
        code: 'RECIPIENT_NOT_FOUND'
      });
    }

    // Get or create recipient wallet
    let recipientWallet = await Wallet.findByUserId(recipientUserId);
    if (!recipientWallet) {
      recipientWallet = await Wallet.createWallet(recipientUserId);
    }

    // Create transfer transaction
    const transaction = new Transaction({
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.userId,
      type: 'transfer',
      amount,
      currencyCode,
      description: description || `Transfer to ${recipient.fullName}`,
      category: 'Transfer',
      source: 'wallet',
      destination: 'wallet',
      transferInfo: {
        recipientUserId,
        recipientName: recipient.fullName,
        recipientPhone: recipient.phoneNumber
      },
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
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await transaction.save();

    // Update sender wallet balance
    await wallet.updateBalance(amount, currencyCode, 'withdrawal');

    // Update recipient wallet balance
    await recipientWallet.updateBalance(amount, currencyCode, 'deposit');

    // Update daily usage
    wallet.updateDailyUsage(amount, currencyCode, 'transfer');

    // Return transaction in Flutter format
    const formattedTransaction = {
      id: transaction.transactionId,
      type: transaction.type,
      amount: transaction.amount,
      currencyCode: transaction.currencyCode,
      date: transaction.initiatedAt,
      status: transaction.status,
      description: transaction.description,
      category: transaction.category,
      method: 'wallet',
      hustle: null
    };

    res.json({
      success: true,
      message: 'Transfer successful',
      data: {
        transaction: formattedTransaction,
        recipient: {
          userId: recipient.userId,
          fullName: recipient.fullName
        },
        newBalance: {
          kesBalance: wallet.balances.KES,
          usdtBalance: wallet.balances.USDT,
          usdBalance: wallet.balances.USD
        }
      }
    });
  } catch (error) {
    logger.error('Transfer error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Transfer failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'TRANSFER_ERROR'
    });
  }
});

module.exports = router;