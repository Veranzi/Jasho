const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  // Basic Information
  applicationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Job',
    index: true
  },
  applicantId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  
  // Application Details
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
    index: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  proposedPrice: {
    type: Number,
    min: 0
  },
  estimatedDuration: {
    type: Number, // in hours
    min: 0.5
  },
  
  // Application Metadata
  appliedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  respondedAt: {
    type: Date,
    default: null
  },
  
  // Review Information
  reviewedBy: {
    type: String,
    ref: 'User',
    default: null
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Additional Information
  attachments: [{
    type: String, // URLs to uploaded files
    description: String
  }],
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const jobSchema = new mongoose.Schema({
  // Basic Information
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 2000
  },
  
  // Location Information
  location: {
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true
    },
    district: {
      type: String,
      trim: true,
      maxlength: 50
    }
  },
  
  // Job Details
  category: {
    type: String,
    required: true,
    enum: ['Boda Boda', 'Mama Fua', 'Delivery', 'Cleaning', 'Construction', 'Gardening', 'Other'],
    index: true
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: 50
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Pricing Information
  priceKes: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  priceUsd: {
    type: Number,
    min: 0
  },
  priceType: {
    type: String,
    enum: ['fixed', 'hourly', 'negotiable'],
    default: 'fixed'
  },
  estimatedDuration: {
    type: Number, // in hours
    min: 0.5,
    max: 168 // 1 week max
  },
  
  // Job Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'in_progress', 'completed', 'cancelled', 'expired'],
    default: 'pending',
    index: true
  },
  
  // User Information
  postedBy: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  assignedTo: {
    type: String,
    ref: 'User',
    default: null,
    index: true
  },
  
  // Job Requirements
  requirements: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  skills: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  experience: {
    type: String,
    enum: ['beginner', 'intermediate', 'experienced', 'expert'],
    default: 'beginner'
  },
  
  // Scheduling
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    flexible: {
      type: Boolean,
      default: false
    },
    timeSlots: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String,
      endTime: String
    }]
  },
  
  // Media and Attachments
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  documents: [{
    url: String,
    name: String,
    type: String
  }],
  
  // Completion Information
  completedAt: {
    type: Date,
    default: null
  },
  completionNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  completionImages: [{
    url: String,
    caption: String
  }],
  
  // Rating and Review
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: null
  },
  review: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  
  // Payment Information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['wallet', 'mpesa', 'bank_transfer', 'cash'],
      default: 'wallet'
    },
    transactionId: {
      type: String,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    amount: {
      type: Number,
      default: null
    }
  },
  
  // Application Management
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobApplication'
  }],
  applicationCount: {
    type: Number,
    default: 0
  },
  maxApplications: {
    type: Number,
    default: 10
  },
  
  // Visibility and Promotion
  visibility: {
    type: String,
    enum: ['public', 'private', 'featured'],
    default: 'public'
  },
  promotedUntil: {
    type: Date,
    default: null
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    },
    index: true
  },
  
  // Statistics
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Audit Information
  audit: {
    createdBy: {
      type: String,
      default: 'system'
    },
    modifiedBy: {
      type: String,
      default: null
    },
    version: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ assignedTo: 1, createdAt: -1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ 'location.city': 1, status: 1 });
jobSchema.index({ priceKes: 1, status: 1 });
jobSchema.index({ urgency: 1, status: 1 });
jobSchema.index({ expiresAt: 1 });
jobSchema.index({ featured: 1, status: 1 });
jobSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });

jobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
jobApplicationSchema.index({ applicantId: 1, appliedAt: -1 });
jobApplicationSchema.index({ status: 1, appliedAt: -1 });

// Virtual fields
jobSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

jobSchema.virtual('isActive').get(function() {
  return this.status === 'active' || this.status === 'in_progress';
});

jobSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

jobSchema.virtual('isCancelled').get(function() {
  return this.status === 'cancelled';
});

jobSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

jobSchema.virtual('canApply').get(function() {
  return this.status === 'active' && 
         this.applicationCount < this.maxApplications && 
         !this.isExpired;
});

jobSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.expiresAt - now;
  return remaining > 0 ? remaining : 0;
});

jobSchema.virtual('duration').get(function() {
  if (this.schedule.startDate && this.schedule.endDate) {
    return this.schedule.endDate - this.schedule.startDate;
  }
  return null;
});

jobApplicationSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

jobApplicationSchema.virtual('isAccepted').get(function() {
  return this.status === 'accepted';
});

jobApplicationSchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

// Pre-save middleware
jobSchema.pre('save', function(next) {
  // Generate job ID if not exists
  if (!this.jobId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9);
    this.jobId = `JOB_${timestamp}_${random}`.toUpperCase();
  }
  
  // Update application count
  this.applicationCount = this.applications.length;
  
  next();
});

jobApplicationSchema.pre('save', function(next) {
  // Generate application ID if not exists
  if (!this.applicationId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9);
    this.applicationId = `APP_${timestamp}_${random}`.toUpperCase();
  }
  
  next();
});

// Job methods
jobSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  this.status = 'in_progress';
  return this.save();
};

jobSchema.methods.complete = function(rating, review, completionNotes, completionImages) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (rating !== undefined) this.rating = rating;
  if (review) this.review = review;
  if (completionNotes) this.completionNotes = completionNotes;
  if (completionImages) this.completionImages = completionImages;
  return this.save();
};

jobSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.completionNotes = reason;
  return this.save();
};

jobSchema.methods.markAsPaid = function(transactionId, amount) {
  this.payment.status = 'completed';
  this.payment.transactionId = transactionId;
  this.payment.amount = amount;
  this.payment.paidAt = new Date();
  return this.save();
};

jobSchema.methods.addApplication = function(applicationId) {
  if (this.applications.indexOf(applicationId) === -1) {
    this.applications.push(applicationId);
    this.applicationCount = this.applications.length;
  }
  return this.save();
};

jobSchema.methods.removeApplication = function(applicationId) {
  const index = this.applications.indexOf(applicationId);
  if (index > -1) {
    this.applications.splice(index, 1);
    this.applicationCount = this.applications.length;
  }
  return this.save();
};

jobSchema.methods.incrementViews = function() {
  this.statistics.views += 1;
  return this.save();
};

jobSchema.methods.incrementShares = function() {
  this.statistics.shares += 1;
  return this.save();
};

jobSchema.methods.incrementSaves = function() {
  this.statistics.saves += 1;
  return this.save();
};

jobSchema.methods.extendExpiration = function(days) {
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

jobSchema.methods.promote = function(days) {
  this.featured = true;
  this.promotedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

// JobApplication methods
jobApplicationSchema.methods.accept = function(reviewedBy, reviewNotes) {
  this.status = 'accepted';
  this.reviewedBy = reviewedBy;
  this.reviewNotes = reviewNotes;
  this.reviewedAt = new Date();
  this.respondedAt = new Date();
  return this.save();
};

jobApplicationSchema.methods.reject = function(reviewedBy, rejectionReason) {
  this.status = 'rejected';
  this.reviewedBy = reviewedBy;
  this.rejectionReason = rejectionReason;
  this.reviewedAt = new Date();
  this.respondedAt = new Date();
  return this.save();
};

jobApplicationSchema.methods.withdraw = function() {
  this.status = 'withdrawn';
  this.respondedAt = new Date();
  return this.save();
};

// Static methods
jobSchema.statics.findActiveJobs = function(options = {}) {
  const { limit = 20, skip = 0, category, location, minPrice, maxPrice, urgency } = options;
  
  const query = {
    status: { $in: ['active', 'pending'] },
    expiresAt: { $gt: new Date() }
  };
  
  if (category) query.category = category;
  if (location) query['location.city'] = new RegExp(location, 'i');
  if (minPrice || maxPrice) {
    query.priceKes = {};
    if (minPrice) query.priceKes.$gte = minPrice;
    if (maxPrice) query.priceKes.$lte = maxPrice;
  }
  if (urgency) query.urgency = urgency;
  
  return this.find(query)
    .populate('postedBy', 'userId fullName rating')
    .sort({ featured: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

jobSchema.statics.findByUser = function(userId, type = 'posted', options = {}) {
  const { limit = 20, skip = 0, status } = options;
  
  const query = {};
  if (type === 'posted') {
    query.postedBy = userId;
  } else if (type === 'assigned') {
    query.assignedTo = userId;
  }
  
  if (status) query.status = status;
  
  return this.find(query)
    .populate('postedBy', 'userId fullName rating')
    .populate('assignedTo', 'userId fullName rating')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

jobSchema.statics.findExpiredJobs = function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    status: { $in: ['pending', 'active'] }
  });
};

jobSchema.statics.getJobStats = function(userId, startDate, endDate) {
  const matchQuery = { postedBy: userId };
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = startDate;
    if (endDate) matchQuery.createdAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$priceKes' },
        avgValue: { $avg: '$priceKes' }
      }
    }
  ]);
};

jobSchema.statics.searchJobs = function(searchQuery, options = {}) {
  const { limit = 20, skip = 0, category, location, minPrice, maxPrice } = options;
  
  const query = {
    status: { $in: ['active', 'pending'] },
    expiresAt: { $gt: new Date() }
  };
  
  if (searchQuery) {
    query.$or = [
      { title: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
      { skills: { $in: [new RegExp(searchQuery, 'i')] } }
    ];
  }
  
  if (category) query.category = category;
  if (location) query['location.city'] = new RegExp(location, 'i');
  if (minPrice || maxPrice) {
    query.priceKes = {};
    if (minPrice) query.priceKes.$gte = minPrice;
    if (maxPrice) query.priceKes.$lte = maxPrice;
  }
  
  return this.find(query)
    .populate('postedBy', 'userId fullName rating')
    .sort({ featured: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

jobApplicationSchema.statics.findByApplicant = function(applicantId, options = {}) {
  const { limit = 20, skip = 0, status } = options;
  
  const query = { applicantId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('jobId')
    .sort({ appliedAt: -1 })
    .limit(limit)
    .skip(skip);
};

jobApplicationSchema.statics.findByJob = function(jobId, options = {}) {
  const { limit = 20, skip = 0, status } = options;
  
  const query = { jobId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('applicantId', 'userId fullName rating skills')
    .sort({ appliedAt: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = {
  Job: mongoose.model('Job', jobSchema),
  JobApplication: mongoose.model('JobApplication', jobApplicationSchema)
};