const mongoose = require('mongoose');
const { Badge } = require('../models/Gamification');
require('dotenv').config();

// Initialize default badges
async function initializeBadges() {
  try {
    console.log('Initializing default badges...');

    const defaultBadges = [
      {
        id: 'first_job',
        name: 'First Job',
        description: 'Complete your first job',
        category: 'earning',
        pointsRequired: 100,
        icon: '🎯'
      },
      {
        id: 'first_saving',
        name: 'First Saver',
        description: 'Make your first savings contribution',
        category: 'saving',
        pointsRequired: 200,
        icon: '💰'
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day login streak',
        category: 'streak',
        pointsRequired: 150,
        icon: '🔥'
      },
      {
        id: 'streak_30',
        name: 'Month Master',
        description: 'Maintain a 30-day login streak',
        category: 'streak',
        pointsRequired: 500,
        icon: '🏆'
      },
      {
        id: 'level_5',
        name: 'Level 5',
        description: 'Reach level 5',
        category: 'milestone',
        pointsRequired: 300,
        icon: '⭐'
      },
      {
        id: 'level_10',
        name: 'Level 10',
        description: 'Reach level 10',
        category: 'milestone',
        pointsRequired: 1000,
        icon: '🌟'
      },
      {
        id: 'earner_1000',
        name: 'Big Earner',
        description: 'Earn 1000 KES total',
        category: 'earning',
        pointsRequired: 400,
        icon: '💵'
      },
      {
        id: 'saver_5000',
        name: 'Super Saver',
        description: 'Save 5000 KES total',
        category: 'saving',
        pointsRequired: 800,
        icon: '🏦'
      },
      {
        id: 'job_master',
        name: 'Job Master',
        description: 'Complete 50 jobs',
        category: 'milestone',
        pointsRequired: 600,
        icon: '👑'
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete 5 jobs before 8 AM',
        category: 'special',
        pointsRequired: 300,
        icon: '🐦'
      }
    ];

    for (const badgeData of defaultBadges) {
      const existingBadge = await Badge.findOne({ id: badgeData.id });
      if (!existingBadge) {
        const badge = new Badge(badgeData);
        await badge.save();
        console.log(`Created badge: ${badge.name}`);
      } else {
        console.log(`Badge already exists: ${badgeData.name}`);
      }
    }

    console.log('Default badges initialized successfully!');
  } catch (error) {
    console.error('Error initializing badges:', error);
    throw error;
  }
}

// Initialize sample data for development
async function initializeSampleData() {
  try {
    console.log('Initializing sample data...');

    const User = require('../models/User');
    const { Wallet } = require('../models/Wallet');
    const { Gamification } = require('../models/Gamification');

    // Create sample users
    const sampleUsers = [
      {
        userId: 'demo-user-1',
        email: 'john@example.com',
        phoneNumber: '+254712345678',
        password: 'password123',
        fullName: 'John Doe',
        skills: ['Boda Rider', 'Delivery'],
        location: 'Nairobi, Westlands',
        rating: 4.6,
        isVerified: true,
        kyc: {
          idType: 'ID',
          idNumber: '12345678',
          verifiedAt: new Date()
        }
      },
      {
        userId: 'demo-user-2',
        email: 'mary@example.com',
        phoneNumber: '+254712345679',
        password: 'password123',
        fullName: 'Mary Wanjiku',
        skills: ['Mama Fua', 'Cleaning'],
        location: 'Nairobi, Eastleigh',
        rating: 4.8,
        isVerified: true,
        kyc: {
          idType: 'ID',
          idNumber: '87654321',
          verifiedAt: new Date()
        }
      }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ userId: userData.userId });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();

        // Create wallet
        const wallet = new Wallet({
          userId: user.userId,
          kesBalance: 5000,
          usdtBalance: 50
        });
        await wallet.save();

        // Create gamification profile
        const gamification = new Gamification({
          userId: user.userId,
          points: 500,
          level: 2,
          loginStreakDays: 5
        });
        await gamification.save();

        console.log(`Created sample user: ${user.fullName}`);
      }
    }

    console.log('Sample data initialized successfully!');
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
}

// Main initialization function
async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Initialize badges
    await initializeBadges();

    // Initialize sample data if in development
    if (process.env.NODE_ENV === 'development') {
      await initializeSampleData();
    }

    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase,
  initializeBadges,
  initializeSampleData
};