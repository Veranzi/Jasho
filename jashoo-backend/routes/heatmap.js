const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const { logger } = require('../middleware/cybersecurity');
const { Job } = require('../models/Jobs');

const router = express.Router();

// Job categories with colors and icons for heatmap
const JOB_CATEGORIES = {
  'Boda Boda': { color: '#FF6B6B', icon: '🏍️', intensity: 1.0 },
  'Mama Fua': { color: '#4ECDC4', icon: '👩‍💼', intensity: 0.8 },
  'Delivery': { color: '#45B7D1', icon: '📦', intensity: 0.9 },
  'Cleaning': { color: '#96CEB4', icon: '🧹', intensity: 0.7 },
  'Construction': { color: '#FFEAA7', icon: '🔨', intensity: 0.6 },
  'Gardening': { color: '#DDA0DD', icon: '🌱', intensity: 0.5 },
  'Other': { color: '#98D8C8', icon: '💼', intensity: 0.4 }
};

// Major areas in Kenya with coordinates
const KENYA_AREAS = {
  'Nairobi': {
    coordinates: { latitude: -1.2921, longitude: 36.8219 },
    districts: ['CBD', 'Westlands', 'Kilimani', 'Karen', 'Runda', 'Kasarani', 'Eastleigh']
  },
  'Mombasa': {
    coordinates: { latitude: -4.0435, longitude: 39.6682 },
    districts: ['Mombasa Island', 'Nyali', 'Bamburi', 'Diani']
  },
  'Kisumu': {
    coordinates: { latitude: -0.0917, longitude: 34.7680 },
    districts: ['Kisumu Central', 'Kondele', 'Mamboleo']
  },
  'Nakuru': {
    coordinates: { latitude: -0.3072, longitude: 36.0800 },
    districts: ['Nakuru Town', 'Lanet', 'Kiamunyi']
  },
  'Eldoret': {
    coordinates: { latitude: 0.5143, longitude: 35.2698 },
    districts: ['Eldoret Central', 'Langas', 'Huruma']
  },
  'Thika': {
    coordinates: { latitude: -1.0333, longitude: 37.0833 },
    districts: ['Thika Town', 'Makongeni', 'Kiganjo']
  },
  'Malindi': {
    coordinates: { latitude: -3.2175, longitude: 40.1191 },
    districts: ['Malindi Town', 'Watamu', 'Kilifi']
  },
  'Nyeri': {
    coordinates: { latitude: -0.4201, longitude: 36.9476 },
    districts: ['Nyeri Town', 'Karatina', 'Mukurwe-ini']
  },
  'Meru': {
    coordinates: { latitude: 0.0463, longitude: 37.6559 },
    districts: ['Meru Town', 'Maua', 'Chuka']
  },
  'Kakamega': {
    coordinates: { latitude: 0.2827, longitude: 34.7519 },
    districts: ['Kakamega Town', 'Mumias', 'Butere']
  }
};

// Get job heatmap data
router.get('/jobs', optionalAuth, validatePagination, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      category, 
      location, 
      minPrice, 
      maxPrice,
      limit = 1000
    } = req.query;

    // Build query
    const query = {
      status: { $in: ['active', 'completed'] }
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (category) query.category = category;
    if (location) query['location.city'] = new RegExp(location, 'i');
    if (minPrice || maxPrice) {
      query.priceKes = {};
      if (minPrice) query.priceKes.$gte = parseFloat(minPrice);
      if (maxPrice) query.priceKes.$lte = parseFloat(maxPrice);
    }

    // Get jobs
    const jobs = await Job.find(query)
      .limit(parseInt(limit))
      .select('location category priceKes createdAt status');

    // Process jobs for heatmap
    const heatmapData = processJobsForHeatmap(jobs);

    // Generate statistics
    const statistics = generateHeatmapStatistics(jobs);

    res.json({
      success: true,
      data: {
        heatmap: heatmapData,
        statistics,
        filters: {
          startDate,
          endDate,
          category,
          location,
          minPrice,
          maxPrice
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Get heatmap data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get heatmap data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'HEATMAP_ERROR'
    });
  }
});

