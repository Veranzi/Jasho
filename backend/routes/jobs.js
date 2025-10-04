const express = require('express');
const { Job, JobApplication } = require('../models/Job');
const { Wallet, Transaction } = require('../models/Wallet');
const { Gamification } = require('../models/Gamification');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validateJobPost, validateJobApplication, validateJobReview, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all jobs (with pagination and filters)
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.location) filter.location = new RegExp(req.query.location, 'i');
    if (req.query.minPrice) filter.priceKes = { $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) filter.priceKes = { ...filter.priceKes, $lte: parseFloat(req.query.maxPrice) };

    const jobs = await Job.find(filter)
      .populate('postedBy', 'userId fullName rating')
      .populate('assignedTo', 'userId fullName rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(filter);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get job by ID
router.get('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'userId fullName rating location')
      .populate('assignedTo', 'userId fullName rating location');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get applications count
    const applicationsCount = await JobApplication.countDocuments({ jobId: job._id });

    res.json({
      success: true,
      data: {
        job: {
          ...job.toObject(),
          applicationsCount
        }
      }
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Post a new job
router.post('/', authenticateToken, requireVerification, validateJobPost, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user.userId
    };

    const job = new Job(jobData);
    await job.save();

    await job.populate('postedBy', 'userId fullName rating');

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: {
        job
      }
    });
  } catch (error) {
    console.error('Post job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Apply for a job
router.post('/:id/apply', authenticateToken, requireVerification, validateObjectId, validateJobApplication, async (req, res) => {
  try {
    const jobId = req.params.id;
    const { message, proposedPrice } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user already applied
    const existingApplication = await JobApplication.findOne({
      jobId,
      applicantId: req.user.userId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Check if job is still available
    if (job.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Job is no longer available'
      });
    }

    const application = new JobApplication({
      jobId,
      applicantId: req.user.userId,
      message,
      proposedPrice
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get job applications
router.get('/:id/applications', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const jobId = req.params.id;

    // Check if job exists and user is the poster
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.postedBy !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const applications = await JobApplication.find({ jobId })
      .populate('applicantId', 'userId fullName rating skills location')
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      data: {
        applications
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Accept job application
router.post('/:id/accept/:applicationId', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const jobId = req.params.id;
    const applicationId = req.params.applicationId;

    // Check if job exists and user is the poster
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.postedBy !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Job is no longer available'
      });
    }

    // Check if application exists
    const application = await JobApplication.findById(applicationId);
    if (!application || application.jobId.toString() !== jobId) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update job status and assign to applicant
    job.assignedTo = application.applicantId;
    job.status = 'inProgress';
    await job.save();

    // Update application status
    application.status = 'accepted';
    await application.save();

    // Reject other applications
    await JobApplication.updateMany(
      { jobId, _id: { $ne: applicationId } },
      { status: 'rejected' }
    );

    res.json({
      success: true,
      message: 'Application accepted successfully',
      data: {
        job,
        application
      }
    });
  } catch (error) {
    console.error('Accept application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Complete job
router.post('/:id/complete', authenticateToken, validateObjectId, validateJobReview, async (req, res) => {
  try {
    const jobId = req.params.id;
    const { rating, review } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is assigned to the job
    if (job.assignedTo !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (job.status !== 'inProgress') {
      return res.status(400).json({
        success: false,
        message: 'Job is not in progress'
      });
    }

    // Complete the job
    await job.complete(rating, review);

    // Update gamification
    const gamification = await Gamification.findOne({ userId: req.user.userId });
    if (gamification) {
      await gamification.completeJob();
      await gamification.updateEarnings(job.priceKes);
    }

    // Create earning transaction
    let wallet = await Wallet.findOne({ userId: req.user.userId });
    if (!wallet) {
      wallet = new Wallet({
        userId: req.user.userId,
        kesBalance: 0,
        usdtBalance: 0
      });
    }

    await wallet.updateBalance(job.priceKes, 'KES', 'earning');

    const transaction = new Transaction({
      userId: req.user.userId,
      type: 'earning',
      amount: job.priceKes,
      currencyCode: 'KES',
      status: 'Success',
      description: `Earning from job: ${job.title}`,
      category: 'Earning',
      hustle: job.category,
      reference: `JOB_${jobId}_${Date.now()}`
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Job completed successfully',
      data: {
        job,
        transaction
      }
    });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's jobs (posted or assigned)
router.get('/user/:type', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { type } = req.params; // 'posted' or 'assigned'
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    if (type === 'posted') {
      filter.postedBy = req.user.userId;
    } else if (type === 'assigned') {
      filter.assignedTo = req.user.userId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Use "posted" or "assigned"'
      });
    }

    const jobs = await Job.find(filter)
      .populate('postedBy', 'userId fullName rating')
      .populate('assignedTo', 'userId fullName rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(filter);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's applications
router.get('/applications/my', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const applications = await JobApplication.find({ applicantId: req.user.userId })
      .populate('jobId')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobApplication.countDocuments({ applicantId: req.user.userId });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Cancel job
router.post('/:id/cancel', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const jobId = req.params.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the poster
    if (job.postedBy !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (job.status === 'completed' || job.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or paid job'
      });
    }

    // Update job status
    job.status = 'cancelled';
    await job.save();

    // Update applications status
    await JobApplication.updateMany(
      { jobId },
      { status: 'rejected' }
    );

    res.json({
      success: true,
      message: 'Job cancelled successfully',
      data: {
        job
      }
    });
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;