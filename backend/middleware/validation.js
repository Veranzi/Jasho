const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
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
    .withMessage('Valid email is required'),
  body('phoneNumber')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateKYC = [
  body('idType')
    .isIn(['ID', 'Passport'])
    .withMessage('ID type must be either ID or Passport'),
  body('idNumber')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('ID number must be between 5 and 20 characters'),
  body('photoUrl')
    .optional()
    .isURL()
    .withMessage('Photo URL must be valid'),
  handleValidationErrors
];

// Wallet validation rules
const validateTransaction = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currencyCode')
    .isIn(['KES', 'USDT'])
    .withMessage('Currency must be KES or USDT'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
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
  handleValidationErrors
];

const validatePin = [
  body('pin')
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
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('priceKes')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),
  body('category')
    .optional()
    .isIn(['Boda Boda', 'Mama Fua', 'Delivery', 'Cleaning', 'Other'])
    .withMessage('Invalid category'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Urgency must be low, medium, or high'),
  body('estimatedDuration')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Estimated duration must be greater than 0'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
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
    .isFloat({ min: 0.01 })
    .withMessage('Proposed price must be greater than 0'),
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
    .withMessage('Goal name must be between 2 and 100 characters'),
  body('target')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be greater than 0'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
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
    .withMessage('Contribution amount must be greater than 0'),
  body('source')
    .optional()
    .isIn(['manual', 'auto', 'earning', 'bonus'])
    .withMessage('Invalid source'),
  body('hustle')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Hustle must be less than 50 characters'),
  handleValidationErrors
];

const validateLoanRequest = [
  body('amount')
    .isFloat({ min: 100, max: 100000 })
    .withMessage('Loan amount must be between 100 and 100,000 KES'),
  body('purpose')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Purpose must be between 5 and 200 characters'),
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
    .withMessage('Points must be a positive integer'),
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
    .withMessage('User ID is required'),
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
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateKYC,
  validateTransaction,
  validatePin,
  validateJobPost,
  validateJobApplication,
  validateJobReview,
  validateSavingsGoal,
  validateContribution,
  validateLoanRequest,
  validatePointsRedemption,
  validateObjectId,
  validateUserId,
  validatePagination
};