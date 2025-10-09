const { db } = require('../firebaseAdmin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const USERS_COLLECTION = 'users';

function defaultUser(data) {
  const now = new Date();
  return {
    // Identifiers
    userId: data.userId,
    email: data.email?.toLowerCase(),
    phoneNumber: data.phoneNumber,

    // Auth
    password: data.password, // hashed before save

    // Profile
    fullName: data.fullName,
    dateOfBirth: data.dateOfBirth || null,
    gender: data.gender || null,
    skills: Array.isArray(data.skills) ? data.skills : [],
    location: data.location,
    coordinates: data.coordinates || { latitude: null, longitude: null },

    // Verification
    rating: data.rating || 0,
    totalRatings: data.totalRatings || 0,
    isVerified: !!data.isVerified,
    verificationLevel: data.verificationLevel || 'unverified',

    // KYC
    kyc: data.kyc || {
      idType: null,
      idNumber: null,
      photoUrl: null,
      photoMetadata: null,
      documentUrls: [],
      verifiedAt: null,
      verifiedBy: null,
      rejectionReason: null,
    },

    // Financial
    absaAccountNumber: data.absaAccountNumber || null,
    bankDetails: data.bankDetails || {
      bankName: null,
      accountNumber: null,
      accountName: null,
      branchCode: null,
    },

    // Preferences
    preferences: data.preferences || {
      language: 'en',
      currency: 'KES',
      notifications: { email: true, sms: true, push: true, marketing: false },
      privacy: { profileVisibility: 'public', showLocation: true, showRating: true },
    },

    // Security
    security: data.security || {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      loginAttempts: 0,
      lockUntil: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      phoneVerificationCode: null,
      phoneVerificationExpires: null,
    },

    // Status
    isActive: data.isActive !== undefined ? data.isActive : true,
    isBlocked: data.isBlocked || false,
    blockedReason: data.blockedReason || null,

    // Activity
    lastLogin: data.lastLogin || null,
    lastActive: data.lastActive || now,

    // Statistics
    statistics: data.statistics || {
      totalJobsCompleted: 0,
      totalEarnings: 0,
      totalSavings: 0,
      totalWithdrawals: 0,
      joinDate: now,
      profileViews: 0,
    },

    // Metadata
    metadata: data.metadata || {
      source: 'web',
      userAgent: null,
      ipAddress: null,
      referrer: null,
    },

    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

class User {
  constructor(data) {
    const normalized = defaultUser(data || {});
    Object.assign(this, normalized);
  }

  static _col() {
    if (!db) throw new Error('Firestore not initialized');
    return db.collection(USERS_COLLECTION);
  }

  static async findOne(query) {
    // Minimal query support for cases used by routes
    if (query.$or && Array.isArray(query.$or)) {
      for (const cond of query.$or) {
        const user = await this.findOne(cond);
        if (user) return user;
      }
      return null;
    }

    // Equality filters
    let q = this._col();
    const filters = Object.entries(query);
    // Firestore can handle up to a few equality filters; fall back to scan if more
    if (filters.length === 1) {
      const [field, value] = filters[0];
      const snapshot = await q.where(field, '==', value).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return new User({ userId: doc.id, ...doc.data() });
    }

    // Fallback: scan with first filter and test others client-side
    const [firstField, firstValue] = filters[0];
    const snapshot = await q.where(firstField, '==', firstValue).limit(50).get();
    for (const doc of snapshot.docs) {
      const data = { userId: doc.id, ...doc.data() };
      const ok = filters.every(([f, v]) => (data[f] === v));
      if (ok) return new User(data);
    }
    return null;
  }

  static async findById(userId) {
    if (!userId) return null;
    const doc = await this._col().doc(userId).get();
    if (!doc.exists) return null;
    return new User({ userId: doc.id, ...doc.data() });
  }

  static async findByUserId(userId) {
    return this.findById(userId);
  }

  static async findByEmail(email) {
    return this.findOne({ email: email?.toLowerCase() });
  }

  static async findByPhone(phoneNumber) {
    return this.findOne({ phoneNumber });
  }

  get isLocked() {
    return !!(this.security?.lockUntil && new Date(this.security.lockUntil) > new Date());
  }

  async comparePassword(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }

  async save() {
    const data = { ...this };
    // Ensure email is lowercased and password hashed if not already hashed
    if (data.email) data.email = String(data.email).toLowerCase();
    if (data.password && !/^\$2[aby]\$/.test(data.password)) {
      const salt = await bcrypt.genSalt(12);
      data.password = await bcrypt.hash(data.password, salt);
    }
    data.updatedAt = new Date();
    await User._col().doc(this.userId).set(data, { merge: true });
    return this;
  }

  async updateLastLogin() {
    this.lastLogin = new Date();
    this.lastActive = new Date();
    await this.save();
    return this;
  }

  async incrementLoginAttempts() {
    const attempts = (this.security?.loginAttempts || 0) + 1;
    const security = { ...(this.security || {}), loginAttempts: attempts };
    // Lock after 5 failed attempts for 2 hours
    if (attempts >= 5 && !this.isLocked) {
      security.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    }
    this.security = security;
    await this.save();
    return this;
  }

  async resetLoginAttempts() {
    const security = { ...(this.security || {}) };
    delete security.loginAttempts;
    delete security.lockUntil;
    this.security = security;
    await this.save();
    return this;
  }

  async completeKyc(kycData) {
    this.kyc = { ...(this.kyc || {}), ...kycData, verifiedAt: new Date(), verifiedBy: 'system' };
    this.isVerified = true;
    this.verificationLevel = 'kyc_verified';
    await this.save();
    return this;
  }

  generatePasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
    const security = { ...(this.security || {}) };
    security.passwordResetToken = hashed;
    security.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    this.security = security;
    return resetToken;
  }

  generateEmailVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const security = { ...(this.security || {}) };
    security.emailVerificationToken = hashed;
    security.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    this.security = security;
    return token;
  }

  generatePhoneVerificationCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = crypto.createHash('sha256').update(code).digest('hex');
    const security = { ...(this.security || {}) };
    security.phoneVerificationCode = hashed;
    security.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    this.security = security;
    return code;
  }

  getPublicProfile() {
    const obj = { ...this };
    delete obj.password;
    delete obj.security;
    return obj;
  }
}

module.exports = User;
