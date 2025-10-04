const express = require('express');
const { Job } = require('../models/Job');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// Job categories with colors for heatmap
const JOB_CATEGORIES = {
  'Boda Boda': {
    color: '#FF6B6B',
    icon: '🏍️',
    description: 'Motorcycle delivery and transport services'
  },
  'Mama Fua': {
    color: '#4ECDC4',
    icon: '🧺',
    description: 'Laundry and cleaning services'
  },
  'Delivery': {
    color: '#45B7D1',
    icon: '📦',
    description: 'Package and food delivery'
  },
  'Cleaning': {
    color: '#96CEB4',
    icon: '🧽',
    description: 'House and office cleaning'
  },
  'Other': {
    color: '#FECA57',
    icon: '🔧',
    description: 'Other gig work services'
  }
};

// Geographic areas in Kenya
const KENYA_AREAS = {
  'Nairobi': {
    coordinates: { lat: -1.2921, lng: 36.8219 },
    districts: ['CBD', 'Westlands', 'Eastleigh', 'Kasarani', 'Ruaraka', 'Embakasi']
  },
  'Mombasa': {
    coordinates: { lat: -4.0435, lng: 39.6682 },
    districts: ['Mvita', 'Changamwe', 'Kisauni', 'Nyali', 'Likoni']
  },
  'Kisumu': {
    coordinates: { lat: -0.0917, lng: 34.7680 },
    districts: ['Kisumu Central', 'Kisumu East', 'Kisumu West']
  },
  'Nakuru': {
    coordinates: { lat: -0.3072, lng: 36.0800 },
    districts: ['Nakuru Town', 'Nakuru East', 'Nakuru West']
  },
  'Eldoret': {
    coordinates: { lat: 0.5143, lng: 35.2698 },
    districts: ['Eldoret Central', 'Eldoret East', 'Eldoret West']
  }
};

