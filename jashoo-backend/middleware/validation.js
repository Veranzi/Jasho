const { body, param, query, validationResult } = require('express-validator');
const validator = require('validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value,
        location: error.location
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
    .custom(async (value) => {
      // Check if email domain is valid
      const domain = value.split('@')[1];
      const validDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
      if (!validDomains.includes(domain.toLowerCase())) {
        throw new Error('Email domain not supported');
      }
      return true;
    }),
  body('phoneNumber')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required')
    .custom((value) => {
      // Check if phone number starts with +254 (Kenya)
      if (!value.startsWith('+254')) {
        throw new Error('Phone number must be a valid Kenyan number (+254)');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array')
    .custom((skills) => {
      if (skills && skills.length > 10) {
        throw new Error('Maximum 10 skills allowed');
      }
      return true;
    }),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .custom((value) => {
      const age = Math.floor((Date.now() - new Date(value)) / (1000 * 60 * 60 * 24 * 365));
      if (age < 18) {
        throw new Error('Must be at least 18 years old');
      }
      if (age > 100) {
        throw new Error('Invalid age');
      }
      return true;
    }),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender selection'),
  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean'),
  handleValidationErrors
];

const validateEmailVerification = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 32, max: 64 })
    .withMessage('Invalid verification token format'),
  handleValidationErrors
];

const validatePhoneVerification = [
  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must contain only numbers'),
  body('phoneNumber')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  handleValidationErrors
];

const validateKYC = [
  body('idType')
    .isIn(['ID', 'Passport', 'Driving_License'])
    .withMessage('ID type must be ID, Passport, or Driving License'),
  body('idNumber')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('ID number must be between 5 and 20 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('ID number can only contain letters and numbers'),
  body('photoUrl')
    .optional()
    .isURL()
    .withMessage('Photo URL must be valid'),
  body('documentUrls')
    .optional()
    .isArray()
    .withMessage('Document URLs must be an array')
    .custom((urls) => {
      if (urls && urls.length > 5) {
        throw new Error('Maximum 5 documents allowed');
      }
      return true;
    }),
  handleValidationErrors
];

// Wallet validation rules
const validateTransaction = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
    .custom((value) => {
      if (value > 1000000) {
        throw new Error('Amount cannot exceed 1,000,000');
      }
      return true;
    }),
  body('currencyCode')
    .isIn(['KES', 'USDT', 'USD'])
    .withMessage('Currency must be KES, USDT, or USD'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters')
    .matches(/^[a-zA-Z0-9\s.,!?-]+$/)
    .withMessage('Description contains invalid characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
  body('method')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Method must be less than 50 characters'),
  body('pin')
    .optional()
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('PIN must be 4-6 digits'),
  handleValidationErrors
];

const validatePin = [
  body('pin')
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('PIN must be 4-6 digits'),
  body('confirmPin')
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('Confirm PIN must be 4-6 digits')
    .custom((value, { req }) => {
      if (value !== req.body.pin) {
        throw new Error('PINs do not match');
      }
      return true;
    }),
  handleValidationErrors
];

const validateTransfer = [
  body('recipientUserId')
    .notEmpty()
    .withMessage('Recipient user ID is required')
    .matches(/^user_\d+_[a-z0-9]+$/)
    .withMessage('Invalid recipient user ID format'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currencyCode')
    .isIn(['KES', 'USDT', 'USD'])
    .withMessage('Currency must be KES, USDT, or USD'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('pin')
    .notEmpty()
    .withMessage('Transaction PIN is required')
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('PIN must be 4-6 digits'),
  handleValidationErrors
];

// Job validation rules
const validateJobPost = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters')
    .matches(/^[a-zA-Z0-9\s.,!?-]+$/)
    .withMessage('Title contains invalid characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('location.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('location.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('location.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('category')
    .isIn(['Boda Boda', 'Mama Fua', 'Delivery', 'Cleaning', 'Construction', 'Gardening', 'Other'])
    .withMessage('Invalid category'),
  body('priceKes')
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Price must be between 100 and 1,000,000 KES'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Urgency must be low, medium, high, or urgent'),
  body('estimatedDuration')
    .optional()
    .isFloat({ min: 0.5, max: 168 })
    .withMessage('Estimated duration must be between 0.5 and 168 hours'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array')
    .custom((requirements) => {
      if (requirements && requirements.length > 10) {
        throw new Error('Maximum 10 requirements allowed');
      }
      return true;
    }),
  body('schedule.startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  body('schedule.endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.schedule.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors
];

const validateJobApplication = [
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be less than 500 characters'),
  body('proposedPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Proposed price must be a positive number'),
  body('estimatedDuration')
    .optional()
    .isFloat({ min: 0.5 })
    .withMessage('Estimated duration must be at least 0.5 hours'),
  handleValidationErrors
];

const validateJobReview = [
  body('rating')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('review')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review must be less than 500 characters'),
  handleValidationErrors
];

// Savings validation rules
const validateSavingsGoal = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Goal name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s.,!?-]+$/)
    .withMessage('Goal name contains invalid characters'),
  body('target')
    .isFloat({ min: 100, max: 10000000 })
    .withMessage('Target amount must be between 100 and 10,000,000'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Due date cannot be in the past');
      }
      return true;
    }),
  body('category')
    .optional()
    .isIn(['Emergency', 'Education', 'Business', 'Personal', 'Other'])
    .withMessage('Invalid category'),
  body('hustle')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Hustle must be less than 50 characters'),
  handleValidationErrors
];

const validateContribution = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Contribution amount must be greater than 0')
    .custom((value) => {
      if (value > 1000000) {
        throw new Error('Contribution cannot exceed 1,000,000');
      }
      return true;
    }),
  body('source')
    .optional()
    .isIn(['manual', 'auto', 'earning', 'bonus'])
    .withMessage('Invalid source'),
  body('hustle')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Hustle must be less than 50 characters'),
  body('pin')
    .notEmpty()
    .withMessage('Transaction PIN is required')
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('PIN must be 4-6 digits'),
  handleValidationErrors
];

