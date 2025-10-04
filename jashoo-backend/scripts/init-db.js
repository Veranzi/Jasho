const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const { Wallet } = require('../models/Wallet');
const { Gamification, Badge } = require('../models/Gamification');
const { CreditScore } = require('../models/CreditScore');

// Initialize badges
async function initializeBadges() {
  try {
    console.log('Initializing badges...');
    
    const defaultBadges = [
      {
        id: 'first_login',
        name: 'Welcome!',
        description: 'Complete your first login',
        icon: '🎉',
        category: 'milestone',
        pointsRequired: 0,
        isActive: true
      },
      {
        id: 'first_job',
        name: 'First Gig',
        description: 'Complete your first job',
        icon: '💼',
        category: 'milestone',
        pointsRequired: 100,
        isActive: true
      },
      {
        id: 'first_savings',
        name: 'Saver',
        description: 'Make your first savings contribution',
        icon: '💰',
        category: 'milestone',
        pointsRequired: 50,
        isActive: true
      },
      {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        category: 'level',
        pointsRequired: 5000,
        isActive: true
      },
      {
        id: 'level_10',
        name: 'Superstar',
        description: 'Reach level 10',
        icon: '🌟',
        category: 'level',
        pointsRequired: 10000,
        isActive: true
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain 7-day login streak',
        icon: '🔥',
        category: 'streak',
        pointsRequired: 70,
        isActive: true
      },
      {
        id: 'streak_30',
        name: 'Month Master',
        description: 'Maintain 30-day login streak',
        icon: '🏆',
        category: 'streak',
        pointsRequired: 300,
        isActive: true
      },
      {
        id: 'earner_10000',
        name: 'Big Earner',
        description: 'Earn 10,000 KES total',
        icon: '💵',
        category: 'earning',
        pointsRequired: 1000,
        isActive: true
      },
      {
        id: 'saver_5000',
        name: 'Smart Saver',
        description: 'Save 5,000 KES total',
        icon: '🏦',
        category: 'saving',
        pointsRequired: 500,
        isActive: true
      },
      {
        id: 'jobs_10',
        name: 'Job Master',
        description: 'Complete 10 jobs',
        icon: '🎯',
        category: 'job',
        pointsRequired: 1000,
        isActive: true
      }
    ];

    // Clear existing badges
    await Badge.deleteMany({});
    
    // Insert default badges
    await Badge.insertMany(defaultBadges);
    
    console.log(`✅ Initialized ${defaultBadges.length} badges`);
  } catch (error) {
    console.error('❌ Failed to initialize badges:', error);
    throw error;
  }
}