// Generate heatmap data
router.get('/jobs', optionalAuth, validatePagination, async (req, res) => {
  try {
    const { 
      timeRange = '7d', // 7d, 30d, 90d
      category = 'all',
      location = 'all'
    } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build query
    const query = {
      createdAt: { $gte: startDate },
      status: { $in: ['pending', 'inProgress'] }
    };

    if (category !== 'all') {
      query.category = category;
    }

    if (location !== 'all') {
      query.location = new RegExp(location, 'i');
    }

    // Get jobs with location data
    const jobs = await Job.find(query)
      .select('location category priceKes createdAt status')
      .sort({ createdAt: -1 });

    // Process jobs for heatmap
    const heatmapData = processJobsForHeatmap(jobs);
    
    // Generate statistics
    const statistics = generateHeatmapStatistics(jobs, timeRange);

    res.json({
      success: true,
      data: {
        heatmapData,
        statistics,
        categories: JOB_CATEGORIES,
        areas: KENYA_AREAS,
        timeRange,
        filters: { category, location },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Heatmap generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate heatmap data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get job density by area
router.get('/density', optionalAuth, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get job density by area
    const densityData = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['pending', 'inProgress'] }
        }
      },
      {
        $group: {
          _id: '$location',
          jobCount: { $sum: 1 },
          avgPrice: { $avg: '$priceKes' },
          categories: { $addToSet: '$category' },
          totalValue: { $sum: '$priceKes' }
        }
      },
      {
        $sort: { jobCount: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Map density data with coordinates
    const mappedDensity = densityData.map(area => {
      const areaInfo = findAreaInfo(area._id);
      return {
        location: area._id,
        coordinates: areaInfo.coordinates,
        jobCount: area.jobCount,
        avgPrice: Math.round(area.avgPrice),
        categories: area.categories,
        totalValue: area.totalValue,
        density: calculateDensity(area.jobCount, areaInfo.districts?.length || 1),
        intensity: getIntensityLevel(area.jobCount)
      };
    });

    res.json({
      success: true,
      data: {
        densityData: mappedDensity,
        timeRange,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Density calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate job density',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get category distribution
router.get('/categories', optionalAuth, async (req, res) => {
  try {
    const { timeRange = '7d', location = 'all' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build query
    const query = {
      createdAt: { $gte: startDate },
      status: { $in: ['pending', 'inProgress'] }
    };

    if (location !== 'all') {
      query.location = new RegExp(location, 'i');
    }

    // Get category distribution
    const categoryData = await Job.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$priceKes' },
          totalValue: { $sum: '$priceKes' },
          locations: { $addToSet: '$location' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Enhance with category info
    const enhancedCategoryData = categoryData.map(category => ({
      category: category._id,
      count: category.count,
      avgPrice: Math.round(category.avgPrice),
      totalValue: category.totalValue,
      locations: category.locations.length,
      ...JOB_CATEGORIES[category._id] || JOB_CATEGORIES['Other']
    }));

    res.json({
      success: true,
      data: {
        categories: enhancedCategoryData,
        timeRange,
        location,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Category distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category distribution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get trending areas
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;

    // Calculate date ranges for comparison
    const now = new Date();
    let currentStart, previousStart;
    
    switch (timeRange) {
      case '7d':
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      default:
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    }

    // Get current period data
    const currentData = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: currentStart },
          status: { $in: ['pending', 'inProgress'] }
        }
      },
      {
        $group: {
          _id: '$location',
          currentCount: { $sum: 1 },
          currentValue: { $sum: '$priceKes' }
        }
      }
    ]);

    // Get previous period data
    const previousData = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: previousStart, $lt: currentStart },
          status: { $in: ['pending', 'inProgress'] }
        }
      },
      {
        $group: {
          _id: '$location',
          previousCount: { $sum: 1 },
          previousValue: { $sum: '$priceKes' }
        }
      }
    ]);

    // Calculate trends
    const trendingAreas = currentData.map(current => {
      const previous = previousData.find(p => p._id === current._id);
      const previousCount = previous ? previous.previousCount : 0;
      const previousValue = previous ? previous.previousValue : 0;
      
      const countGrowth = previousCount > 0 ? 
        ((current.currentCount - previousCount) / previousCount) * 100 : 100;
      
      const valueGrowth = previousValue > 0 ? 
        ((current.currentValue - previousValue) / previousValue) * 100 : 100;

      return {
        location: current._id,
        currentCount: current.currentCount,
        previousCount,
        countGrowth: Math.round(countGrowth),
        currentValue: current.currentValue,
        previousValue,
        valueGrowth: Math.round(valueGrowth),
        trend: countGrowth > 20 ? 'hot' : countGrowth > 0 ? 'rising' : 'cooling',
        areaInfo: findAreaInfo(current._id)
      };
    }).sort((a, b) => b.countGrowth - a.countGrowth);

    res.json({
      success: true,
      data: {
        trendingAreas: trendingAreas.slice(0, 10), // Top 10 trending
        timeRange,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Trending areas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending areas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper functions
function processJobsForHeatmap(jobs) {
  const heatmapPoints = [];
  const locationStats = {};

  jobs.forEach(job => {
    const areaInfo = findAreaInfo(job.location);
    
    if (areaInfo.coordinates) {
      // Add heatmap point
      heatmapPoints.push({
        lat: areaInfo.coordinates.lat + (Math.random() - 0.5) * 0.01, // Add some randomness
        lng: areaInfo.coordinates.lng + (Math.random() - 0.5) * 0.01,
        intensity: getIntensityLevel(job.priceKes),
        category: job.category,
        price: job.priceKes,
        location: job.location
      });

      // Update location stats
      if (!locationStats[job.location]) {
        locationStats[job.location] = {
          location: job.location,
          coordinates: areaInfo.coordinates,
          jobCount: 0,
          totalValue: 0,
          categories: new Set(),
          avgPrice: 0
        };
      }

      locationStats[job.location].jobCount++;
      locationStats[job.location].totalValue += job.priceKes;
      locationStats[job.location].categories.add(job.category);
    }
  });

  // Calculate averages
  Object.values(locationStats).forEach(stat => {
    stat.avgPrice = Math.round(stat.totalValue / stat.jobCount);
    stat.categories = Array.from(stat.categories);
  });

  return {
    heatmapPoints,
    locationStats: Object.values(locationStats)
  };
}

function generateHeatmapStatistics(jobs, timeRange) {
  const totalJobs = jobs.length;
  const totalValue = jobs.reduce((sum, job) => sum + job.priceKes, 0);
  const avgPrice = totalJobs > 0 ? Math.round(totalValue / totalJobs) : 0;
  
  const categoryBreakdown = {};
  const locationBreakdown = {};

  jobs.forEach(job => {
    // Category breakdown
    categoryBreakdown[job.category] = (categoryBreakdown[job.category] || 0) + 1;
    
    // Location breakdown
    locationBreakdown[job.location] = (locationBreakdown[job.location] || 0) + 1;
  });

  const topCategory = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)[0];
  
  const topLocation = Object.entries(locationBreakdown)
    .sort(([,a], [,b]) => b - a)[0];

  return {
    totalJobs,
    totalValue,
    avgPrice,
    topCategory: topCategory ? { category: topCategory[0], count: topCategory[1] } : null,
    topLocation: topLocation ? { location: topLocation[0], count: topLocation[1] } : null,
    uniqueLocations: Object.keys(locationBreakdown).length,
    uniqueCategories: Object.keys(categoryBreakdown).length
  };
}

function findAreaInfo(location) {
  // Try to match location with known areas
  for (const [area, info] of Object.entries(KENYA_AREAS)) {
    if (location.toLowerCase().includes(area.toLowerCase())) {
      return info;
    }
    
    // Check districts
    for (const district of info.districts) {
      if (location.toLowerCase().includes(district.toLowerCase())) {
        return {
          ...info,
          district
        };
      }
    }
  }

  // Default coordinates for unmatched locations
  return {
    coordinates: { lat: -1.2921, lng: 36.8219 }, // Default to Nairobi
    districts: []
  };
}

function getIntensityLevel(price) {
  if (price >= 2000) return 'high';
  if (price >= 1000) return 'medium';
  return 'low';
}

function calculateDensity(jobCount, areaSize) {
  return Math.round(jobCount / areaSize);
}

module.exports = router;