const validateLoanRequest = [
  body('amount')
    .isFloat({ min: 1000, max: 1000000 })
    .withMessage('Loan amount must be between 1,000 and 1,000,000'),
  body('purpose')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Purpose must be between 5 and 200 characters')
    .matches(/^[a-zA-Z0-9\s.,!?-]+$/)
    .withMessage('Purpose contains invalid characters'),
  body('termMonths')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Term must be between 1 and 60 months'),
  body('collateral')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Collateral description must be less than 200 characters'),
  handleValidationErrors
];

// Gamification validation rules
const validatePointsRedemption = [
  body('points')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer')
    .custom((value) => {
      if (value > 10000) {
        throw new Error('Cannot redeem more than 10,000 points at once');
      }
      return true;
    }),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reason must be less than 100 characters'),
  handleValidationErrors
];

// Chatbot validation rules
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .custom((value) => {
      // Check for inappropriate content
      const inappropriateWords = ['spam', 'scam', 'fraud', 'hack'];
      if (inappropriateWords.some(word => value.toLowerCase().includes(word))) {
        throw new Error('Message contains inappropriate content');
      }
      return true;
    }),
  body('includeContext')
    .optional()
    .isBoolean()
    .withMessage('Include context must be a boolean'),
  handleValidationErrors
];

// Parameter validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validateUserId = [
  param('userId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('User ID is required')
    .matches(/^user_\d+_[a-z0-9]+$/)
    .withMessage('Invalid user ID format'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'rating', 'price', 'title'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  handleValidationErrors
];

const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
  query('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  handleValidationErrors
];

// File upload validation
const validateFileUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('File is required');
      }
      
      const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'pdf'];
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        throw new Error(`File type ${fileExtension} not allowed`);
      }
      
      const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
      if (req.file.size > maxSize) {
        throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      }
      
      return true;
    }),
  handleValidationErrors
];

// Password validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  handleValidationErrors
];

// Phone number validation
const validatePhoneNumber = [
  body('phoneNumber')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required')
    .custom((value) => {
      if (!value.startsWith('+254')) {
        throw new Error('Phone number must be a valid Kenyan number (+254)');
      }
      return true;
    }),
  handleValidationErrors
];

// Email validation
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
    .custom(async (value) => {
      const domain = value.split('@')[1];
      const validDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
      if (!validDomains.includes(domain.toLowerCase())) {
        throw new Error('Email domain not supported');
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateEmailVerification,
  validatePhoneVerification,
  validateKYC,
  validateTransaction,
  validatePin,
  validateTransfer,
  validateJobPost,
  validateJobApplication,
  validateJobReview,
  validateSavingsGoal,
  validateContribution,
  validateLoanRequest,
  validatePointsRedemption,
  validateChatMessage,
  validateObjectId,
  validateUserId,
  validatePagination,
  validateSearchQuery,
  validateFileUpload,
  validatePasswordChange,
  validatePhoneNumber,
  validateEmail
};