// Initialize sample data
async function initializeSampleData() {
  try {
    console.log('Initializing sample data...');
    
    // Create demo users
    const demoUsers = [
      {
        userId: 'demo-user-1',
        email: 'demo1@jashoo.com',
        phoneNumber: '+254700000001',
        password: 'password123',
        fullName: 'John Doe',
        skills: ['Boda Rider', 'Delivery'],
        location: 'Nairobi, Westlands',
        rating: 4.6,
        isVerified: true,
        verificationLevel: 'fully_verified',
        kyc: {
          idType: 'ID',
          idNumber: '12345678',
          photoUrl: 'https://example.com/photo1.jpg',
          verifiedAt: new Date(),
          verifiedBy: 'system'
        },
        absaAccountNumber: '123456789012',
        preferences: {
          language: 'en',
          currency: 'KES',
          notifications: {
            email: true,
            sms: true,
            push: true,
            marketing: false
          }
        },
        statistics: {
          totalJobsCompleted: 15,
          totalEarnings: 45000,
          totalSavings: 12000,
          totalWithdrawals: 33000,
          joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          profileViews: 45
        }
      },
      {
        userId: 'demo-user-2',
        email: 'demo2@jashoo.com',
        phoneNumber: '+254700000002',
        password: 'password123',
        fullName: 'Jane Smith',
        skills: ['Mama Fua', 'Cleaning'],
        location: 'Nairobi, Kilimani',
        rating: 4.8,
        isVerified: true,
        verificationLevel: 'fully_verified',
        kyc: {
          idType: 'ID',
          idNumber: '87654321',
          photoUrl: 'https://example.com/photo2.jpg',
          verifiedAt: new Date(),
          verifiedBy: 'system'
        },
        preferences: {
          language: 'sw',
          currency: 'KES',
          notifications: {
            email: true,
            sms: true,
            push: true,
            marketing: true
          }
        },
        statistics: {
          totalJobsCompleted: 22,
          totalEarnings: 68000,
          totalSavings: 18000,
          totalWithdrawals: 50000,
          joinDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
          profileViews: 67
        }
      },
      {
        userId: 'demo-user-3',
        email: 'demo3@jashoo.com',
        phoneNumber: '+254700000003',
        password: 'password123',
        fullName: 'Peter Kimani',
        skills: ['Construction', 'Gardening'],
        location: 'Nairobi, Kasarani',
        rating: 4.2,
        isVerified: false,
        verificationLevel: 'phone_verified',
        preferences: {
          language: 'en',
          currency: 'KES',
          notifications: {
            email: true,
            sms: false,
            push: true,
            marketing: false
          }
        },
        statistics: {
          totalJobsCompleted: 8,
          totalEarnings: 25000,
          totalSavings: 5000,
          totalWithdrawals: 20000,
          joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          profileViews: 12
        }
      }
    ];

    // Clear existing demo users
    await User.deleteMany({ userId: { $regex: /^demo-user-/ } });
    
    // Create demo users
    const createdUsers = await User.insertMany(demoUsers);
    console.log(`✅ Created ${createdUsers.length} demo users`);

    // Create wallets for demo users
    for (const user of createdUsers) {
      const wallet = new Wallet({
        userId: user.userId,
        balances: {
          KES: Math.floor(Math.random() * 50000) + 10000,
          USDT: Math.floor(Math.random() * 100) + 10,
          USD: Math.floor(Math.random() * 50) + 5
        },
        transactionPin: {
          hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', // "1234"
          attempts: 0,
          lockedUntil: null
        },
        dailyLimits: {
          withdrawal: { KES: 100000, USDT: 1000, USD: 1000 },
          transfer: { KES: 50000, USDT: 500, USD: 500 }
        },
        statistics: {
          totalDeposits: { KES: 60000, USDT: 120, USD: 60 },
          totalWithdrawals: { KES: 45000, USDT: 90, USD: 45 },
          totalEarnings: { KES: user.statistics.totalEarnings, USDT: 0, USD: 0 },
          totalTransactions: Math.floor(Math.random() * 50) + 20,
          lastTransactionAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      });
      
      await wallet.save();
    }
    console.log(`✅ Created wallets for ${createdUsers.length} users`);

    // Create gamification profiles for demo users
    for (const user of createdUsers) {
      const gamification = new Gamification({
        userId: user.userId,
        points: Math.floor(Math.random() * 2000) + 500,
        level: Math.floor(Math.random() * 5) + 1,
        loginStreakDays: Math.floor(Math.random() * 15) + 1,
        lastLoginDate: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
        totalEarnings: user.statistics.totalEarnings,
        totalSavings: user.statistics.totalSavings,
        jobsCompleted: user.statistics.totalJobsCompleted,
        achievements: [
          {
            id: 'first_login',
            name: 'Welcome!',
            description: 'Complete your first login',
            earnedAt: user.statistics.joinDate,
            category: 'milestone'
          }
        ],
        statistics: {
          totalPointsEarned: Math.floor(Math.random() * 3000) + 1000,
          totalPointsRedeemed: Math.floor(Math.random() * 500) + 100,
          longestStreak: Math.floor(Math.random() * 20) + 5,
          badgesEarned: Math.floor(Math.random() * 5) + 1,
          levelUps: Math.floor(Math.random() * 3) + 1
        }
      });
      
      await gamification.save();
    }
    console.log(`✅ Created gamification profiles for ${createdUsers.length} users`);

    // Create credit scores for demo users
    for (const user of createdUsers) {
      const creditScore = new CreditScore({
        userId: user.userId,
        currentScore: Math.floor(Math.random() * 200) + 600, // 600-800 range
        scoreHistory: [
          {
            score: Math.floor(Math.random() * 200) + 600,
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            factors: {
              paymentHistory: 85,
              creditUtilization: 75,
              creditHistory: 60,
              newCredit: 90,
              creditMix: 70
            },
            reason: 'Initial score calculation'
          }
        ],
        financialProfile: {
          monthlyIncome: Math.floor(user.statistics.totalEarnings / 12),
          monthlyExpenses: Math.floor(user.statistics.totalWithdrawals / 12),
          savingsRate: (user.statistics.totalSavings / user.statistics.totalEarnings) * 100,
          debtToIncomeRatio: Math.floor(Math.random() * 20) + 10,
          employmentStability: Math.floor(Math.random() * 30) + 70,
          gigWorkConsistency: Math.floor(Math.random() * 25) + 75
        },
        paymentPatterns: {
          onTimePayments: Math.floor(Math.random() * 20) + 80,
          latePayments: Math.floor(Math.random() * 5) + 1,
          missedPayments: Math.floor(Math.random() * 2),
          averagePaymentDelay: Math.floor(Math.random() * 3)
        },
        riskFactors: [
          {
            factor: 'Income Stability',
            severity: 'low',
            description: 'Regular gig work income',
            recommendation: 'Continue maintaining consistent work'
          }
        ],
        aiInsights: {
          spendingPatterns: {
            categories: {
              'Food': 40,
              'Transport': 25,
              'Utilities': 20,
              'Entertainment': 15
            },
            trends: 'Stable spending patterns'
          },
          incomePredictions: {
            nextMonth: Math.floor(user.statistics.totalEarnings / 12) * 1.1,
            confidence: 'High'
          },
          riskAssessment: {
            overallRisk: 'Low',
            factors: ['Stable income', 'Good payment history']
          },
          creditworthinessTrend: 'improving'
        },
        eligibilityProfile: {
          maxLoanAmount: Math.floor(user.statistics.totalEarnings / 12) * 3,
          interestRate: 12,
          maxTermMonths: 18,
          eligibleLoanTypes: ['personal', 'business'],
          restrictions: []
        }
      });
      
      await creditScore.save();
    }
    console.log(`✅ Created credit scores for ${createdUsers.length} users`);

  } catch (error) {
    console.error('❌ Failed to initialize sample data:', error);
    throw error;
  }
}

// Main initialization function
async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Initialize badges
    await initializeBadges();
    
    // Initialize sample data
    if (process.env.SEED_DATABASE === 'true') {
      await initializeSampleData();
    }
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase,
  initializeBadges,
  initializeSampleData
};