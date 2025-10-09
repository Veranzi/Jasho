const { db } = require('../firebaseAdmin');

const COLLECTION = 'creditScores';

class CreditScore {
  constructor(data) {
    Object.assign(this, {
      userId: data.userId,
      currentScore: data.currentScore || 300,
      scoreHistory: data.scoreHistory || [],
      financialProfile: data.financialProfile || {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        savingsRate: 0,
        debtToIncomeRatio: 0,
        employmentStability: 0,
        gigWorkConsistency: 0,
      },
      paymentPatterns: data.paymentPatterns || {
        onTimePayments: 0,
        latePayments: 0,
        missedPayments: 0,
        averagePaymentDelay: 0,
      },
      loanHistory: data.loanHistory || [],
      riskFactors: data.riskFactors || [],
      aiInsights: data.aiInsights || { spendingPatterns: {}, incomePredictions: {}, riskAssessment: {}, creditworthinessTrend: 'stable' },
      eligibilityProfile: data.eligibilityProfile || {
        maxLoanAmount: 0,
        interestRate: 15,
        maxTermMonths: 12,
        eligibleLoanTypes: ['personal'],
        restrictions: [],
      },
      lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(),
      nextCalculation: data.nextCalculation ? new Date(data.nextCalculation) : new Date(Date.now() + 24*60*60*1000),
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    });
  }

  static _col() { if (!db) throw new Error('Firestore not initialized'); return db.collection(COLLECTION); }

  static async findByUser(userId) {
    const doc = await this._col().doc(userId).get();
    if (!doc.exists) return null;
    return new CreditScore({ userId: doc.id, ...doc.data() });
  }

  static async createProfile(userId) {
    const profile = new CreditScore({ userId });
    await this._col().doc(userId).set({ ...profile });
    return profile;
  }

  static async getTopScores(limit = 10) {
    const snap = await this._col().orderBy('currentScore','desc').limit(limit).get();
    return snap.docs.map(d=> new CreditScore({ userId: d.id, ...d.data() }));
  }

  get scoreGrade() {
    if (this.currentScore >= 750) return 'Excellent';
    if (this.currentScore >= 700) return 'Good';
    if (this.currentScore >= 650) return 'Fair';
    if (this.currentScore >= 600) return 'Poor';
    return 'Very Poor';
  }

  get scoreTrend() {
    if (!this.scoreHistory || this.scoreHistory.length < 2) return 'stable';
    const recent = this.scoreHistory.slice(-3);
    const trend = recent.reduce((sum, entry, index) => index===0?0: sum + (entry.score - recent[index-1].score), 0);
    if (trend > 10) return 'improving';
    if (trend < -10) return 'declining';
    return 'stable';
  }

  async calculateEligibilityProfile() {
    const score = this.currentScore;
    const incomeMultiplier = Math.min(score / 100, 5);
    this.eligibilityProfile.maxLoanAmount = (this.financialProfile.monthlyIncome || 0) * incomeMultiplier;
    if (score >= 750) this.eligibilityProfile.interestRate = 8; else if (score >= 700) this.eligibilityProfile.interestRate = 12; else if (score >= 650) this.eligibilityProfile.interestRate = 15; else if (score >= 600) this.eligibilityProfile.interestRate = 20; else this.eligibilityProfile.interestRate = 25;
    if (score >= 700) this.eligibilityProfile.maxTermMonths = 24; else if (score >= 650) this.eligibilityProfile.maxTermMonths = 18; else this.eligibilityProfile.maxTermMonths = 12;
    this.eligibilityProfile.eligibleLoanTypes = ['personal'];
    if (score >= 650) this.eligibilityProfile.eligibleLoanTypes.push('business');
    if (score >= 600) this.eligibilityProfile.eligibleLoanTypes.push('emergency');
    if (score >= 700) this.eligibilityProfile.eligibleLoanTypes.push('education');
    this.eligibilityProfile.restrictions = [];
    if ((this.currentScore || 0) < 600) this.eligibilityProfile.restrictions.push('Requires collateral');
    if ((this.currentScore || 0) < 650) this.eligibilityProfile.restrictions.push('Higher interest rate');
    if ((this.paymentPatterns.missedPayments || 0) > 2) this.eligibilityProfile.restrictions.push('Payment history concerns');
    return this;
  }

  async updateScore(newScore, factors, reason) {
    this.scoreHistory = [...(this.scoreHistory || []), { score: newScore, date: new Date(), factors, reason }];
    const twelveMonthsAgo = new Date(Date.now() - 365*24*60*60*1000);
    this.scoreHistory = this.scoreHistory.filter(e => new Date(e.date) > twelveMonthsAgo);
    this.currentScore = newScore;
    this.lastUpdated = new Date();
    this.nextCalculation = new Date(Date.now() + 24*60*60*1000);
    await this.calculateEligibilityProfile();
    return this.save();
  }

  async save() {
    this.updatedAt = new Date();
    await CreditScore._col().doc(this.userId).set({ ...this }, { merge: true });
    return this;
  }
}

class AICreditScorer {
  constructor() {
    this.model = null;
    this.isInitialized = false;
  }

  async initializeModel() {
    try {
      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
    }
  }

  async calculateCreditScore(userData) {
    if (!this.isInitialized) {
      await this.initializeModel();
    }

    try {
      const features = this.extractFeatures(userData);
      const aiScore = await this.predictScore(features);
      const ruleBasedScore = this.calculateRuleBasedScore(userData);
      return aiScore || ruleBasedScore;
    } catch (error) {
      return this.calculateRuleBasedScore(userData);
    }
  }

