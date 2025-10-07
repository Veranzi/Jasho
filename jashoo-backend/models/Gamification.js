const { db } = require('../firebaseAdmin');

const COLLECTION = 'gamification';

class Gamification {
  constructor(data) {
    Object.assign(this, {
      userId: data.userId,
      points: data.points || 0,
      level: data.level || 1,
      loginStreakDays: data.loginStreakDays || 0,
      lastLoginDate: data.lastLoginDate ? new Date(data.lastLoginDate) : null,
      totalEarnings: data.totalEarnings || 0,
      totalSavings: data.totalSavings || 0,
      jobsCompleted: data.jobsCompleted || 0,
      achievements: data.achievements || [],
      statistics: data.statistics || {
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        longestStreak: 0,
        badgesEarned: 0,
        levelUps: 0,
      },
      preferences: data.preferences || { notifications: { levelUp: true, badgeEarned: true, streakMilestone: true } },
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    });
  }

  static _col() {
    if (!db) throw new Error('Firestore not initialized');
    return db.collection(COLLECTION);
  }

  static async findOne(query) {
    if (query.userId) {
      const doc = await this._col().doc(query.userId).get();
      if (!doc.exists) return null;
      return new Gamification({ userId: doc.id, ...doc.data() });
    }
    const snapshot = await this._col().limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return new Gamification({ userId: doc.id, ...doc.data() });
  }

  static async createProfile(userId) {
    const profile = new Gamification({ userId });
    await this._col().doc(userId).set({ ...profile });
    return profile;
  }

  get pointsToNextLevel() {
    const currentLevelPoints = (this.level - 1) * 1000;
    const nextLevelPoints = this.level * 1000;
    return nextLevelPoints - this.points;
  }

  get levelProgress() {
    const currentLevelPoints = (this.level - 1) * 1000;
    const nextLevelPoints = this.level * 1000;
    const progress = this.points - currentLevelPoints;
    const total = nextLevelPoints - currentLevelPoints;
    return total > 0 ? Math.round((progress / total) * 100) : 0;
  }

  async save() {
    this.updatedAt = new Date();
    await Gamification._col().doc(this.userId).set({ ...this }, { merge: true });
    return this;
  }

  async earnPoints(points) {
    this.points += points;
    this.statistics.totalPointsEarned = (this.statistics.totalPointsEarned || 0) + points;
    const newLevel = 1 + Math.floor(this.points / 1000);
    if (newLevel > this.level) {
      this.level = newLevel;
      this.statistics.levelUps = (this.statistics.levelUps || 0) + 1;
    }
    await this.save();
    return this;
  }

  async recordLogin() {
    const today = new Date();
    const todayStr = today.toDateString();
    const lastLoginStr = this.lastLoginDate ? new Date(this.lastLoginDate).toDateString() : null;
    if (lastLoginStr === todayStr) return this;
    if (lastLoginStr === new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString()) {
      this.loginStreakDays += 1;
      this.statistics.longestStreak = Math.max(this.statistics.longestStreak || 0, this.loginStreakDays);
    } else {
      this.loginStreakDays = 1;
    }
    this.lastLoginDate = today;
    await this.earnPoints(10);
    return this;
  }

  async updateSavings(amount) {
    this.totalSavings += amount;
    await this.earnPoints(Math.floor(amount));
    return this;
  }
}

module.exports = { Gamification };
