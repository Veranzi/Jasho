const express = require('express');
const { Job, JobApplication } = require('../models/Jobs');
const { Transaction } = require('../models/Wallet');
const { Gamification } = require('../models/Gamification');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validateJobPost, validateJobApplication, validateJobReview, validatePagination, validateSearchQuery } = require('../middleware/validation');
const { logger } = require('../middleware/cybersecurity');

const router = express.Router();

// Get all jobs - matches Flutter JobsProvider.jobs
router.get('/', authenticateToken, validatePagination, validateSearchQuery, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      location, 
      minPrice, 
      maxPrice, 
      urgency,
      q: searchQuery,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      category,
      location,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      urgency
    };

    let jobs;
    if (searchQuery) {
      jobs = await Job.searchJobs(searchQuery, options);
    } else {
      jobs = await Job.findActiveJobs(options);
    }

    // Convert to Flutter JobItem format
    const formattedJobs = jobs.map(job => ({
      id: job.jobId,
      title: job.title,
      description: job.description,
      location: job.location.address,
      priceKes: job.priceKes,
      status: mapJobStatus(job.status),
      rating: job.rating,
      review: job.review,
      // Additional fields for Flutter
      category: job.category,
      urgency: job.urgency,
      estimatedDuration: job.estimatedDuration,
      postedBy: job.postedBy,
      assignedTo: job.assignedTo,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
      applicationCount: job.applicationCount,
      maxApplications: job.maxApplications,
      featured: job.featured,
      images: job.images,
      requirements: job.requirements,
      skills: job.skills
    }));

    res.json({
      success: true,
      data: {
        jobs: formattedJobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: formattedJobs.length
        }
      }
    });
  } catch (error) {
    logger.error('Get jobs error', {
      userId: req.user?.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_JOBS_ERROR'
    });
  }
});

// Get job by ID - matches Flutter JobsProvider.getById()
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({ jobId: id });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Increment views
    await job.incrementViews();

    // Convert to Flutter JobItem format
    const formattedJob = {
      id: job.jobId,
      title: job.title,
      description: job.description,
      location: job.location.address,
      priceKes: job.priceKes,
      status: mapJobStatus(job.status),
      rating: job.rating,
      review: job.review,
      // Additional fields
      category: job.category,
      urgency: job.urgency,
      estimatedDuration: job.estimatedDuration,
      postedBy: job.postedBy,
      assignedTo: job.assignedTo,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
      applicationCount: job.applicationCount,
      maxApplications: job.maxApplications,
      featured: job.featured,
      images: job.images,
      requirements: job.requirements,
      skills: job.skills,
      schedule: job.schedule,
      statistics: job.statistics
    };

    res.json({
      success: true,
      data: {
        job: formattedJob
      }
    });
  } catch (error) {
    logger.error('Get job error', {
      jobId: req.params.id,
      userId: req.user?.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_JOB_ERROR'
    });
  }
});

// Post new job - matches Flutter JobsProvider.postJob()
router.post('/', authenticateToken, requireVerification, validateJobPost, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user.userId,
      status: 'active'
    };

    const job = new Job(jobData);
    await job.save();

    // Convert to Flutter JobItem format
    const formattedJob = {
      id: job.jobId,
      title: job.title,
      description: job.description,
      location: job.location.address,
      priceKes: job.priceKes,
      status: mapJobStatus(job.status),
      rating: job.rating,
      review: job.review,
      category: job.category,
      urgency: job.urgency,
      estimatedDuration: job.estimatedDuration,
      postedBy: job.postedBy,
      assignedTo: job.assignedTo,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
      applicationCount: job.applicationCount,
      maxApplications: job.maxApplications,
      featured: job.featured,
      images: job.images,
      requirements: job.requirements,
      skills: job.skills
    };

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: {
        job: formattedJob
      }
    });
  } catch (error) {
    logger.error('Post job error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to post job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'POST_JOB_ERROR'
    });
  }
});