  extractFeatures(userData) {
    const {
      financialProfile,
      paymentPatterns,
      loanHistory,
      transactionHistory,
      jobHistory
    } = userData;

    return {
      monthlyIncome: financialProfile.monthlyIncome || 0,
      monthlyExpenses: financialProfile.monthlyExpenses || 0,
      savingsRate: financialProfile.savingsRate || 0,
      debtToIncomeRatio: financialProfile.debtToIncomeRatio || 0,
      onTimePayments: paymentPatterns.onTimePayments || 0,
      latePayments: paymentPatterns.latePayments || 0,
      missedPayments: paymentPatterns.missedPayments || 0,
      averagePaymentDelay: paymentPatterns.averagePaymentDelay || 0,
      employmentStability: financialProfile.employmentStability || 0,
      gigWorkConsistency: financialProfile.gigWorkConsistency || 0,
      transactionCount: transactionHistory?.length || 0,
      averageTransactionAmount: this.calculateAverageTransactionAmount(transactionHistory),
      transactionVariability: this.calculateTransactionVariability(transactionHistory),
      jobCompletionRate: this.calculateJobCompletionRate(jobHistory),
      averageJobRating: this.calculateAverageJobRating(jobHistory)
    };
  }

  async predictScore(features) {
    const weights = {
      monthlyIncome: 0.15,
      savingsRate: 0.20,
      onTimePayments: 0.25,
      employmentStability: 0.15,
      gigWorkConsistency: 0.10,
      transactionVariability: 0.10,
      jobCompletionRate: 0.05
    };

    let score = 300;

    if (features.monthlyIncome > 0) {
      score += Math.min(features.monthlyIncome / 100, 100) * weights.monthlyIncome;
    }

    if (features.savingsRate > 0) {
      score += Math.min(features.savingsRate * 2, 100) * weights.savingsRate;
    }

    const totalPayments = features.onTimePayments + features.latePayments + features.missedPayments;
    if (totalPayments > 0) {
      const onTimeRate = features.onTimePayments / totalPayments;
      score += onTimeRate * 100 * weights.onTimePayments;
    }

    score += Math.min(features.employmentStability, 100) * weights.employmentStability;
    score += Math.min(features.gigWorkConsistency, 100) * weights.gigWorkConsistency;

    const variabilityScore = Math.max(0, 100 - features.transactionVariability);
    score += variabilityScore * weights.transactionVariability;

    score += features.jobCompletionRate * weights.jobCompletionRate;

    return Math.min(Math.max(Math.round(score), 300), 850);
  }

  calculateRuleBasedScore(userData) {
    const { financialProfile, paymentPatterns, loanHistory } = userData;
    let score = 300;

    if (financialProfile.monthlyIncome > 0) {
      score += Math.min(financialProfile.monthlyIncome / 50, 100);
    }

    if (financialProfile.savingsRate > 0) {
      score += Math.min(financialProfile.savingsRate * 2, 100);
    }

    const totalPayments = paymentPatterns.onTimePayments + paymentPatterns.latePayments + paymentPatterns.missedPayments;
    if (totalPayments > 0) {
      const onTimeRate = paymentPatterns.onTimePayments / totalPayments;
      score += onTimeRate * 200;
    }

    score += Math.min(financialProfile.employmentStability, 100);
    score += Math.min(financialProfile.gigWorkConsistency, 100);

    if (loanHistory && loanHistory.length > 0) {
      const completedLoans = loanHistory.filter(loan => loan.status === 'repaid').length;
      const totalLoans = loanHistory.length;
      const completionRate = completedLoans / totalLoans;
      score += completionRate * 50;
    }

    return Math.min(Math.max(Math.round(score), 300), 850);
  }

  calculateAverageTransactionAmount(transactions) {
    if (!transactions || transactions.length === 0) return 0;
    const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    return total / transactions.length;
  }

  calculateTransactionVariability(transactions) {
    if (!transactions || transactions.length < 2) return 0;
    const amounts = transactions.map(t => t.amount || 0);
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
    return Math.sqrt(variance);
  }

  calculateJobCompletionRate(jobs) {
    if (!jobs || jobs.length === 0) return 0;
    const completed = jobs.filter(j => j.status === 'completed').length;
    return (completed / jobs.length) * 100;
  }

  calculateAverageJobRating(jobs) {
    if (!jobs || jobs.length === 0) return 0;
    const rated = jobs.filter(j => j.rating && j.rating > 0);
    if (rated.length === 0) return 0;
    const total = rated.reduce((sum, j) => sum + j.rating, 0);
    return total / rated.length;
  }

  assessRiskFactors(userData) {
    const risks = [];
    if (userData.financialProfile.monthlyIncome < 10000) {
      risks.push({ factor: 'Low Income', severity: 'medium', description: 'Monthly income below recommended threshold', recommendation: 'Consider additional income sources or skill development' });
    }
    if (userData.paymentPatterns.missedPayments > 2) {
      risks.push({ factor: 'Payment History', severity: 'high', description: 'Multiple missed payments detected', recommendation: 'Improve payment discipline and set up payment reminders' });
    }
    if (userData.financialProfile.gigWorkConsistency < 50) {
      risks.push({ factor: 'Employment Stability', severity: 'medium', description: 'Inconsistent gig work patterns', recommendation: 'Diversify income sources and improve job completion rates' });
    }
    if (userData.financialProfile.savingsRate < 10) {
      risks.push({ factor: 'Low Savings Rate', severity: 'medium', description: 'Savings rate below 10%', recommendation: 'Increase savings contributions gradually' });
    }
    return risks;
  }
}

module.exports = { CreditScore, AICreditScorer: new AICreditScorer() };
