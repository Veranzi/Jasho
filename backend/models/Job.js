const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  priceKes: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'inProgress', 'completed', 'paid', 'cancelled'],
    default: 'pending'
  },
  postedBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  assignedTo: {
    type: String,
    ref: 'User',
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['Boda Boda', 'Mama Fua', 'Delivery', 'Cleaning', 'Other'],
    default: 'Other'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  estimatedDuration: {
    type: Number, // in hours
    default: null
  },
  requirements: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String, // URLs to uploaded images
    default: []
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: null
  },
  review: {
    type: String,
    trim: true,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ assignedTo: 1, createdAt: -1 });
jobSchema.index({ status: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ priceKes: 1 });

// Virtual for applications count
jobSchema.virtual('applicationsCount', {
  ref: 'JobApplication',
  localField: '_id',
  foreignField: 'jobId',
  count: true
});

// Methods
jobSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  this.status = 'inProgress';
  return this.save();
};

jobSchema.methods.complete = function(rating, review) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (rating !== undefined) this.rating = rating;
  if (review) this.review = review;
  return this.save();
};

jobSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  this.paidAt = new Date();
  return this.save();
};

const jobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Job'
  },
  applicantId: {
    type: String,
    required: true,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  proposedPrice: {
    type: Number,
    min: 0,
    default: null
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
jobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
jobApplicationSchema.index({ applicantId: 1, appliedAt: -1 });
jobApplicationSchema.index({ status: 1 });

module.exports = {
  Job: mongoose.model('Job', jobSchema),
  JobApplication: mongoose.model('JobApplication', jobApplicationSchema)
};