// Apply for job - matches Flutter JobsProvider.applyForJob()
router.post('/:id/apply', authenticateToken, requireVerification, validateJobApplication, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, proposedPrice, estimatedDuration } = req.body;

    const job = await Job.findOne({ jobId: id });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    if (!job.canApply) {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply for this job',
        code: 'CANNOT_APPLY'
      });
    }

    // Check if user already applied
    const existingApplication = await JobApplication.findOne({
      jobId: job._id,
      applicantId: req.user.userId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Already applied for this job',
        code: 'ALREADY_APPLIED'
      });
    }

    // Create application
    const application = new JobApplication({
      jobId: job._id,
      applicantId: req.user.userId,
      message,
      proposedPrice,
      estimatedDuration,
      status: 'pending'
    });

    await application.save();

    // Add application to job
    await job.addApplication(application._id);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application: {
          applicationId: application.applicationId,
          jobId: job.jobId,
          applicantId: req.user.userId,
          status: application.status,
          message: application.message,
          proposedPrice: application.proposedPrice,
          estimatedDuration: application.estimatedDuration,
          appliedAt: application.appliedAt
        }
      }
    });
  } catch (error) {
    logger.error('Apply for job error', {
      jobId: req.params.id,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to apply for job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'APPLY_JOB_ERROR'
    });
  }
});

// Get job applications
router.get('/:id/applications', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const job = await Job.findOne({ jobId: id });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Check if user owns the job
    if (job.postedBy !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const applications = await JobApplication.findByJob(job._id, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      status
    });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: applications.length
        }
      }
    });
  } catch (error) {
    logger.error('Get job applications error', {
      jobId: req.params.id,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_APPLICATIONS_ERROR'
    });
  }
});

// Accept application
router.post('/:id/accept/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { id, applicationId } = req.params;

    const job = await Job.findOne({ jobId: id });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Check if user owns the job
    if (job.postedBy !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const application = await JobApplication.findOne({
      applicationId,
      jobId: job._id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND'
      });
    }

    // Accept application
    await application.accept(req.user.userId, 'Application accepted');

    // Assign job to applicant
    await job.assignTo(application.applicantId);

    res.json({
      success: true,
      message: 'Application accepted successfully',
      data: {
        application: {
          applicationId: application.applicationId,
          status: application.status,
          reviewedAt: application.reviewedAt
        },
        job: {
          id: job.jobId,
          status: job.status,
          assignedTo: job.assignedTo
        }
      }
    });
  } catch (error) {
    logger.error('Accept application error', {
      jobId: req.params.id,
      applicationId: req.params.applicationId,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to accept application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'ACCEPT_APPLICATION_ERROR'
    });
  }
});

// Complete job - matches Flutter JobsProvider.updateStatus() and addReview()
router.post('/:id/complete', authenticateToken, validateJobReview, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review, completionNotes, completionImages } = req.body;

    const job = await Job.findOne({ jobId: id });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Check if user owns the job or is assigned to it
    if (job.postedBy !== req.user.userId && job.assignedTo !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Complete the job
    await job.complete(rating, review, completionNotes, completionImages);

    // Create earning transaction for the assigned user
    if (job.assignedTo) {
      const earningTransaction = new Transaction({
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: job.assignedTo,
        type: 'earning',
        amount: job.priceKes,
        currencyCode: 'KES',
        description: `Earning from job: ${job.title}`,
        category: 'Earning',
        method: 'job',
        jobId: job._id,
        source: 'job',
        destination: 'wallet',
        status: 'completed',
        processingStatus: 'confirmed',
        initiatedAt: new Date(),
        completedAt: new Date(),
        metadata: {
          jobId: job.jobId,
          jobTitle: job.title,
          rating: rating,
          review: review
        }
      });

      await earningTransaction.save();

      // Update wallet balance
      const { Wallet } = require('../models/Wallet');
      const wallet = await Wallet.findByUserId(job.assignedTo);
      if (wallet) {
        await wallet.updateBalance(job.priceKes, 'KES', 'earning');
      }

      // Update gamification
      const gamification = await Gamification.findOne({ userId: job.assignedTo });
      if (gamification) {
        await gamification.earnPoints(Math.floor(job.priceKes * 0.1)); // 10% of earning as points
        await gamification.completeJob();
      }
    }

    // Convert to Flutter JobItem format
    const formattedJob = {
      id: job.jobId,
      title: job.title,
      description: job.description,
      location: job.location.address,
      priceKes: job.priceKes,
      status: mapJobStatus(job.status),
      rating: job.rating,
      review: job.review,
      category: job.category,
      urgency: job.urgency,
      estimatedDuration: job.estimatedDuration,
      postedBy: job.postedBy,
      assignedTo: job.assignedTo,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      applicationCount: job.applicationCount,
      maxApplications: job.maxApplications,
      featured: job.featured,
      images: job.images,
      requirements: job.requirements,
      skills: job.skills
    };

    res.json({
      success: true,
      message: 'Job completed successfully',
      data: {
        job: formattedJob
      }
    });
  } catch (error) {
    logger.error('Complete job error', {
      jobId: req.params.id,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to complete job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'COMPLETE_JOB_ERROR'
    });
  }
});