// Get job density by area
router.get('/density', optionalAuth, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Get jobs by area
    const jobs = await Job.find({
      createdAt: { $gte: startDate },
      status: { $in: ['active', 'completed'] }
    }).select('location.city category priceKes');

    // Calculate density by area
    const densityData = {};
    
    Object.keys(KENYA_AREAS).forEach(area => {
      const areaJobs = jobs.filter(job => 
        job.location.city.toLowerCase().includes(area.toLowerCase())
      );
      
      densityData[area] = {
        totalJobs: areaJobs.length,
        averagePrice: areaJobs.length > 0 ? 
          areaJobs.reduce((sum, job) => sum + job.priceKes, 0) / areaJobs.length : 0,
        categories: calculateCategoryDistribution(areaJobs),
        coordinates: KENYA_AREAS[area].coordinates,
        districts: KENYA_AREAS[area].districts
      };
    });

    res.json({
      success: true,
      data: {
        density: densityData,
        period: parseInt(period),
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Get density data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get density data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'DENSITY_ERROR'
    });
  }
});

// Get category distribution
router.get('/categories', optionalAuth, async (req, res) => {
  try {
    const { period = '30', location } = req.query;
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    const query = {
      createdAt: { $gte: startDate },
      status: { $in: ['active', 'completed'] }
    };

    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }

    const jobs = await Job.find(query).select('category priceKes location.city');

    // Calculate category distribution
    const categoryData = {};
    
    Object.keys(JOB_CATEGORIES).forEach(category => {
      const categoryJobs = jobs.filter(job => job.category === category);
      
      categoryData[category] = {
        count: categoryJobs.length,
        percentage: jobs.length > 0 ? (categoryJobs.length / jobs.length) * 100 : 0,
        averagePrice: categoryJobs.length > 0 ? 
          categoryJobs.reduce((sum, job) => sum + job.priceKes, 0) / categoryJobs.length : 0,
        totalValue: categoryJobs.reduce((sum, job) => sum + job.priceKes, 0),
        color: JOB_CATEGORIES[category].color,
        icon: JOB_CATEGORIES[category].icon,
        intensity: JOB_CATEGORIES[category].intensity
      };
    });

    res.json({
      success: true,
      data: {
        categories: categoryData,
        period: parseInt(period),
        location: location || 'All',
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Get category data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'CATEGORY_ERROR'
    });
  }
});

// Get trending areas
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const now = new Date();
    const currentPeriod = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);
    const previousPeriod = new Date(currentPeriod.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Get current period jobs
    const currentJobs = await Job.find({
      createdAt: { $gte: currentPeriod },
      status: { $in: ['active', 'completed'] }
    }).select('location.city category priceKes');

    // Get previous period jobs
    const previousJobs = await Job.find({
      createdAt: { $gte: previousPeriod, $lt: currentPeriod },
      status: { $in: ['active', 'completed'] }
    }).select('location.city category priceKes');

    // Calculate trending areas
    const trendingData = {};
    
    Object.keys(KENYA_AREAS).forEach(area => {
      const currentAreaJobs = currentJobs.filter(job => 
        job.location.city.toLowerCase().includes(area.toLowerCase())
      );
      const previousAreaJobs = previousJobs.filter(job => 
        job.location.city.toLowerCase().includes(area.toLowerCase())
      );

      const currentCount = currentAreaJobs.length;
      const previousCount = previousAreaJobs.length;
      
      const growthRate = previousCount > 0 ? 
        ((currentCount - previousCount) / previousCount) * 100 : 
        currentCount > 0 ? 100 : 0;

      trendingData[area] = {
        currentJobs: currentCount,
        previousJobs: previousCount,
        growthRate,
        trend: growthRate > 20 ? 'hot' : growthRate > 0 ? 'rising' : growthRate < -20 ? 'cooling' : 'stable',
        coordinates: KENYA_AREAS[area].coordinates,
        categories: calculateCategoryDistribution(currentAreaJobs)
      };
    });

    // Sort by growth rate
    const sortedTrending = Object.entries(trendingData)
      .sort(([,a], [,b]) => b.growthRate - a.growthRate)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        trending: Object.fromEntries(sortedTrending),
        period: parseInt(period),
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Get trending data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'TRENDING_ERROR'
    });
  }
});

