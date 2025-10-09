const { db } = require('../firebaseAdmin');
const bcrypt = require('bcryptjs');

const WALLETS_COLLECTION = 'wallets';
const TX_COLLECTION = 'transactions';

function defaultWallet(userId) {
  return {
    userId,
    balances: { KES: 0, USDT: 0, USD: 0 },
    lockedBalances: { KES: 0, USDT: 0, USD: 0 },
    transactionPin: { hash: null, attempts: 0, lockedUntil: null, lastUsed: null },
    dailyLimits: {
      withdrawal: { KES: 100000, USDT: 1000, USD: 1000 },
      transfer: { KES: 50000, USDT: 500, USD: 500 },
    },
    dailyUsage: {
      date: new Date(),
      withdrawal: { KES: 0, USDT: 0, USD: 0 },
      transfer: { KES: 0, USDT: 0, USD: 0 },
    },
    statistics: {
      totalDeposits: { KES: 0, USDT: 0, USD: 0 },
      totalWithdrawals: { KES: 0, USDT: 0, USD: 0 },
      totalEarnings: { KES: 0, USDT: 0, USD: 0 },
      totalTransactions: 0,
      lastTransactionAt: null,
    },
    security: {
      twoFactorEnabled: false,
      biometricEnabled: false,
      autoLockEnabled: true,
      autoLockTimeout: 300000,
      lastSecurityCheck: new Date(),
    },
    status: 'active',
    suspensionReason: null,
    frozenUntil: null,
    blockchain: { enabled: false, walletAddress: null, privateKey: null, network: 'ethereum', lastSyncAt: null },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

class Wallet {
  constructor(data) {
    Object.assign(this, data);
  }

  static _wallets() {
    if (!db) throw new Error('Firestore not initialized');
    return db.collection(WALLETS_COLLECTION);
  }

  static _tx() {
    if (!db) throw new Error('Firestore not initialized');
    return db.collection(TX_COLLECTION);
  }

  static async findByUserId(userId) {
    const doc = await this._wallets().doc(userId).get();
    if (!doc.exists) return null;
    return new Wallet({ userId: doc.id, ...doc.data() });
  }

  static async createWallet(userId) {
    const wallet = new Wallet(defaultWallet(userId));
    await this._wallets().doc(userId).set({ ...wallet });
    return wallet;
  }

  get isPinLocked() {
    return !!(this.transactionPin?.lockedUntil && new Date(this.transactionPin.lockedUntil) > new Date());
  }

  async save() {
    this.updatedAt = new Date();
    await Wallet._wallets().doc(this.userId).set({ ...this }, { merge: true });
    return this;
  }

  async setTransactionPin(pin) {
    const salt = await bcrypt.genSalt(12);
    this.transactionPin.hash = await bcrypt.hash(pin, salt);
    this.transactionPin.attempts = 0;
    this.transactionPin.lockedUntil = null;
    await this.save();
  }

  async verifyTransactionPin(pin) {
    if (this.isPinLocked) throw new Error('Transaction PIN is locked. Try again later.');
    const ok = await bcrypt.compare(pin, this.transactionPin.hash || '');
    if (!ok) {
      this.transactionPin.attempts = (this.transactionPin.attempts || 0) + 1;
      if (this.transactionPin.attempts >= 3) {
        this.transactionPin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.save();
      return false;
    }
    this.transactionPin.attempts = 0;
    this.transactionPin.lockedUntil = null;
    this.transactionPin.lastUsed = new Date();
    await this.save();
    return true;
  }

  checkDailyLimit(amount, currency, type) {
    const key = currency.toUpperCase();
    const today = new Date().toDateString();
    const usageDate = new Date(this.dailyUsage.date).toDateString();
    if (today !== usageDate) {
      this.dailyUsage.date = new Date();
      this.dailyUsage.withdrawal[key] = 0;
      this.dailyUsage.transfer[key] = 0;
    }
    const limitType = type === 'withdrawal' ? 'withdrawal' : 'transfer';
    const current = this.dailyUsage[limitType][key] || 0;
    const limit = this.dailyLimits[limitType][key] || 0;
    if (current + amount > limit) {
      throw new Error(`Daily ${limitType} limit exceeded for ${currency}`);
    }
    return true;
  }

  updateDailyUsage(amount, currency, type) {
    const key = currency.toUpperCase();
    const limitType = type === 'withdrawal' ? 'withdrawal' : 'transfer';
    this.dailyUsage[limitType][key] = (this.dailyUsage[limitType][key] || 0) + amount;
    return this.save();
  }

  async updateBalance(amount, currency, type) {
    const key = currency.toUpperCase();
    if (type === 'deposit' || type === 'earning' || type === 'bonus') {
      this.balances[key] = (this.balances[key] || 0) + amount;
      this.statistics.totalDeposits[key] = (this.statistics.totalDeposits[key] || 0) + amount;
      if (type === 'earning') {
        this.statistics.totalEarnings[key] = (this.statistics.totalEarnings[key] || 0) + amount;
      }
    } else if (type === 'withdrawal' || type === 'payment' || type === 'penalty') {
      if ((this.balances[key] || 0) < amount) throw new Error('Insufficient balance');
      this.balances[key] = (this.balances[key] || 0) - amount;
      this.statistics.totalWithdrawals[key] = (this.statistics.totalWithdrawals[key] || 0) + amount;
    }
    this.statistics.totalTransactions = (this.statistics.totalTransactions || 0) + 1;
    this.statistics.lastTransactionAt = new Date();
    await this.save();
    return this;
  }
}

class Transaction {
  constructor(data) {
    Object.assign(this, data);
  }

  static _tx() {
    if (!db) throw new Error('Firestore not initialized');
    return db.collection(TX_COLLECTION);
  }

  static async findByUserId(userId, options = {}) {
    const { limit = 20, skip = 0, type, status, startDate, endDate } = options;
    let q = this._tx().where('userId', '==', userId);
    if (type) q = q.where('type', '==', type);
    if (status) q = q.where('status', '==', status);
    if (startDate) q = q.where('initiatedAt', '>=', startDate);
    if (endDate) q = q.where('initiatedAt', '<=', endDate);
    q = q.orderBy('initiatedAt', 'desc').limit(limit);
    const snapshot = await q.get();
    const docs = snapshot.docs.slice(skip);
    return docs.map((d) => new Transaction({ id: d.id, ...d.data() }));
  }

  async save() {
    const ref = await Transaction._tx().add({ ...this });
    this.id = ref.id;
    return this;
  }
}

module.exports = { Wallet, Transaction };