// Get user's jobs (posted or assigned) - matches Flutter JobsProvider
router.get('/user/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params; // 'posted' or 'assigned'
    const { page = 1, limit = 20, status } = req.query;

    if (!['posted', 'assigned'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "posted" or "assigned"',
        code: 'INVALID_TYPE'
      });
    }

    const jobs = await Job.findByUser(req.user.userId, type, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      status
    });

    // Convert to Flutter JobItem format
    const formattedJobs = jobs.map(job => ({
      id: job.jobId,
      title: job.title,
      description: job.description,
      location: job.location.address,
      priceKes: job.priceKes,
      status: mapJobStatus(job.status),
      rating: job.rating,
      review: job.review,
      category: job.category,
      urgency: job.urgency,
      estimatedDuration: job.estimatedDuration,
      postedBy: job.postedBy,
      assignedTo: job.assignedTo,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
      applicationCount: job.applicationCount,
      maxApplications: job.maxApplications,
      featured: job.featured,
      images: job.images,
      requirements: job.requirements,
      skills: job.skills
    }));

    res.json({
      success: true,
      data: {
        jobs: formattedJobs,
        type,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: formattedJobs.length
        }
      }
    });
  } catch (error) {
    logger.error('Get user jobs error', {
      userId: req.user.userId,
      type: req.params.type,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get user jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_USER_JOBS_ERROR'
    });
  }
});

// Get user's applications - matches Flutter JobsProvider
router.get('/applications/my', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const applications = await JobApplication.findByApplicant(req.user.userId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      status
    });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: applications.length
        }
      }
    });
  } catch (error) {
    logger.error('Get user applications error', {
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_APPLICATIONS_ERROR'
    });
  }
});

// Cancel job
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const job = await Job.findOne({ jobId: id });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Check if user owns the job
    if (job.postedBy !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Cancel the job
    await job.cancel(reason || 'Job cancelled by poster');

    // Convert to Flutter JobItem format
    const formattedJob = {
      id: job.jobId,
      title: job.title,
      description: job.description,
      location: job.location.address,
      priceKes: job.priceKes,
      status: mapJobStatus(job.status),
      rating: job.rating,
      review: job.review,
      category: job.category,
      urgency: job.urgency,
      estimatedDuration: job.estimatedDuration,
      postedBy: job.postedBy,
      assignedTo: job.assignedTo,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
      applicationCount: job.applicationCount,
      maxApplications: job.maxApplications,
      featured: job.featured,
      images: job.images,
      requirements: job.requirements,
      skills: job.skills
    };

    res.json({
      success: true,
      message: 'Job cancelled successfully',
      data: {
        job: formattedJob
      }
    });
  } catch (error) {
    logger.error('Cancel job error', {
      jobId: req.params.id,
      userId: req.user.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to cancel job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'CANCEL_JOB_ERROR'
    });
  }
});

// Helper function to map job status to Flutter enum
function mapJobStatus(status) {
  const statusMap = {
    'draft': 'pending',
    'pending': 'pending',
    'active': 'pending',
    'in_progress': 'inProgress',
    'completed': 'completed',
    'cancelled': 'pending',
    'expired': 'pending',
    'paid': 'paid'
  };
  return statusMap[status] || 'pending';
}

module.exports = router;