// Helper functions
function processJobsForHeatmap(jobs) {
  const heatmapPoints = [];
  const areaJobCounts = {};

  jobs.forEach(job => {
    const area = findAreaInfo(job.location.city);
    if (!area) return;

    const areaKey = area.name;
    areaJobCounts[areaKey] = (areaJobCounts[areaKey] || 0) + 1;

    heatmapPoints.push({
      id: job._id.toString(),
      coordinates: area.coordinates,
      category: job.category,
      price: job.priceKes,
      intensity: getIntensityLevel(job.priceKes),
      color: JOB_CATEGORIES[job.category]?.color || '#98D8C8',
      icon: JOB_CATEGORIES[job.category]?.icon || '💼',
      area: area.name,
      district: job.location.city,
      createdAt: job.createdAt
    });
  });

  return {
    points: heatmapPoints,
    areaCounts: areaJobCounts,
    totalJobs: jobs.length
  };
}

function generateHeatmapStatistics(jobs) {
  const stats = {
    totalJobs: jobs.length,
    averagePrice: jobs.length > 0 ? 
      jobs.reduce((sum, job) => sum + job.priceKes, 0) / jobs.length : 0,
    priceRange: {
      min: jobs.length > 0 ? Math.min(...jobs.map(job => job.priceKes)) : 0,
      max: jobs.length > 0 ? Math.max(...jobs.map(job => job.priceKes)) : 0
    },
    categoryDistribution: calculateCategoryDistribution(jobs),
    areaDistribution: {},
    timeDistribution: {}
  };

  // Area distribution
  Object.keys(KENYA_AREAS).forEach(area => {
    const areaJobs = jobs.filter(job => 
      job.location.city.toLowerCase().includes(area.toLowerCase())
    );
    stats.areaDistribution[area] = areaJobs.length;
  });

  // Time distribution (by hour)
  jobs.forEach(job => {
    const hour = job.createdAt.getHours();
    stats.timeDistribution[hour] = (stats.timeDistribution[hour] || 0) + 1;
  });

  return stats;
}

function findAreaInfo(cityName) {
  const lowerCity = cityName.toLowerCase();
  
  for (const [areaName, areaData] of Object.entries(KENYA_AREAS)) {
    if (lowerCity.includes(areaName.toLowerCase())) {
      return {
        name: areaName,
        coordinates: areaData.coordinates,
        districts: areaData.districts
      };
    }
  }
  
  return null;
}

function getIntensityLevel(price) {
  if (price >= 2000) return 1.0;
  if (price >= 1000) return 0.8;
  if (price >= 500) return 0.6;
  if (price >= 200) return 0.4;
  return 0.2;
}

function calculateCategoryDistribution(jobs) {
  const distribution = {};
  
  Object.keys(JOB_CATEGORIES).forEach(category => {
    const categoryJobs = jobs.filter(job => job.category === category);
    distribution[category] = {
      count: categoryJobs.length,
      percentage: jobs.length > 0 ? (categoryJobs.length / jobs.length) * 100 : 0,
      averagePrice: categoryJobs.length > 0 ? 
        categoryJobs.reduce((sum, job) => sum + job.priceKes, 0) / categoryJobs.length : 0
    };
  });
  
  return distribution;
}

function calculateDensity(jobs, area) {
  const areaJobs = jobs.filter(job => 
    job.location.city.toLowerCase().includes(area.toLowerCase())
  );
  
  return {
    count: areaJobs.length,
    density: areaJobs.length / KENYA_AREAS[area]?.districts.length || 1,
    averagePrice: areaJobs.length > 0 ? 
      areaJobs.reduce((sum, job) => sum + job.priceKes, 0) / areaJobs.length : 0
  };
}

module.exports = router;